// ============================================================================
// BlockSnap Extension - Shared Types
// ============================================================================

/** Block candidate detected in the DOM */
export interface BlockCandidate {
  id: string;
  element: HTMLElement;
  score: number;
  rect: DOMRect;
  semanticType: SemanticType;
  label: string;
}

/** Semantic classification of UI blocks */
export type SemanticType =
  | "nav"
  | "header"
  | "footer"
  | "section"
  | "article"
  | "card"
  | "form"
  | "button"
  | "aside"
  | "figure"
  | "generic";

/** Configuration for block detection */
export interface BlockDetectionConfig {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  semanticWeight: number;
  visualWeight: number;
  sizeWeight: number;
  maxDepth: number;
}

/** Overlay state for rendering */
export interface OverlayState {
  visible: boolean;
  rect: DOMRect;
  label: string;
  semanticType: SemanticType;
  dimensions: { width: number; height: number };
}

/** Metadata about the captured element */
export interface CaptureMetadata {
  url: string;
  title: string;
  elementType: SemanticType;
  label: string;
  dimensions: { width: number; height: number };
  capturedAt: number;
}

/** Rectangle for cropping */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Result of a capture operation */
export interface CaptureResult {
  imageDataUrl: string;
  metadata: CaptureMetadata;
}

/** Extension state stored in chrome.storage */
export interface ExtensionState {
  isActive: boolean;
  lastCapture?: CaptureResult;
}
