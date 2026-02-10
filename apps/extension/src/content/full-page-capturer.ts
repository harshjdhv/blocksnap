// ============================================================================
// BlockSnap Extension - Full Page Capturer
// Handles full page capture with auto-scroll and image stitching
// ============================================================================

import type { FullPageProgress } from "../shared/types";
import { OVERLAY_Z_INDEX } from "../shared/constants";
import { Messages } from "../shared/messages";

const PROGRESS_OVERLAY_ID = "blocksnap-fullpage-progress";

let progressOverlay: HTMLDivElement | null = null;
let isCaptureInProgress = false;

// ============================================================================
// Progress UI
// ============================================================================

function createProgressUI(): void {
  if (progressOverlay) return;

  const styles = document.createElement("style");
  styles.id = "blocksnap-fullpage-styles";
  styles.textContent = `
    #${PROGRESS_OVERLAY_ID} {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 24px;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      color: white;
      z-index: ${OVERLAY_Z_INDEX};
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 280px;
    }
    
    .blocksnap-progress-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .blocksnap-progress-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: blocksnap-spin 1s linear infinite;
    }
    
    @keyframes blocksnap-spin {
      to { transform: rotate(360deg); }
    }
    
    .blocksnap-progress-bar-container {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .blocksnap-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #a855f7, #ec4899);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    
    .blocksnap-progress-status {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      display: flex;
      justify-content: space-between;
    }
  `;
  document.head.appendChild(styles);

  progressOverlay = document.createElement("div");
  progressOverlay.id = PROGRESS_OVERLAY_ID;
  progressOverlay.innerHTML = `
    <div class="blocksnap-progress-header">
      <div class="blocksnap-progress-spinner"></div>
      <span>Capturing full page...</span>
    </div>
    <div class="blocksnap-progress-bar-container">
      <div class="blocksnap-progress-bar" style="width: 0%"></div>
    </div>
    <div class="blocksnap-progress-status">
      <span class="status-text">Preparing...</span>
      <span class="step-text">0 / 0</span>
    </div>
  `;

  document.body.appendChild(progressOverlay);
}

function updateProgressUI(progress: FullPageProgress): void {
  if (!progressOverlay) return;

  const bar = progressOverlay.querySelector(
    ".blocksnap-progress-bar",
  ) as HTMLDivElement;
  const statusText = progressOverlay.querySelector(
    ".status-text",
  ) as HTMLSpanElement;
  const stepText = progressOverlay.querySelector(
    ".step-text",
  ) as HTMLSpanElement;

  if (bar && progress.totalSteps > 0) {
    const percent = (progress.currentStep / progress.totalSteps) * 100;
    bar.style.width = `${percent}%`;
  }

  if (statusText) {
    const statusMap: Record<FullPageProgress["status"], string> = {
      scrolling: "Scrolling page...",
      capturing: "Capturing viewport...",
      stitching: "Stitching images...",
      complete: "Complete!",
      error: "Error occurred",
    };
    statusText.textContent = statusMap[progress.status] || progress.status;
  }

  if (stepText) {
    stepText.textContent = `${progress.currentStep} / ${progress.totalSteps}`;
  }
}

function destroyProgressUI(): void {
  if (progressOverlay) {
    progressOverlay.remove();
    progressOverlay = null;
  }

  const styles = document.getElementById("blocksnap-fullpage-styles");
  if (styles) styles.remove();
}

// ============================================================================
// Page Measurement
// ============================================================================

interface PageDimensions {
  viewportWidth: number;
  viewportHeight: number;
  scrollHeight: number;
  scrollWidth: number;
  devicePixelRatio: number;
}

function getPageDimensions(): PageDimensions {
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrollHeight: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight,
    ),
    scrollWidth: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
    ),
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

// ============================================================================
// Scroll and Capture
// ============================================================================

async function scrollToPosition(y: number): Promise<void> {
  return new Promise((resolve) => {
    window.scrollTo({ top: y, behavior: "instant" });
    // Small delay to ensure scroll and render complete
    requestAnimationFrame(() => {
      setTimeout(resolve, 150);
    });
  });
}

