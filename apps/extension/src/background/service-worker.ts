// ============================================================================
// BlockSnap Extension - Background Service Worker
// ============================================================================

import type { ExtensionMessage } from "../shared/messages";
import type { CaptureMetadata, CropRect } from "../shared/types";
import { Messages } from "../shared/messages";
import { STORAGE_KEYS } from "../shared/constants";

// Track active tabs
const activeTabs = new Set<number>();
let offscreenDocumentCreated = false;

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log("[BlockSnap] Extension installed/updated");
  chrome.storage.local.clear(); // Clear stale data
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    const tabId = sender.tab?.id;

    // Only process messages from content scripts (tabs) or popup
    // Ignore messages from offscreen document or the service worker itself
    const isFromTab = !!sender.tab;
    const isFromPopup = sender.url?.includes("popup.html");
    const isFromOffscreen = sender.url?.includes("offscreen.html");

    // Skip if this is a response message from offscreen document
    if (isFromOffscreen) {
      return false;
    }

    console.log(
      "[BlockSnap SW] Received message:",
      message.type,
      "from:",
      sender.url || sender.tab?.url,
    );

    switch (message.type) {
      case "ACTIVATE_BLOCKSNAP":
        if (tabId) {
          activeTabs.add(tabId);
        }
        sendResponse({ success: true });
        return true;

      case "DEACTIVATE_BLOCKSNAP":
        if (tabId) {
          activeTabs.delete(tabId);
        }
        sendResponse({ success: true });
        return true;

      case "CAPTURE_ELEMENT":
        handleCapture(
          tabId!,
          message.payload.rect,
          message.payload.devicePixelRatio,
          message.payload.metadata,
        ).then(sendResponse);
        return true; // Async response

      case "CAPTURE_VISIBLE_PAGE":
        handleVisiblePageCapture(tabId!, message.payload.metadata).then(
          sendResponse,
        );
        return true;

      case "CAPTURE_REGION":
        handleCapture(
          tabId!,
          message.payload.rect,
          message.payload.devicePixelRatio,
          message.payload.metadata,
        ).then(sendResponse);
        return true;

      case "CAPTURE_FULL_PAGE":
        handleFullPageCapture(tabId!, message.payload.metadata).then(
          sendResponse,
        );
        return true;

      case "CAPTURE_VIEWPORT_CHUNK":
        handleViewportChunkCapture().then(sendResponse);
        return true;

      case "STITCH_IMAGES":
        // Only handle if from a tab (content script)
        if (isFromTab) {
          handleStitchImages(
            tabId!,
            message.payload.images,
            message.payload.viewportHeight,
            message.payload.totalHeight,
            message.payload.devicePixelRatio,
          ).then(sendResponse);
          return true;
        }
        return false;

      default:
        return false;
    }
  },
);

// Note: chrome.action.onClicked won't fire because we have a popup defined

// ============================================================================
// Keyboard Shortcut Handler
// ============================================================================

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "activate-capture") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    // Content script is auto-injected via manifest
    if (activeTabs.has(tab.id)) {
      await sendMessageToTab(tab.id, Messages.deactivate());
      activeTabs.delete(tab.id);
    } else {
      await sendMessageToTab(tab.id, Messages.activate("block"));
      activeTabs.add(tab.id);
    }
  }
});

// ============================================================================
// Screenshot Capture Handlers
// ============================================================================

