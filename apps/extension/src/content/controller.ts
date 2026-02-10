// ============================================================================
// BlockSnap Extension - Main Controller
// ============================================================================

import type {
  BlockCandidate,
  CaptureMetadata,
  CaptureMode,
} from "../shared/types";
import { Messages } from "../shared/messages";
import { MOUSE_THROTTLE_MS } from "../shared/constants";
import { throttle } from "../lib/throttle";
import { findBestBlock, getElementAtPoint } from "./block-detector";
import {
  createOverlay,
  destroyOverlay,
  updateOverlay,
  showToast,
  setCaptureMode,
  hideOverlay,
  showOverlayElement,
} from "./overlay";
import {
  startRegionSelection,
  isRegionSelectionActive,
  cancelRegionSelection,
} from "./region-selector";
import {
  startFullPageCapture,
  isFullPageCaptureActive,
  cancelFullPageCapture,
} from "./full-page-capturer";

/**
 * BlockSnap Controller
 * Manages the capture mode lifecycle and coordinates between
 * block detection, overlay rendering, and screenshot capture.
 */
class BlockSnapController {
  private isActive = false;
  private currentMode: CaptureMode = "block";
  private currentBlock: BlockCandidate | null = null;
  private throttledMouseMove: (e: MouseEvent) => void;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleScroll: () => void;

