// ============================================================================
// BlockSnap Extension - Region Selector
// Handles drag-to-select region capture functionality
// ============================================================================

import type { RegionSelection } from "../shared/types";
import { OVERLAY_Z_INDEX } from "../shared/constants";

const REGION_OVERLAY_ID = "blocksnap-region-overlay";
const REGION_SELECTION_ID = "blocksnap-region-selection";
const REGION_DIMENSIONS_ID = "blocksnap-region-dimensions";
const REGION_INSTRUCTIONS_ID = "blocksnap-region-instructions";

interface RegionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

let overlayElement: HTMLDivElement | null = null;
let selectionElement: HTMLDivElement | null = null;
let dimensionsElement: HTMLDivElement | null = null;
let instructionsElement: HTMLDivElement | null = null;

let state: RegionState = {
  isSelecting: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
};

let onSelectionComplete: ((selection: RegionSelection | null) => void) | null =
  null;

// ============================================================================
// Style Injection
// ============================================================================

function injectStyles(): void {
  if (document.getElementById("blocksnap-region-styles")) return;

  const styles = document.createElement("style");
  styles.id = "blocksnap-region-styles";
  styles.textContent = `
    #${REGION_OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: ${OVERLAY_Z_INDEX};
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(1px);
      cursor: crosshair;
      user-select: none;
      -webkit-user-select: none;
    }
    
    #${REGION_SELECTION_ID} {
      position: absolute;
      border: 2px dashed #a855f7;
      background: rgba(168, 85, 247, 0.1);
      box-shadow: 
        0 0 0 9999px rgba(0, 0, 0, 0.5),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
      pointer-events: none;
    }
    
    #${REGION_DIMENSIONS_ID} {
      position: absolute;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-family: ui-monospace, 'SF Mono', monospace;
      font-size: 12px;
      color: white;
      white-space: nowrap;
      pointer-events: none;
      transform: translate(-50%, -100%);
      margin-top: -12px;
    }
    
    #${REGION_INSTRUCTIONS_ID} {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: ${OVERLAY_Z_INDEX + 1};
    }
    
    #${REGION_INSTRUCTIONS_ID} kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #333;
      border: 1px solid #444;
      border-radius: 4px;
      font-family: inherit;
      font-size: 11px;
      color: #ccc;
    }
    
    .blocksnap-region-active {
      cursor: crosshair !important;
    }
    
    .blocksnap-region-active * {
      cursor: crosshair !important;
    }
  `;

  document.head.appendChild(styles);
}

// ============================================================================
// DOM Creation
// ============================================================================

function createOverlay(): void {
  if (overlayElement) return;

  injectStyles();

  // Create overlay
  overlayElement = document.createElement("div");
  overlayElement.id = REGION_OVERLAY_ID;

  // Create selection box (hidden initially)
  selectionElement = document.createElement("div");
  selectionElement.id = REGION_SELECTION_ID;
  selectionElement.style.display = "none";

  // Create dimensions label
  dimensionsElement = document.createElement("div");
  dimensionsElement.id = REGION_DIMENSIONS_ID;
  dimensionsElement.style.display = "none";

  // Create instructions
  instructionsElement = document.createElement("div");
  instructionsElement.id = REGION_INSTRUCTIONS_ID;
  instructionsElement.innerHTML = `
    <span>Drag to select a region</span>
    <span style="color: #666;">|</span>
    <span><kbd>ESC</kbd> to cancel</span>
  `;

  overlayElement.appendChild(selectionElement);
  overlayElement.appendChild(dimensionsElement);
  document.body.appendChild(overlayElement);
  document.body.appendChild(instructionsElement);

  // Add event listeners
  overlayElement.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("keydown", handleKeyDown);

  document.body.classList.add("blocksnap-region-active");
}

// ============================================================================
// DOM Cleanup
// ============================================================================