async function handleCapture(
  tabId: number,
  rect: CropRect,
  devicePixelRatio: number,
  metadata: CaptureMetadata,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Capture the visible tab (use current window)
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });

    // 2. Ensure offscreen document exists
    await ensureOffscreenDocument();

    // 3. Crop the image
    const croppedDataUrl = await cropImage(dataUrl, rect, devicePixelRatio);

    // 4. Copy to clipboard (non-blocking)
    try {
      await copyImageToClipboard(croppedDataUrl);
    } catch (clipboardError) {
      console.warn("[BlockSnap] Clipboard copy failed:", clipboardError);
      // Continue anyway - preview page is more important
    }

    // 5. Store data for the preview page
    await chrome.storage.local.set({
      [STORAGE_KEYS.PENDING_CAPTURE]: {
        imageDataUrl: croppedDataUrl,
        metadata,
        timestamp: Date.now(),
      },
    });

    // 6. Open preview page
    const baseUrl =
      (import.meta as any).env.VITE_APP_URL ||
      ((import.meta as any).env.MODE === "production"
        ? "https://blocksnap.app"
        : "http://localhost:3000");

    const previewUrl = `${baseUrl}/preview`;

    await chrome.tabs.create({ url: previewUrl });

    // 7. Show success feedback (on the original tab)
    await sendMessageToTab(
      tabId,
      Messages.showToast("Screenshot captured!", "success"),
    );

    return { success: true };
  } catch (error) {
    console.error("[BlockSnap] Capture failed:", error);
    return { success: false, error: String(error) };
  }
}

async function handleVisiblePageCapture(
  tabId: number,
  metadata: CaptureMetadata,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Capture the visible tab without cropping
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });

    // Copy to clipboard
    try {
      await ensureOffscreenDocument();
      await copyImageToClipboard(dataUrl);
    } catch (clipboardError) {
      console.warn("[BlockSnap] Clipboard copy failed:", clipboardError);
    }

    // Store data for the preview page
    await chrome.storage.local.set({
      [STORAGE_KEYS.PENDING_CAPTURE]: {
        imageDataUrl: dataUrl,
        metadata,
        timestamp: Date.now(),
      },
    });

    // Open preview page
    const baseUrl =
      (import.meta as any).env.VITE_APP_URL ||
      ((import.meta as any).env.MODE === "production"
        ? "https://blocksnap.app"
        : "http://localhost:3000");

    await chrome.tabs.create({ url: `${baseUrl}/preview` });

    return { success: true };
  } catch (error) {
    console.error("[BlockSnap] Visible page capture failed:", error);
    return { success: false, error: String(error) };
  }
}

async function handleViewportChunkCapture(): Promise<{
  success: boolean;
  dataUrl?: string;
  error?: string;
}> {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab({
      format: "png",
    });
    return { success: true, dataUrl };
  } catch (error) {
    console.error("[BlockSnap] Viewport chunk capture failed:", error);
    return { success: false, error: String(error) };
  }
}

async function handleFullPageCapture(
  tabId: number,
  metadata: CaptureMetadata,
): Promise<{ success: boolean; error?: string }> {
  // The actual capturing and scrolling is handled by the content script
  // This is just a placeholder that will be called when stitching is complete
  return { success: true };
}

async function handleStitchImages(
  tabId: number,
  images: string[],
  viewportHeight: number,
  totalHeight: number,
  devicePixelRatio: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureOffscreenDocument();

    // Send to offscreen document for stitching
    const stitchedDataUrl = await stitchImages(
      images,
      viewportHeight,
      totalHeight,
      devicePixelRatio,
    );

    // Copy to clipboard
    try {
      await copyImageToClipboard(stitchedDataUrl);
    } catch (clipboardError) {
      console.warn("[BlockSnap] Clipboard copy failed:", clipboardError);
    }

    // Get tab info for metadata
    let tabUrl = "";
    let tabTitle = "Full Page Screenshot";
    try {
      const tab = await chrome.tabs.get(tabId);
      tabUrl = tab.url || "";
      tabTitle = tab.title || "Full Page Screenshot";
    } catch {
      // Tab might have been closed
    }

    // Store data for preview
    const metadata: CaptureMetadata = {
      url: tabUrl,
      title: tabTitle,
      elementType: "section",
      label: "Full Page",
      dimensions: {
        width: Math.round(
          (await getImageDimensions(images[0])).width / devicePixelRatio,
        ),
        height: Math.round(totalHeight),
      },
      capturedAt: Date.now(),
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.PENDING_CAPTURE]: {
        imageDataUrl: stitchedDataUrl,
        metadata,
        timestamp: Date.now(),
      },
    });

    // Open preview page
    const baseUrl =
      (import.meta as any).env.VITE_APP_URL ||
      ((import.meta as any).env.MODE === "production"
        ? "https://blocksnap.app"
        : "http://localhost:3000");

    await chrome.tabs.create({ url: `${baseUrl}/preview` });

    return { success: true };
  } catch (error) {
    console.error("[BlockSnap] Stitch failed:", error);
    return { success: false, error: String(error) };
  }
}

