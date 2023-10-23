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
let drawingData: Array<Array<{ x: number; y: number }>> = [];
let redoStack: Array<Array<{ x: number; y: number }>> = [];

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  drawingData.push([{ x, y }]);
  clearRedoStack();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  drawingData[drawingData.length - 1].push({ x, y });
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawingData = [];
  clearRedoStack();
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
});

app.appendChild(clearButton);

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of drawingData) {
    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (const point of line) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.closePath();
  }
});

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
  if (drawingData.length > 0) {
    const lastLine = drawingData.pop();
    redoStack.push(lastLine);
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
  }
});

app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastLine = redoStack.pop();
    drawingData.push(lastLine);
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
  }
});

app.appendChild(redoButton);

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of drawingData) {
    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (const point of line) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.closePath();
  }
});

function clearRedoStack() {
  redoStack = [];
}