  constructor() {
    // Create throttled handlers
    this.throttledMouseMove = throttle(
      this.handleMouseMove.bind(this),
      MOUSE_THROTTLE_MS,
    );
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleScroll = throttle(this.handleScroll.bind(this), 100);

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  /**
   * Handles messages from the background script.
   */
  private handleMessage(
    message: { type: string; payload?: any },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean {
    switch (message.type) {
      case "ACTIVATE_BLOCKSNAP":
        const mode = message.payload?.mode || "block";
        this.activate(mode);
        sendResponse({ success: true });
        return true;

      case "DEACTIVATE_BLOCKSNAP":
        this.deactivate();
        sendResponse({ success: true });
        return true;

      case "GET_STATE":
        sendResponse({ isActive: this.isActive, mode: this.currentMode });
        return true;

      case "SHOW_TOAST":
        const toastMsg = message as unknown as {
          payload: { message: string; variant: "success" | "error" | "info" };
        };
        if (toastMsg.payload) {
          showToast(toastMsg.payload.message, toastMsg.payload.variant);
        }
        sendResponse({ success: true });
        return true;

      default:
        return false;
    }
  }

  /**
   * Activates capture mode with the specified capture type.
   */
  activate(mode: CaptureMode = "block"): void {
    if (this.isActive) {
      // If already active in a different mode, deactivate first
      if (this.currentMode !== mode) {
        this.deactivate();
      } else {
        return;
      }
    }

    this.isActive = true;
    this.currentMode = mode;

    console.log(`[BlockSnap] Activating capture mode: ${mode}`);

    switch (mode) {
      case "block":
        this.activateBlockMode();
        break;
      case "visible":
        this.captureVisiblePage();
        break;
      case "region":
        this.activateRegionMode();
        break;
      case "fullpage":
        this.activateFullPageMode();
        break;
    }
  }

  /**
   * Activates block detection mode (original behavior).
   */
  private activateBlockMode(): void {
    // Create overlay
    createOverlay();
    setCaptureMode(true);

    // Add event listeners
    document.addEventListener("mousemove", this.throttledMouseMove, {
      passive: true,
    });
    document.addEventListener("click", this.boundHandleClick, {
      capture: true,
    });
    document.addEventListener("keydown", this.boundHandleKeydown);
    window.addEventListener("scroll", this.boundHandleScroll, {
      passive: true,
    });

    // Show activation toast
    showToast("Block mode — Click to capture", "info");
    console.log("[BlockSnap] Block capture mode activated");
  }

  /**
   * Captures the visible viewport immediately.
   */
  private async captureVisiblePage(): Promise<void> {
    showToast("Capturing visible page...", "info");

    const metadata: CaptureMetadata = {
      url: window.location.href,
      title: document.title,
      elementType: "section",
      label: "Visible Page",
      dimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      capturedAt: Date.now(),
    };

    try {
      const response = await chrome.runtime.sendMessage(
        Messages.captureVisiblePage(metadata),
      );

      if (response?.success) {
        showToast("Screenshot captured & copied!", "success");
      } else {
        showToast(
          `Capture failed: ${response?.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error: any) {
      console.error("[BlockSnap] Visible page capture error:", error);
      showToast("Failed to capture screenshot", "error");
    } finally {
      this.deactivate();
      chrome.runtime.sendMessage(Messages.deactivate()).catch(() => {});
    }
  }

  /**
   * Activates region selection mode.
   */
  private async activateRegionMode(): Promise<void> {
    console.log("[BlockSnap] Region selection mode activated");

    try {
      const selection = await startRegionSelection();

      if (!selection) {
        // User cancelled
        showToast("Region selection cancelled", "info");
        this.deactivate();
        chrome.runtime.sendMessage(Messages.deactivate()).catch(() => {});
        return;
      }

      showToast("Capturing region...", "info");

      const metadata: CaptureMetadata = {
        url: window.location.href,
        title: document.title,
        elementType: "section",
        label: "Region Selection",
        dimensions: {
          width: Math.round(selection.width),
          height: Math.round(selection.height),
        },
        capturedAt: Date.now(),
      };

      const response = await chrome.runtime.sendMessage(
        Messages.captureRegion(
          {
            x: selection.startX,
            y: selection.startY,
            width: selection.width,
            height: selection.height,
          },
          window.devicePixelRatio,
          metadata,
        ),
      );

      if (response?.success) {
        showToast("Region captured & copied!", "success");
      } else {
        showToast(
          `Capture failed: ${response?.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error: any) {
      console.error("[BlockSnap] Region capture error:", error);
      showToast("Failed to capture region", "error");
    } finally {
      this.deactivate();
      chrome.runtime.sendMessage(Messages.deactivate()).catch(() => {});
    }
  }

  /**
   * Activates full page capture mode.
   */
  private async activateFullPageMode(): Promise<void> {
    console.log("[BlockSnap] Full page capture mode activated");

    try {
      const result = await startFullPageCapture();

      if (result.success) {
        showToast("Full page captured!", "success");
      } else {
        showToast(
          `Capture failed: ${result.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error: any) {
      console.error("[BlockSnap] Full page capture error:", error);
      showToast("Failed to capture full page", "error");
    } finally {
      this.deactivate();
      chrome.runtime.sendMessage(Messages.deactivate()).catch(() => {});
    }
  }

  /**
   * Deactivates capture mode.
   */
  deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.currentBlock = null;

    // Clean up based on current mode
    switch (this.currentMode) {
      case "block":
        // Remove event listeners
        document.removeEventListener("mousemove", this.throttledMouseMove);
        document.removeEventListener("click", this.boundHandleClick, {
          capture: true,
        });
        document.removeEventListener("keydown", this.boundHandleKeydown);
        window.removeEventListener("scroll", this.boundHandleScroll);

        // Cleanup overlay
        destroyOverlay();
        setCaptureMode(false);
        break;

      case "region":
        if (isRegionSelectionActive()) {
          cancelRegionSelection();
        }
        break;

      case "fullpage":
        if (isFullPageCaptureActive()) {
          cancelFullPageCapture();
        }
        break;
    }

    console.log("[BlockSnap] Capture mode deactivated");
  }

  /**
   * Handles mouse movement to update block detection.
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isActive || this.currentMode !== "block") return;

    // Get element under cursor
    const element = getElementAtPoint(e.clientX, e.clientY);

    if (!element) {
      this.currentBlock = null;
      updateOverlay(null);
      return;
    }

    // Find best block
    const block = findBestBlock(element);

    // Only update if block changed
    if (block?.id !== this.currentBlock?.id) {
      this.currentBlock = block;
      updateOverlay(block);
    }
  }

  /**
   * Handles click to capture the current block.
   */
  private handleClick(e: MouseEvent): void {
    if (!this.isActive || this.currentMode !== "block" || !this.currentBlock)
      return;

    // Prevent the click from propagating to the page
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Capture the block
    this.captureBlock(this.currentBlock);
  }

  /**
   * Handles keyboard shortcuts.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isActive) return;

    // ESC to deactivate
    if (e.key === "Escape") {
      e.preventDefault();
      this.deactivate();

      // Notify background script
      chrome.runtime.sendMessage(Messages.deactivate());
      return;
    }

    // Enter to capture (same as click) - only for block mode
    if (
      e.key === "Enter" &&
      this.currentMode === "block" &&
      this.currentBlock
    ) {
      e.preventDefault();
      this.captureBlock(this.currentBlock);
    }
  }

  /**
   * Handles scroll to update overlay position.
   */
  private handleScroll(): void {
    if (!this.isActive || this.currentMode !== "block" || !this.currentBlock)
      return;

    // Re-detect the block as its position may have changed
    const element = this.currentBlock.element;
    if (element && document.contains(element)) {
      const newRect = element.getBoundingClientRect();
      this.currentBlock = { ...this.currentBlock, rect: newRect };
      updateOverlay(this.currentBlock);
    }
  }

  /**
   * Captures a screenshot of the specified block.
   */
  private async captureBlock(block: BlockCandidate): Promise<void> {
    const { rect, semanticType, label } = block;

    // Hide overlay before capture
    hideOverlay();

    // Small delay to ensure overlay is hidden
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Prepare metadata
    const metadata: CaptureMetadata = {
      url: window.location.href,
      title: document.title,
      elementType: semanticType,
      label,
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      capturedAt: Date.now(),
    };

    // Send capture request to background script
    try {
      if (!chrome.runtime?.id) {
        throw new Error("Extension context invalidated");
      }

      console.log("[BlockSnap] Sending capture request...", metadata);
      const response = await chrome.runtime.sendMessage(
        Messages.captureElement(
          {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          window.devicePixelRatio,
          metadata,
        ),
      );

      if (response?.success) {
        showToast("Screenshot captured & copied!", "success");

        // Deactivate after successful capture
        setTimeout(() => {
          this.deactivate();
          chrome.runtime.sendMessage(Messages.deactivate()).catch(() => {});
        }, 500);
      } else {
        const errorMsg = response?.error || "Unknown capture error";
        console.error("[BlockSnap] Capture response error:", errorMsg);
        showToast(`Capture failed: ${errorMsg}`, "error");
        showOverlayElement();
      }
    } catch (error: any) {
      console.error("[BlockSnap] Capture error:", error);

      const msg = error.message || String(error);
      if (msg.includes("Extension context invalidated")) {
        showToast("Extension updated. Please refresh the page.", "error");
      } else if (msg.includes("Receiving end does not exist")) {
        showToast("Background service unreachable. Reload extension.", "error");
      } else {
        showToast("Failed to capture screenshot", "error");
      }

      showOverlayElement();
    }
  }

  /**
   * Returns whether capture mode is active.
   */
  isActiveMode(): boolean {
    return this.isActive;
  }

  /**
   * Returns the current capture mode.
   */
  getCurrentMode(): CaptureMode {
    return this.currentMode;
  }
}

// Initialize controller
const controller = new BlockSnapController();

// Check if we are on the preview page and need to hydrate data
async function checkPreviewPage(): Promise<void> {
  // Check if URL matches preview page
  if (!window.location.pathname.includes("/preview")) return;

  try {
    const data = await chrome.storage.local.get("pendingCapture");
    const capture = data.pendingCapture;

    if (capture && Date.now() - capture.timestamp < 60000) {
      // Only valid for 1 minute
      console.log("[BlockSnap] Hydrating preview page with capture data");

      // Post message to the web app
      window.postMessage(
        {
          type: "BLOCKSNAP_CAPTURE_DATA",
          payload: capture,
        },
        "*",
      );

      // Also set it on window for direct access if needed
      (window as any).__BLOCKSNAP_CAPTURE__ = capture;

      // Clear storage
      await chrome.storage.local.remove("pendingCapture");
    }
  } catch (error) {
    console.error("[BlockSnap] Error checking preview data:", error);
  }
}

// Run check
checkPreviewPage();

// Export for potential external access
export { controller };
