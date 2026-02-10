// ============================================================================
// BlockSnap Extension - Message Definitions
// ============================================================================

import type {
  CropRect,
  CaptureMetadata,
  CaptureMode,
  RegionSelection,
  FullPageProgress,
} from "./types";

// ---- Message Type Definitions ----

export interface ActivateMessage {
  type: "ACTIVATE_BLOCKSNAP";
  payload?: {
    mode: CaptureMode;
  };
}

export interface DeactivateMessage {
  type: "DEACTIVATE_BLOCKSNAP";
}

export interface CaptureElementMessage {
  type: "CAPTURE_ELEMENT";
  payload: {
    rect: CropRect;
    devicePixelRatio: number;
    metadata: CaptureMetadata;
  };
}

export interface CaptureCompleteMessage {
  type: "CAPTURE_COMPLETE";
  payload: {
    imageDataUrl: string;
    metadata: CaptureMetadata;
  };
}

export interface CropImageMessage {
  type: "CROP_IMAGE";
  payload: {
    dataUrl: string;
    cropRect: CropRect;
    devicePixelRatio: number;
  };
}

export interface CropCompleteMessage {
  type: "CROP_COMPLETE";
  payload: {
    imageDataUrl: string;
  };
}

export interface ShowToastMessage {
  type: "SHOW_TOAST";
  payload: {
    message: string;
    variant: "success" | "error" | "info";
  };
}

export interface GetStateMessage {
  type: "GET_STATE";
}

export interface StateResponseMessage {
  type: "STATE_RESPONSE";
  payload: {
    isActive: boolean;
  };
}

// ---- New Capture Mode Messages ----

export interface CaptureVisiblePageMessage {
  type: "CAPTURE_VISIBLE_PAGE";
  payload: {
    metadata: CaptureMetadata;
  };
}

export interface CaptureRegionMessage {
  type: "CAPTURE_REGION";
  payload: {
    rect: CropRect;
    devicePixelRatio: number;
    metadata: CaptureMetadata;
  };
}

export interface CaptureFullPageMessage {
  type: "CAPTURE_FULL_PAGE";
  payload: {
    metadata: CaptureMetadata;
  };
}

export interface FullPageScrollMessage {
  type: "FULL_PAGE_SCROLL";
  payload: {
    scrollY: number;
  };
}

export interface FullPageProgressMessage {
  type: "FULL_PAGE_PROGRESS";
  payload: FullPageProgress;
}

export interface StitchImagesMessage {
  type: "STITCH_IMAGES";
  payload: {
    images: string[];
    viewportHeight: number;
    totalHeight: number;
    devicePixelRatio: number;
  };
}

export interface StitchCompleteMessage {
  type: "STITCH_COMPLETE";
  payload: {
    imageDataUrl: string;
  };
}

export interface CaptureViewportChunkMessage {
  type: "CAPTURE_VIEWPORT_CHUNK";
}

// ---- Union Type ----

export type ExtensionMessage =
  | ActivateMessage
  | DeactivateMessage
  | CaptureElementMessage
  | CaptureCompleteMessage
  | CropImageMessage
  | CropCompleteMessage
  | ShowToastMessage
  | GetStateMessage
  | StateResponseMessage
  | CaptureVisiblePageMessage
  | CaptureRegionMessage
  | CaptureFullPageMessage
  | FullPageScrollMessage
  | FullPageProgressMessage
  | StitchImagesMessage
  | StitchCompleteMessage
  | CaptureViewportChunkMessage;

// ---- Message Creators ----

export const Messages = {
  activate: (mode: CaptureMode = "block"): ActivateMessage => ({
    type: "ACTIVATE_BLOCKSNAP",
    payload: { mode },
  }),

  deactivate: (): DeactivateMessage => ({ type: "DEACTIVATE_BLOCKSNAP" }),

  captureElement: (
    rect: CropRect,
    devicePixelRatio: number,
    metadata: CaptureMetadata,
  ): CaptureElementMessage => ({
    type: "CAPTURE_ELEMENT",
    payload: { rect, devicePixelRatio, metadata },
  }),

  captureComplete: (
    imageDataUrl: string,
    metadata: CaptureMetadata,
  ): CaptureCompleteMessage => ({
    type: "CAPTURE_COMPLETE",
    payload: { imageDataUrl, metadata },
  }),

  cropImage: (
    dataUrl: string,
    cropRect: CropRect,
    devicePixelRatio: number,
  ): CropImageMessage => ({
    type: "CROP_IMAGE",
    payload: { dataUrl, cropRect, devicePixelRatio },
  }),

  cropComplete: (imageDataUrl: string): CropCompleteMessage => ({
    type: "CROP_COMPLETE",
    payload: { imageDataUrl },
  }),

  showToast: (
    message: string,
    variant: "success" | "error" | "info" = "success",
  ): ShowToastMessage => ({
    type: "SHOW_TOAST",
    payload: { message, variant },
  }),

  getState: (): GetStateMessage => ({ type: "GET_STATE" }),

  stateResponse: (isActive: boolean): StateResponseMessage => ({
    type: "STATE_RESPONSE",
    payload: { isActive },
  }),

  // ---- New Capture Mode Creators ----

  captureVisiblePage: (
    metadata: CaptureMetadata,
  ): CaptureVisiblePageMessage => ({
    type: "CAPTURE_VISIBLE_PAGE",
    payload: { metadata },
  }),

  captureRegion: (
    rect: CropRect,
    devicePixelRatio: number,
    metadata: CaptureMetadata,
  ): CaptureRegionMessage => ({
    type: "CAPTURE_REGION",
    payload: { rect, devicePixelRatio, metadata },
  }),

  captureFullPage: (metadata: CaptureMetadata): CaptureFullPageMessage => ({
    type: "CAPTURE_FULL_PAGE",
    payload: { metadata },
  }),

  fullPageScroll: (scrollY: number): FullPageScrollMessage => ({
    type: "FULL_PAGE_SCROLL",
    payload: { scrollY },
  }),

  fullPageProgress: (progress: FullPageProgress): FullPageProgressMessage => ({
    type: "FULL_PAGE_PROGRESS",
    payload: progress,
  }),

  stitchImages: (
    images: string[],
    viewportHeight: number,
    totalHeight: number,
    devicePixelRatio: number,
  ): StitchImagesMessage => ({
    type: "STITCH_IMAGES",
    payload: { images, viewportHeight, totalHeight, devicePixelRatio },
  }),

  stitchComplete: (imageDataUrl: string): StitchCompleteMessage => ({
    type: "STITCH_COMPLETE",
    payload: { imageDataUrl },
  }),
};
