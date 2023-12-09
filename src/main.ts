import "./style.css";

interface Position {
  x: number;
  y: number;
}

interface StickerData {
  x: number;
  y: number;
  emoji: string;
  size: number;
}

const initialStickers: StickerData[] = [
  { x: 50, y: 50, emoji: "😊", size: 30 },
  { x: 100, y: 100, emoji: "🌟", size: 40 },
];

class MarkerLine {
  private points: Position[] = [];
  private lineWidth: number;
  private color: string;

  constructor(initialPosition: Position, lineWidth: number, color: string) {
    this.color = color;
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
  getDataForUndo() {
    return {
      points: this.points.map((point) => ({ x: point.x, y: point.y })), // Shallow copy of the points array
      lineWidth: this.lineWidth,
      color: this.color,
    };
  }
}

class ToolPreview {
  private x: number | null = null;
  private y: number | null = null;
  private radius: number;
  private color: string;
  private rotation: number;

  constructor(radius: number, color: string, rotation: number) {
    this.radius = radius;
    this.color = color;
    this.rotation = rotation;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.x !== null && this.y !== null) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    }
  }

  getColor(): string {
    return this.color;
  }

  getRotation(): number {
    return this.rotation;
  }
}

class Sticker {
  private x: number;
  private y: number;
  private emoji: string;
  private size: number;
  private color: string;
  private rotation: number;

  constructor(
    x: number,
    y: number,
    emoji: string,
    size: number,
    color: string,
    rotation: number
  ) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.size = size;
    this.color = color;
    this.rotation = rotation;
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

  static createFromData(data: StickerData) {
    return new Sticker(
      data.x,
      data.y,
      data.emoji,
      data.size,
      getRandomColor(),
      getRandomRotation()
    );
  }
  getColor(): string {
    return this.color;
  }

  getRotation(): number {
    return this.rotation;
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
document.title = "JSTN's game";

const header = document.createElement("h1");
header.innerHTML = "JSTN's game";
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.classList.add("canvas-style");
app.appendChild(canvas);

const ctx = canvas.getContext("2d");

let isDrawing = false;
let displayList: MarkerLine[] = [];
let undoStack: MarkerLine[] = [];
let selectedLineWidth = 2;
let selectedSticker: Sticker | null = null;

let toolPreview: ToolPreview | null = null;

let currentColor = getRandomColor();
let currentRotation = getRandomRotation();

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  const line = new MarkerLine({ x, y }, selectedLineWidth, currentColor);
  displayList.push(line);
  clearUndoStack();
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;

  if (!isDrawing) {
    // If not drawing, update the tool preview
    if (!toolPreview) {
      toolPreview = new ToolPreview(
        selectedLineWidth,
        currentColor,
        currentRotation
      );
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

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;

  const line = createMarkerLine(x, y);

  displayList.push(line);
  clearUndoStack();
});

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    displayList = [];
    clearUndoStack();
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
  }
});

app.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastAction = displayList.pop();
    if (lastAction) {
      undoStack.push(lastAction);
      const event = new Event("drawing-changed");
      canvas.dispatchEvent(event);
    }
  }
});

app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  if (undoStack.length > 0) {
    const lastAction = undoStack.pop();
    if (lastAction) {
      displayList.push(lastAction);
      const event = new Event("drawing-changed");
      canvas.dispatchEvent(event);
    }
  }
});

app.appendChild(redoButton);

const thinToolButton = document.createElement("button");
thinToolButton.textContent = "Thin";
thinToolButton.addEventListener("click", () => {
  updateToolStyles(2);
  randomizeToolProperties();
});

const thickToolButton = document.createElement("button");
thickToolButton.textContent = "Thick";
thickToolButton.addEventListener("click", () => {
  updateToolStyles(5);
  randomizeToolProperties();
});

