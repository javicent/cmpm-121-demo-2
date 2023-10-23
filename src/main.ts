import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "JSTN's game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

canvas.classList.add("canvas-style");

app.appendChild(canvas);

const ctx = canvas.getContext("2d");

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.closePath();
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  ctx.closePath();
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

app.appendChild(clearButton);
