import "./style.css";

class MarkerLine {
  private points: Array<{ x: number; y: number }> = [];
  private lineWidth: number;

  constructor(initialPosition: { x: number; y: number }, lineWidth: number) {
    this.points.push(initialPosition);
    this.lineWidth = lineWidth;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineWidth = this.lineWidth;

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.stroke();
    ctx.closePath();
  }
}

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "My game";

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
let displayList: Array<MarkerLine> = [];
let undoStack: Array<MarkerLine> = [];
let selectedLineWidth = 2;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  const line = new MarkerLine({ x, y }, selectedLineWidth);
  displayList.push(line);
  clearUndoStack();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  displayList[displayList.length - 1].drag(x, y);
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
  displayList = [];
  clearUndoStack();
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
});

app.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastLine = displayList.pop();
    undoStack.push(lastLine);
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
  }
});

app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  if (undoStack.length > 0) {
    const lastLine = undoStack.pop();
    displayList.push(lastLine);
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
  }
});

app.appendChild(redoButton);

const thinToolButton = document.createElement("button");
thinToolButton.textContent = "Thin";
thinToolButton.addEventListener("click", () => {
  selectedLineWidth = 2;
  updateToolButtonStyles();
});

const thickToolButton = document.createElement("button");
thickToolButton.textContent = "Thick";
thickToolButton.addEventListener("click", () => {
  selectedLineWidth = 5;
  updateToolButtonStyles();
});

app.appendChild(thinToolButton);
app.appendChild(thickToolButton);

// Set the default tool style
thinToolButton.classList.add("selectedTool");

// Update the tool buttons' styles
function updateToolButtonStyles() {
  thinToolButton.classList.remove("selectedTool");
  thickToolButton.classList.remove("selectedTool");
  if (selectedLineWidth === 2) {
    thinToolButton.classList.add("selectedTool");
  } else {
    thickToolButton.classList.add("selectedTool");
  }
}

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of displayList) {
    line.display(ctx);
  }
});

function clearUndoStack() {
  undoStack = [];
}
