// ============================================================================
// BlockSnap Extension - Message Definitions
// ============================================================================

import type { CropRect, CaptureMetadata } from "./types";

// ---- Message Type Definitions ----

export interface ActivateMessage {
  type: "ACTIVATE_BLOCKSNAP";
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
  | StateResponseMessage;

// ---- Message Creators ----

export const Messages = {
  activate: (): ActivateMessage => ({ type: "ACTIVATE_BLOCKSNAP" }),

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
};