function destroyOverlay(): void {
  if (overlayElement) {
    overlayElement.removeEventListener("mousedown", handleMouseDown);
    overlayElement.remove();
    overlayElement = null;
  }

  if (instructionsElement) {
    instructionsElement.remove();
    instructionsElement = null;
  }

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("keydown", handleKeyDown);

  selectionElement = null;
  dimensionsElement = null;

  document.body.classList.remove("blocksnap-region-active");

  const styles = document.getElementById("blocksnap-region-styles");
  if (styles) styles.remove();

  // Reset state
  state = {
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  };
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleMouseDown(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();

  state.isSelecting = true;
  state.startX = e.clientX;
  state.startY = e.clientY;
  state.currentX = e.clientX;
  state.currentY = e.clientY;

  if (selectionElement) {
    selectionElement.style.display = "block";
    updateSelectionBox();
  }

  // Update instructions
  if (instructionsElement) {
    instructionsElement.innerHTML = `
      <span>Release to capture</span>
      <span style="color: #666;">|</span>
      <span><kbd>ESC</kbd> to cancel</span>
    `;
  }
}

function handleMouseMove(e: MouseEvent): void {
  if (!state.isSelecting) return;

  state.currentX = e.clientX;
  state.currentY = e.clientY;

  updateSelectionBox();
}

function handleMouseUp(e: MouseEvent): void {
  if (!state.isSelecting) return;

  state.isSelecting = false;
  state.currentX = e.clientX;
  state.currentY = e.clientY;

  const selection = getSelection();

  // Only complete if selection has meaningful size
  if (selection.width > 10 && selection.height > 10) {
    completeSelection(selection);
  } else {
    // Too small, reset for another try
    if (selectionElement) {
      selectionElement.style.display = "none";
    }
    if (dimensionsElement) {
      dimensionsElement.style.display = "none";
    }
    if (instructionsElement) {
      instructionsElement.innerHTML = `
        <span>Drag to select a region (selection too small)</span>
        <span style="color: #666;">|</span>
        <span><kbd>ESC</kbd> to cancel</span>
      `;
    }
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    e.preventDefault();
    cancelSelection();
  }
}

// ============================================================================
// Selection Logic
// ============================================================================

function updateSelectionBox(): void {
  if (!selectionElement || !dimensionsElement) return;

  const selection = getSelection();

  // Update selection box position and size
  selectionElement.style.left = `${selection.startX}px`;
  selectionElement.style.top = `${selection.startY}px`;
  selectionElement.style.width = `${selection.width}px`;
  selectionElement.style.height = `${selection.height}px`;

  // Update dimensions label
  dimensionsElement.style.display = "block";
  dimensionsElement.style.left = `${selection.startX + selection.width / 2}px`;
  dimensionsElement.style.top = `${selection.startY}px`;
  dimensionsElement.textContent = `${Math.round(selection.width)} × ${Math.round(selection.height)}`;
}

function getSelection(): RegionSelection {
  // Normalize coordinates (handle dragging in any direction)
  const startX = Math.min(state.startX, state.currentX);
  const startY = Math.min(state.startY, state.currentY);
  const endX = Math.max(state.startX, state.currentX);
  const endY = Math.max(state.startY, state.currentY);

  return {
    startX,
    startY,
    endX,
    endY,
    width: endX - startX,
    height: endY - startY,
  };
}

function completeSelection(selection: RegionSelection): void {
  destroyOverlay();

  if (onSelectionComplete) {
    onSelectionComplete(selection);
    onSelectionComplete = null;
  }
}

function cancelSelection(): void {
  destroyOverlay();

  if (onSelectionComplete) {
    onSelectionComplete(null);
    onSelectionComplete = null;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Starts the region selection mode.
 * Returns a promise that resolves with the selected region, or null if cancelled.
 */
export function startRegionSelection(): Promise<RegionSelection | null> {
  return new Promise((resolve) => {
    onSelectionComplete = resolve;
    createOverlay();
  });
}

/**
 * Checks if region selection is currently active.
 */
export function isRegionSelectionActive(): boolean {
  return overlayElement !== null;
}

/**
 * Cancels any active region selection.
 */
export function cancelRegionSelection(): void {
  if (overlayElement) {
    cancelSelection();
  }
}
