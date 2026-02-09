// ============================================================================
// BlockSnap Extension - Overlay Renderer
// ============================================================================

import type { BlockCandidate, OverlayState } from "../shared/types";
import { OVERLAY_Z_INDEX, SEMANTIC_COLORS } from "../shared/constants";

const OVERLAY_ID = "blocksnap-overlay-root";
const SELECTION_ID = "blocksnap-selection";
const LABEL_ID = "blocksnap-label";
const TOAST_ID = "blocksnap-toast";

let overlayRoot: HTMLDivElement | null = null;
let selectionBox: HTMLDivElement | null = null;
let labelElement: HTMLDivElement | null = null;
let guidelinesElement: SVGSVGElement | null = null;

/**
 * Injects the overlay styles into the page.
 */
function injectStyles(): void {
  if (document.getElementById("blocksnap-styles")) return;

  const styles = document.createElement("style");
  styles.id = "blocksnap-styles";
  styles.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: ${OVERLAY_Z_INDEX};
      pointer-events: none;
      contain: layout style;
    }
    
    #${SELECTION_ID} {
      position: absolute;
      border: 2px solid var(--blocksnap-color, #a855f7);
      background: var(--blocksnap-color-bg, rgba(168, 85, 247, 0.08));
      border-radius: 4px;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, width, height;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 
                  inset 0 0 20px rgba(168, 85, 247, 0.05);
    }
    
    #${SELECTION_ID}::before,
    #${SELECTION_ID}::after,
    #${SELECTION_ID} .corner-bl,
    #${SELECTION_ID} .corner-br {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      border: 2px solid var(--blocksnap-color, #a855f7);
    }
    
    #${SELECTION_ID}::before {
      top: -4px;
      left: -4px;
      border-right: none;
      border-bottom: none;
      border-top-left-radius: 2px;
    }
    
    #${SELECTION_ID}::after {
      top: -4px;
      right: -4px;
      border-left: none;
      border-bottom: none;
      border-top-right-radius: 2px;
    }
    
    #${SELECTION_ID} .corner-bl {
      bottom: -4px;
      left: -4px;
      border-right: none;
      border-top: none;
      border-bottom-left-radius: 2px;
    }
    
    #${SELECTION_ID} .corner-br {
      bottom: -4px;
      right: -4px;
      border-left: none;
      border-top: none;
      border-bottom-right-radius: 2px;
    }
    
    #${LABEL_ID} {
      position: absolute;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace;
      font-size: 11px;
      color: white;
      white-space: nowrap;
      transform: translateY(-100%);
      margin-top: -8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    #${LABEL_ID} .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      background: var(--blocksnap-color, #a855f7);
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    #${LABEL_ID} .dimensions {
      color: rgba(255, 255, 255, 0.6);
    }
    
    .blocksnap-guidelines {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: visible;
    }
    
    .blocksnap-guidelines line {
      stroke: var(--blocksnap-color, #a855f7);
      stroke-width: 1;
      stroke-dasharray: 4 4;
      opacity: 0.3;
    }
    
    #${TOAST_ID} {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: ${OVERLAY_Z_INDEX};
      pointer-events: none;
    }
    
    #${TOAST_ID}.visible {
      transform: translateX(-50%) translateY(0);
    }
    
    #${TOAST_ID} .icon {
      width: 20px;
      height: 20px;
    }
    
    #${TOAST_ID}.success .icon {
      color: #22c55e;
    }
    
    #${TOAST_ID}.error .icon {
      color: #ef4444;
    }
    
    .blocksnap-cursor-active {
      cursor: crosshair !important;
    }
    
    .blocksnap-cursor-active * {
      cursor: crosshair !important;
    }
  `;

  document.head.appendChild(styles);
}

/**
 * Creates the overlay DOM structure.
 */
export function createOverlay(): void {
  if (overlayRoot) return;

  injectStyles();

  // Create root container
  overlayRoot = document.createElement("div");
  overlayRoot.id = OVERLAY_ID;

  // Create selection box
  selectionBox = document.createElement("div");
  selectionBox.id = SELECTION_ID;
  selectionBox.style.display = "none";

  // Add corner elements
  const cornerBL = document.createElement("div");
  cornerBL.className = "corner-bl";
  const cornerBR = document.createElement("div");
  cornerBR.className = "corner-br";

  selectionBox.appendChild(cornerBL);
  selectionBox.appendChild(cornerBR);

  // Create label
  labelElement = document.createElement("div");
  labelElement.id = LABEL_ID;
  labelElement.innerHTML = `
    <span class="type-badge">Block</span>
    <span class="dimensions">0 × 0</span>
  `;

  // Create guidelines SVG
  guidelinesElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  guidelinesElement.classList.add("blocksnap-guidelines");
  guidelinesElement.style.display = "none";

  // Assemble
  overlayRoot.appendChild(guidelinesElement);
  overlayRoot.appendChild(selectionBox);
  overlayRoot.appendChild(labelElement);

  document.body.appendChild(overlayRoot);
}

/**
 * Destroys the overlay and removes it from the DOM.
 */
export function destroyOverlay(): void {
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
    selectionBox = null;
    labelElement = null;
    guidelinesElement = null;
  }

  // Remove styles
  const styles = document.getElementById("blocksnap-styles");
  if (styles) styles.remove();

  // Remove cursor class
  document.body.classList.remove("blocksnap-cursor-active");
}

/**
 * Updates the overlay to highlight a block.
 */
export function updateOverlay(block: BlockCandidate | null): void {
  if (!selectionBox || !labelElement || !guidelinesElement) {
    createOverlay();
    if (!selectionBox || !labelElement || !guidelinesElement) return;
  }

  if (!block) {
    selectionBox.style.display = "none";
    labelElement.style.display = "none";
    guidelinesElement.style.display = "none";
    return;
  }

  const { rect, label, semanticType } = block;
  const color = SEMANTIC_COLORS[semanticType] || SEMANTIC_COLORS.generic;

  // Update CSS custom properties
  selectionBox.style.setProperty("--blocksnap-color", color);
  selectionBox.style.setProperty("--blocksnap-color-bg", `${color}14`);
  labelElement.style.setProperty("--blocksnap-color", color);
  guidelinesElement.style.setProperty("--blocksnap-color", color);

  // Position selection box
  selectionBox.style.display = "block";
  selectionBox.style.left = `${rect.left}px`;
  selectionBox.style.top = `${rect.top}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;

  // Update label content
  const typeBadge = labelElement.querySelector(".type-badge");
  const dimensions = labelElement.querySelector(".dimensions");

  if (typeBadge) typeBadge.textContent = semanticType.toUpperCase();
  if (dimensions)
    dimensions.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;

  // Position label
  labelElement.style.display = "flex";
  labelElement.style.left = `${rect.left}px`;
  labelElement.style.top = `${rect.top}px`;

  // Adjust label if it goes off-screen
  const labelRect = labelElement.getBoundingClientRect();
  if (labelRect.top < 0) {
    labelElement.style.transform = "translateY(0)";
    labelElement.style.marginTop = `${rect.height + 8}px`;
  } else {
    labelElement.style.transform = "translateY(-100%)";
    labelElement.style.marginTop = "-8px";
  }

  // Draw guidelines
  updateGuidelines(rect);
}

