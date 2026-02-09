// ============================================================================
// BlockSnap Extension - Constants
// ============================================================================

import type { BlockDetectionConfig } from "./types";

/** Default block detection configuration */
export const DEFAULT_DETECTION_CONFIG: BlockDetectionConfig = {
  minWidth: 50,
  minHeight: 50,
  maxWidth: Infinity, // Will be set to viewport width
  maxHeight: Infinity, // Will be set to viewport height
  semanticWeight: 2.0,
  visualWeight: 1.5,
  sizeWeight: 1.0,
  maxDepth: 15,
};

/** Elements to skip during block detection */
export const SKIP_ELEMENTS = new Set([
  "SCRIPT",
  "STYLE",
  "LINK",
  "META",
  "HEAD",
  "NOSCRIPT",
  "BR",
  "HR",
]);

/** Semantic HTML elements with their weights */
export const SEMANTIC_ELEMENTS: Record<string, number> = {
  SECTION: 2.0,
  ARTICLE: 2.0,
  NAV: 2.0,
  ASIDE: 1.8,
  HEADER: 1.8,
  FOOTER: 1.8,
  MAIN: 1.5,
  FORM: 1.8,
  FIGURE: 1.6,
  DIALOG: 2.0,
  DETAILS: 1.5,
};

/** CSS properties that indicate visual boundaries */
export const VISUAL_BOUNDARY_PROPERTIES = [
  "backgroundColor",
  "borderWidth",
  "borderRadius",
  "boxShadow",
  "backdropFilter",
  "outline",
];

/** Colors for the overlay based on semantic type */
export const SEMANTIC_COLORS: Record<string, string> = {
  nav: "#3b82f6", // Blue
  header: "#8b5cf6", // Purple
  footer: "#6366f1", // Indigo
  section: "#a855f7", // Violet
  article: "#d946ef", // Fuchsia
  card: "#ec4899", // Pink
  form: "#f43f5e", // Rose
  button: "#f97316", // Orange
  aside: "#06b6d4", // Cyan
  figure: "#14b8a6", // Teal
  generic: "#6b7280", // Gray
};

/** Overlay z-index (maximum safe value) */
export const OVERLAY_Z_INDEX = 2147483647;

/** Throttle delay for mouse events (16ms ≈ 60fps) */
export const MOUSE_THROTTLE_MS = 16;

/** Extension storage keys */
export const STORAGE_KEYS = {
  ACTIVE_TAB: "activeTabId",
  PENDING_CAPTURE: "pendingCapture",
  USER_PREFERENCES: "userPreferences",
} as const;