function updateToolStyles(lineWidth: number) {
  selectedLineWidth = lineWidth;
  updateToolButtonStyles();
}

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

  initialStickers.forEach((sticker, index) => {
    const stickerButton = document.createElement("button");
    stickerButton.textContent = `Sticker ${index + 1}`;
    stickerButton.id = `sticker-${index}`;
    stickerButton.addEventListener("click", () => {
      selectedSticker = createSticker(sticker.x, sticker.y);
      updateToolButtonStyles();
    });
    app.appendChild(stickerButton);
  });
}

const previewStickerButton = document.createElement("button");
previewStickerButton.textContent = "Preview Sticker";
previewStickerButton.addEventListener("click", () => {
  if (ctx && selectedSticker) {
    const previewCommand = new StickerPreviewCommand(selectedSticker, ctx);
    previewCommand.execute();
  } else {
    console.error("Canvas context (ctx) or selectedSticker is null.");
  }
});

app.appendChild(previewStickerButton);
canvas.addEventListener("tool-moved", () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of displayList) {
      line.display(ctx);
    }
    initialStickers.forEach((sticker) => {
      const previewSticker = new Sticker(
        sticker.x,
        sticker.y,
        sticker.emoji,
        sticker.size,
        currentColor,
        currentRotation
      );
      previewSticker.preview(ctx);
    });
    if (toolPreview) {
      toolPreview.draw(ctx);
    }
  } else {
    console.error("Failed to get 2D context for the canvas");
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
  if (ctx && selectedSticker) {
    const applyCommand = new StickerApplyCommand(selectedSticker, ctx);
    applyCommand.execute();
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    console.error("Canvas context (ctx) or selectedSticker is null.");
  }
});

app.appendChild(applyStickerButton);

app.appendChild(applyStickerButton);

const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportButton.addEventListener("click", () => {
  exportDrawing();
});

app.appendChild(exportButton);

function exportDrawing() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    exportCtx.scale(4, 4);

    for (const item of displayList) {
      if (!(item instanceof ToolPreview)) {
        item.display(exportCtx);
      }
    }

    const dataURL = exportCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "exported_drawing.png";
    a.click();
  } else {
    console.error("Unable to obtain 2D context for exportCanvas.");
  }
}

function createMarkerLine(x: number, y: number) {
  return new MarkerLine({ x, y }, selectedLineWidth, currentColor);
}

let currentEmoji: string = "😊";
let currentSize: number = 30;

function createSticker(x: number, y: number) {
  return new Sticker(
    x,
    y,
    currentEmoji,
    currentSize,
    currentColor,
    currentRotation
  );
}
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomRotation() {
  return Math.random() * 360;
}

thinToolButton.addEventListener("click", () => {
  selectedLineWidth = 2;
  updateToolButtonStyles();
  randomizeToolProperties();
});

thickToolButton.addEventListener("click", () => {
  selectedLineWidth = 5;
  updateToolButtonStyles();
  randomizeToolProperties();
});

function randomizeToolProperties() {
  currentColor = getRandomColor();
  currentRotation = getRandomRotation();
}

function createToolPreview() {
  return new ToolPreview(selectedLineWidth, currentColor, currentRotation);
}

let x: number;
let y: number;

canvas.addEventListener("mousemove", (e) => {
  x = e.clientX - canvas.offsetLeft;
  y = e.clientY - canvas.offsetTop;

  if (!isDrawing) {
    if (!toolPreview) {
      toolPreview = createToolPreview();
    }
    const toolMovedEvent = new Event("tool-moved");
    canvas.dispatchEvent(toolMovedEvent);
  } else {
    displayList[displayList.length - 1].drag(x, y);
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

thinToolButton.addEventListener("click", () => {
  selectedLineWidth = 2;
  updateToolButtonStyles();
  randomizeToolProperties();
});

thickToolButton.addEventListener("click", () => {
  selectedLineWidth = 5;
  updateToolButtonStyles();
  randomizeToolProperties();
});

canvas.classList.add("canvas-style");
clearButton.classList.add("tool-button");
undoButton.classList.add("tool-button");
redoButton.classList.add("tool-button");
thinToolButton.classList.add("tool-button", "selected-tool");
thickToolButton.classList.add("tool-button");
exportButton.classList.add("tool-button");
applyStickerButton.classList.add("tool-button");
