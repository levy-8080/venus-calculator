const display = document.querySelector(".calculator input");
const buttons = document.querySelectorAll(".calculator button");

// Tokens are numbers, operators, or "%" (percent-apply), e.g. ["12", "+", "5", "%"]
let tokens = [];
let justEvaluated = false;

const OPERATORS = ["+", "-", "*", "/"];
const isOperator = (t) => OPERATORS.includes(t);

function render(value = tokens.join("")) {
  display.value = value;
}

// Prevent the expression from running off the visible input
function overflow(value) {
  return value.length > 16;
}

function pushNumber(ch) {
  if (justEvaluated) {
    // "." or a digit continue the result; an operator starts fresh next call
    tokens = /[0-9.]/.test(ch) ? tokens : [];
    justEvaluated = false;
  }

  const last = tokens[tokens.length - 1];

  if (last === undefined || isOperator(last)) {
    // A number must start with 0. rather than a bare dot
    tokens.push(ch === "." ? "0." : ch);
  } else if (last === "%") {
    // A number after % starts a new term, so add the implied multiplication
    tokens.push("*", ch === "." ? "0." : ch);
  } else {
    if (ch === "." && last.includes(".")) return;
    // Drop a lone leading 0 so "0" then "5" gives "5", not "05"
    if (ch !== "." && last === "0") tokens[tokens.length - 1] = ch;
    else tokens[tokens.length - 1] = last + ch;
  }

  renderIfFits(tokens.join(""));
}

function pushOperator(op) {
  justEvaluated = false;
  const last = tokens[tokens.length - 1];

  if (last === undefined) {
    if (op !== "-") return;
  } else if (isOperator(last)) {
    tokens[tokens.length - 1] = op;
  } else if (last === "%") {
    // Replaces the operator that a trailing % multiplication implied
    tokens[tokens.length - 1] = op;
  }

  tokens.push(op);
  renderIfFits(tokens.join(""));
}

function pushPercent() {
  justEvaluated = false;
  const last = tokens[tokens.length - 1];
  if (last === undefined || isOperator(last) || last === "%") return;
  tokens.push("%");
  renderIfFits(tokens.join(""));
}

function renderIfFits(value) {
  if (overflow(value)) {
    tokens.pop();
    return;
  }
  render(value);
}

function clearAll() {
  tokens = [];
  justEvaluated = false;
  render("0");
}

function backspace() {
  justEvaluated = false;
  const last = tokens.pop();
  if (last !== undefined && last.length > 1) {
    tokens.push(last.slice(0, -1));
  }
  render(tokens.join("") || "0");
}

function evaluate() {
  if (tokens.length === 0) return;
  // A trailing operator is meaningless when evaluating
  if (isOperator(tokens[tokens.length - 1])) return;

  const expr = tokens.join("");

  try {
    // Safe: input is built only from digits, . + - * / and %, and % becomes /100
    const result = Function(`"use strict";return (${expr.replace(/%/g, "/100")})`)();

    if (typeof result !== "number" || !isFinite(result)) throw new Error();

    const value = String(parseFloat(result.toPrecision(12)));
    render(value);
    tokens = [value];
    justEvaluated = true;
  } catch {
    render("Error");
    tokens = [];
    justEvaluated = true;
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.textContent.trim();

    if (key === "AC") clearAll();
    else if (key === "DEL") backspace();
    else if (key === "=") evaluate();
    else if (key === "%") pushPercent();
    else if (isOperator(key)) pushOperator(key);
    else pushNumber(key);
  });
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") pushNumber(e.key);
  else if (e.key === ".") pushNumber(".");
  else if (OPERATORS.includes(e.key)) pushOperator(e.key);
  else if (e.key === "%") pushPercent();
  else if (e.key === "Enter" || e.key === "=") {
    e.preventDefault();
    evaluate();
  } else if (e.key === "Backspace") backspace();
  else if (e.key === "Escape") clearAll();
});

clearAll();
