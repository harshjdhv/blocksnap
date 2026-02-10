// ============================================================================
// BlockSnap Extension - Offscreen Document
// Handles DOM operations that service workers cannot perform:
// - Canvas-based image cropping
// - Canvas-based image stitching (for full page capture)
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

    // Listen for internal stitch message from service worker
    case "OFFSCREEN_STITCH_IMAGES":
    case "STITCH_IMAGES":
      handleStitch(
        message.payload.images,
        message.payload.viewportHeight,
        message.payload.totalHeight,
        message.payload.devicePixelRatio,
      );
      return true;

    case "GET_IMAGE_DIMENSIONS":
      handleGetImageDimensions(message.payload.dataUrl);
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
// Image Stitching (for Full Page Capture)
// ============================================================================

async function handleStitch(
  images: string[],
  viewportHeight: number,
  totalHeight: number,
  devicePixelRatio: number,
): Promise<void> {
  try {
    if (images.length === 0) {
      throw new Error("No images to stitch");
    }

    console.log(`[BlockSnap Offscreen] Stitching ${images.length} images...`);

    // Load all images
    const loadedImages = await Promise.all(images.map(loadImage));

    // Get dimensions from first image
    const imageWidth = loadedImages[0].width;
    const scaledViewportHeight = viewportHeight * devicePixelRatio;
    const scaledTotalHeight = totalHeight * devicePixelRatio;

    // Create canvas for final stitched image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = imageWidth;
    canvas.height = scaledTotalHeight;

    // Calculate overlap between captures
    const overlap = 50 * devicePixelRatio;
    const effectiveViewportHeight = scaledViewportHeight - overlap;

    // Draw each image at the correct position
    for (let i = 0; i < loadedImages.length; i++) {
      const img = loadedImages[i];
      const yPosition = i * effectiveViewportHeight;

      // For the last image, we may need to clip it
      if (i === loadedImages.length - 1) {
        // Calculate how much of the last image we actually need
        const remainingHeight = scaledTotalHeight - yPosition;
        const sourceY = Math.max(0, img.height - remainingHeight);
        const sourceHeight = Math.min(remainingHeight, img.height);

        ctx.drawImage(
          img,
          0,
          sourceY,
          img.width,
          sourceHeight, // Source rect
          0,
          yPosition,
          img.width,
          sourceHeight, // Destination rect
        );
      } else {
        // For non-last images, draw the full viewport
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          effectiveViewportHeight, // Source rect
          0,
          yPosition,
          img.width,
          effectiveViewportHeight, // Destination rect
        );
      }
    }

    // Convert to data URL
    const stitchedDataUrl = canvas.toDataURL("image/png");

    console.log(
      `[BlockSnap Offscreen] Stitched image: ${canvas.width}x${canvas.height}`,
    );

    chrome.runtime.sendMessage({
      type: "STITCH_COMPLETE",
      payload: { imageDataUrl: stitchedDataUrl },
    });
  } catch (error) {
    console.error("[BlockSnap Offscreen] Stitch error:", error);
    chrome.runtime.sendMessage({
      type: "STITCH_ERROR",
      error: String(error),
    });
  }
}

// ============================================================================
// Image Dimensions
// ============================================================================

async function handleGetImageDimensions(dataUrl: string): Promise<void> {
  try {
    const img = await loadImage(dataUrl);
    chrome.runtime.sendMessage({
      type: "IMAGE_DIMENSIONS_COMPLETE",
      payload: { width: img.width, height: img.height },
    });
  } catch (error) {
    console.error("[BlockSnap Offscreen] Get dimensions error:", error);
    chrome.runtime.sendMessage({
      type: "IMAGE_DIMENSIONS_ERROR",
      error: String(error),
    });
  }
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