async function getImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const messageHandler = (message: {
      type: string;
      payload?: { width: number; height: number };
      error?: string;
    }) => {
      if (message.type === "IMAGE_DIMENSIONS_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        resolve(message.payload!);
      } else if (message.type === "IMAGE_DIMENSIONS_ERROR") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        reject(new Error(message.error));
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);

    chrome.runtime.sendMessage({
      type: "GET_IMAGE_DIMENSIONS",
      payload: { dataUrl },
    });

    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
      resolve({ width: 1920, height: 1080 }); // Fallback
    }, 3000);
  });
}

// ============================================================================
// Offscreen Document Management
// ============================================================================

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenDocumentCreated) return;

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "src/offscreen/offscreen.html",
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Image cropping, stitching, and clipboard operations",
    });
    offscreenDocumentCreated = true;
  }
}

// ============================================================================
// Image Cropping (via Offscreen Document)
// ============================================================================

async function cropImage(
  dataUrl: string,
  rect: CropRect,
  devicePixelRatio: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const messageHandler = (message: {
      type: string;
      payload?: { imageDataUrl: string };
      error?: string;
    }) => {
      if (message.type === "CROP_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        resolve(message.payload!.imageDataUrl);
      } else if (message.type === "CROP_ERROR") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        reject(new Error(message.error));
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);

    chrome.runtime.sendMessage(
      Messages.cropImage(
        dataUrl,
        {
          x: Math.round(rect.x * devicePixelRatio),
          y: Math.round(rect.y * devicePixelRatio),
          width: Math.round(rect.width * devicePixelRatio),
          height: Math.round(rect.height * devicePixelRatio),
        },
        devicePixelRatio,
      ),
    );

    // Timeout after 10 seconds
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
      reject(new Error("Crop operation timed out"));
    }, 10000);
  });
}

// ============================================================================
// Image Stitching (via Offscreen Document)
// ============================================================================

async function stitchImages(
  images: string[],
  viewportHeight: number,
  totalHeight: number,
  devicePixelRatio: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const messageHandler = (message: {
      type: string;
      payload?: { imageDataUrl: string };
      error?: string;
    }) => {
      if (message.type === "STITCH_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        resolve(message.payload!.imageDataUrl);
      } else if (message.type === "STITCH_ERROR") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        reject(new Error(message.error));
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);

    // Use internal message type to avoid conflict with content script message
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_STITCH_IMAGES",
      payload: { images, viewportHeight, totalHeight, devicePixelRatio },
    });

    // Timeout after 60 seconds (stitching can take a while for long pages)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
      reject(new Error("Stitch operation timed out"));
    }, 60000);
  });
}

// ============================================================================
// Clipboard Operations
// ============================================================================

async function copyImageToClipboard(dataUrl: string): Promise<void> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Use the Clipboard API through the offscreen document
  return new Promise((resolve, reject) => {
    const messageHandler = (message: { type: string; error?: string }) => {
      if (message.type === "CLIPBOARD_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        resolve();
      } else if (message.type === "CLIPBOARD_ERROR") {
        chrome.runtime.onMessage.removeListener(messageHandler);
        reject(
          new Error(`Clipboard error: ${message.error || "Unknown error"}`),
        );
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);

    chrome.runtime.sendMessage({
      type: "COPY_TO_CLIPBOARD",
      payload: { dataUrl },
    });

    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
      // Resolve anyway - clipboard might have worked
      resolve();
    }, 3000);
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

async function sendMessageToTab(
  tabId: number,
  message: ExtensionMessage,
): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error("[BlockSnap] Failed to send message to tab:", error);
    return null;
  }
}

// ============================================================================
// Tab Cleanup
// ============================================================================

chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Deactivate when page navigates
  if (changeInfo.status === "loading" && activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
  }
});

console.log("[BlockSnap] Service worker initialized");