/**
 * Updates the snapping guidelines.
 */
function updateGuidelines(rect: DOMRect): void {
  if (!guidelinesElement) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  guidelinesElement.style.display = "block";
  guidelinesElement.innerHTML = `
    <!-- Vertical lines at block edges -->
    <line x1="${rect.left}" y1="0" x2="${rect.left}" y2="${vh}" />
    <line x1="${rect.right}" y1="0" x2="${rect.right}" y2="${vh}" />
    
    <!-- Horizontal lines at block edges -->
    <line x1="0" y1="${rect.top}" x2="${vw}" y2="${rect.top}" />
    <line x1="0" y1="${rect.bottom}" x2="${vw}" y2="${rect.bottom}" />
  `;
}

/**
 * Shows a toast notification.
 */
export function showToast(
  message: string,
  variant: "success" | "error" | "info" = "success",
): void {
  // Remove existing toast
  const existing = document.getElementById(TOAST_ID);
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.className = variant;

  const iconSvg =
    variant === "success"
      ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
         <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`
      : variant === "error"
        ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"/>
         <line x1="15" y1="9" x2="9" y2="15"/>
         <line x1="9" y1="9" x2="15" y2="15"/>
       </svg>`
        : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"/>
         <line x1="12" y1="16" x2="12" y2="12"/>
         <line x1="12" y1="8" x2="12.01" y2="8"/>
       </svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  // Auto-hide
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Sets the capture cursor on the page.
 */
export function setCaptureMode(active: boolean): void {
  if (active) {
    document.body.classList.add("blocksnap-cursor-active");
  } else {
    document.body.classList.remove("blocksnap-cursor-active");
  }
}

/**
 * Hides the overlay temporarily (for screenshot capture).
 */
export function hideOverlay(): void {
  if (overlayRoot) {
    overlayRoot.style.display = "none";
  }
}

/**
 * Shows the overlay after capture.
 */
export function showOverlayElement(): void {
  if (overlayRoot) {
    overlayRoot.style.display = "block";
  }
}
