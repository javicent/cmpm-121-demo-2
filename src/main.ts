import "./style.css";

const initialStickers = [
  { x: 50, y: 50, emoji: "😊", size: 30 },
  { x: 100, y: 100, emoji: "🌟", size: 40 },
];

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

class ToolPreview {
  private x: number | null = null;
  private y: number | null = null;
  private radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.x !== null && this.y !== null) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    }
  }
}

class Sticker {
  private x: number;
  private y: number;
  private emoji: string;
  private size: number;

  constructor(x: number, y: number, emoji: string, size: number) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.size = size;
  }

  preview(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px Arial`;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(this.emoji, this.x, this.y);
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px Arial`;
    ctx.fillText(this.emoji, this.x, this.y);
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  static createFromData(data) {
    return new Sticker(data.x, data.y, data.emoji, data.size);
  }
}

class StickerPreviewCommand {
  private sticker: Sticker;
  private ctx: CanvasRenderingContext2D;

  constructor(sticker: Sticker, ctx: CanvasRenderingContext2D) {
    this.sticker = sticker;
    this.ctx = ctx;
  }

  execute() {
    this.sticker.preview(this.ctx);
  }
}

class StickerApplyCommand {
  private sticker: Sticker;
  private ctx: CanvasRenderingContext2D;

  constructor(sticker: Sticker, ctx: CanvasRenderingContext2D) {
    this.sticker = sticker;
    this.ctx = ctx;
  }

  execute() {
    this.sticker.apply(this.ctx);
  }
}
const app: HTMLDivElement = document.querySelector("#app")!;
document.title = "My game";

const header = document.createElement("h1");
header.innerHTML = "My game";
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

let toolPreview: ToolPreview | null = null;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  const line = new MarkerLine({ x, y }, selectedLineWidth);
  displayList.push(line);
  clearUndoStack();
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;

  if (!isDrawing) {
    // If not drawing, update the tool preview
    if (!toolPreview) {
      toolPreview = new ToolPreview(selectedLineWidth);
    }
    toolPreview.updatePosition(x, y);
    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent);
  } else {
    // If drawing, update the last line in the display list
    displayList[displayList.length - 1].drag(x, y);
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  toolPreview = null;
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  toolPreview = null;
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

thinToolButton.classList.add("selectedTool");

function updateToolButtonStyles() {
  thinToolButton.classList.remove("selectedTool");
  thickToolButton.classList.remove("selectedTool");
  if (selectedLineWidth === 2) {
    thinToolButton.classList.add("selectedTool");
  } else {
    thickToolButton.classList.add("selectedTool");
  }

  stickers.forEach((sticker, index) => {
    const stickerButton = document.createElement("button");
    stickerButton.textContent = `Sticker ${index + 1}`;
    stickerButton.id = `sticker-${index}`;
    stickerButton.addEventListener("click", () => {
      selectedSticker = sticker;
      updateToolButtonStyles();
    });
    app.appendChild(stickerButton);
  });
}

canvas.addEventListener("tool-moved", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of displayList) {
    line.display(ctx);
  }
  stickers.forEach((sticker) => {
    sticker.preview(ctx);
  });
  if (toolPreview) {
    toolPreview.draw(ctx);
  }
});

canvas.addEventListener("drawing-changed", () => {
  updateToolButtonStyles();
});

function clearUndoStack() {
  undoStack = [];
}

const applyStickerButton = document.createElement("button");
applyStickerButton.textContent = "Apply Sticker";
applyStickerButton.addEventListener("click", () => {
  if (selectedSticker) {
    const applyCommand = new StickerApplyCommand(selectedSticker, ctx);
    applyCommand.execute();
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

app.appendChild(applyStickerButton);