// Chrome limits captureVisibleTab to 2 calls per second
// We need at least 500ms between captures to avoid quota errors
const CAPTURE_RATE_LIMIT_MS = 600; // 600ms to be safe
let lastCaptureTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCapture = now - lastCaptureTime;

  if (timeSinceLastCapture < CAPTURE_RATE_LIMIT_MS) {
    const waitTime = CAPTURE_RATE_LIMIT_MS - timeSinceLastCapture;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

async function captureViewport(): Promise<string> {
  // Wait for rate limit before capturing
  await waitForRateLimit();

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "CAPTURE_VIEWPORT_CHUNK" },
      (response) => {
        lastCaptureTime = Date.now();

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success && response.dataUrl) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error || "Failed to capture viewport"));
        }
      },
    );
  });
}

// ============================================================================
// Full Page Capture Logic
// ============================================================================

export async function startFullPageCapture(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (isCaptureInProgress) {
    return { success: false, error: "Capture already in progress" };
  }

  isCaptureInProgress = true;
  const images: string[] = [];

  try {
    createProgressUI();

    // Get page dimensions
    const dimensions = getPageDimensions();
    const { viewportHeight, scrollHeight, devicePixelRatio } = dimensions;

    // Calculate number of captures needed
    // We overlap slightly to avoid gaps
    const overlap = 50;
    const effectiveViewportHeight = viewportHeight - overlap;
    const totalCaptures = Math.ceil(scrollHeight / effectiveViewportHeight);

    // Store original scroll position
    const originalScrollY = window.scrollY;

    // Capture each viewport
    for (let i = 0; i < totalCaptures; i++) {
      // Update progress
      updateProgressUI({
        currentStep: i + 1,
        totalSteps: totalCaptures,
        status: "scrolling",
      });

      // Calculate scroll position
      const scrollY = Math.min(
        i * effectiveViewportHeight,
        scrollHeight - viewportHeight,
      );

      // Scroll to position
      await scrollToPosition(scrollY);

      // Update progress
      updateProgressUI({
        currentStep: i + 1,
        totalSteps: totalCaptures,
        status: "capturing",
      });

      // Capture viewport
      try {
        const dataUrl = await captureViewport();
        images.push(dataUrl);
      } catch (error) {
        console.error(`[BlockSnap] Failed to capture chunk ${i + 1}:`, error);
        throw error;
      }
    }

    // Restore original scroll position
    await scrollToPosition(originalScrollY);

    // Update progress for stitching
    updateProgressUI({
      currentStep: totalCaptures,
      totalSteps: totalCaptures,
      status: "stitching",
    });

    // Send images to background for stitching
    const result = await stitchImages(
      images,
      viewportHeight,
      scrollHeight,
      devicePixelRatio,
    );

    // Show complete status briefly
    updateProgressUI({
      currentStep: totalCaptures,
      totalSteps: totalCaptures,
      status: "complete",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    destroyProgressUI();

    return result;
  } catch (error: any) {
    console.error("[BlockSnap] Full page capture failed:", error);

    updateProgressUI({
      currentStep: 0,
      totalSteps: 1,
      status: "error",
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    destroyProgressUI();

    return { success: false, error: error.message || String(error) };
  } finally {
    isCaptureInProgress = false;
  }
}

async function stitchImages(
  images: string[],
  viewportHeight: number,
  totalHeight: number,
  devicePixelRatio: number,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      Messages.stitchImages(
        images,
        viewportHeight,
        totalHeight,
        devicePixelRatio,
      ),
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else if (response?.success) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: response?.error || "Stitch failed",
          });
        }
      },
    );
  });
}

// ============================================================================
// Public API
// ============================================================================

export function isFullPageCaptureActive(): boolean {
  return isCaptureInProgress;
}

export function cancelFullPageCapture(): void {
  if (isCaptureInProgress) {
    isCaptureInProgress = false;
    destroyProgressUI();
  }
}
