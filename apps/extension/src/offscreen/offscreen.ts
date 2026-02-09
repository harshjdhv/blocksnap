// ============================================================================
// BlockSnap Extension - Offscreen Document
// Handles DOM operations that service workers cannot perform:
// - Canvas-based image cropping
// - Clipboard write operations
// ============================================================================

import type { CropRect } from "../shared/types";

// ============================================================================
// Message Handler
// ============================================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "CROP_IMAGE":
      handleCrop(message.payload.dataUrl, message.payload.cropRect);
      return true;

    case "COPY_TO_CLIPBOARD":
      handleClipboardCopy(message.payload.dataUrl);
      return true;

    default:
      return false;
  }
});

// ============================================================================
// Image Cropping
// ============================================================================

async function handleCrop(dataUrl: string, cropRect: CropRect): Promise<void> {
  try {
    const croppedDataUrl = await cropImage(dataUrl, cropRect);

    chrome.runtime.sendMessage({
      type: "CROP_COMPLETE",
      payload: { imageDataUrl: croppedDataUrl },
    });
  } catch (error) {
    console.error("[BlockSnap Offscreen] Crop error:", error);
    chrome.runtime.sendMessage({
      type: "CROP_ERROR",
      error: String(error),
    });
  }
}

async function cropImage(dataUrl: string, rect: CropRect): Promise<string> {
  // Load image
  const img = await loadImage(dataUrl);

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Ensure we don't crop outside the image bounds
  const safeX = Math.max(0, Math.min(rect.x, img.width - 1));
  const safeY = Math.max(0, Math.min(rect.y, img.height - 1));
  const safeWidth = Math.min(rect.width, img.width - safeX);
  const safeHeight = Math.min(rect.height, img.height - safeY);

  // Set canvas size to cropped dimensions
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  // Draw cropped region
  ctx.drawImage(
    img,
    safeX,
    safeY,
    safeWidth,
    safeHeight, // Source rect
    0,
    0,
    safeWidth,
    safeHeight, // Destination rect
  );

  // Return as data URL
  return canvas.toDataURL("image/png");
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

// ============================================================================
// Clipboard Operations
// ============================================================================

async function handleClipboardCopy(dataUrl: string): Promise<void> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Ensure valid PNG blob
    const pngBlob = blob.slice(0, blob.size, "image/png");

    console.log("[BlockSnap Offscreen] Writing blob to clipboard:", {
      type: pngBlob.type,
      size: pngBlob.size,
    });

    // Write to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
      }),
    ]);

    chrome.runtime.sendMessage({ type: "CLIPBOARD_COMPLETE" });
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error("[BlockSnap Offscreen] Clipboard error:", error);
    chrome.runtime.sendMessage({
      type: "CLIPBOARD_ERROR",
      error: errorMsg,
    });
  }
}

console.log("[BlockSnap] Offscreen document loaded");
