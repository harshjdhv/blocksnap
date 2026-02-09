// ============================================================================
// BlockSnap Extension - DOM Utilities
// ============================================================================

import type { SemanticType } from "../shared/types";
import { SKIP_ELEMENTS, SEMANTIC_ELEMENTS } from "../shared/constants";

/**
 * Checks if an element should be skipped during block detection.
 */
export function shouldSkipElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return true;
  if (SKIP_ELEMENTS.has(element.tagName)) return true;

  const styles = getComputedStyle(element);

  // Skip invisible elements
  if (styles.display === "none") return true;
  if (styles.visibility === "hidden") return true;
  if (styles.opacity === "0") return true;

  // Skip elements with no dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return true;

  return false;
}

/**
 * Checks if an element has visible boundaries (background, border, shadow).
 */
export function hasVisualBoundary(styles: CSSStyleDeclaration): boolean {
  // Check background
  const bg = styles.backgroundColor;
  const hasBackground =
    bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "";

  // Check border
  const borderWidth = parseFloat(styles.borderWidth) || 0;
  const hasBorder = borderWidth > 0;

  // Check border radius
  const borderRadius = parseFloat(styles.borderRadius) || 0;
  const hasRadius = borderRadius > 0;

  // Check box shadow
  const hasShadow = styles.boxShadow !== "none" && styles.boxShadow !== "";

  // Check backdrop filter
  const hasBackdrop =
    styles.backdropFilter !== "none" && styles.backdropFilter !== "";

  return hasBackground || hasBorder || hasRadius || hasShadow || hasBackdrop;
}

/**
 * Checks if an element is a layout container (flex, grid).
 */
export function isLayoutContainer(styles: CSSStyleDeclaration): boolean {
  const display = styles.display;
  return (
    display === "flex" ||
    display === "inline-flex" ||
    display === "grid" ||
    display === "inline-grid"
  );
}

/**
 * Gets the semantic weight of an element based on its tag.
 */
export function getSemanticWeight(element: HTMLElement): number {
  return SEMANTIC_ELEMENTS[element.tagName] || 0;
}

/**
 * Classifies an element into a semantic type.
 */
export function classifyElement(element: HTMLElement): SemanticType {
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case "nav":
      return "nav";
    case "header":
      return "header";
    case "footer":
      return "footer";
    case "section":
      return "section";
    case "article":
      return "article";
    case "aside":
      return "aside";
    case "figure":
      return "figure";
    case "form":
      return "form";
    case "button":
      return "button";
    default:
      break;
  }

  // Check for common card patterns
  const classes = element.className.toLowerCase();
  if (
    classes.includes("card") ||
    classes.includes("modal") ||
    classes.includes("panel") ||
    classes.includes("tile")
  ) {
    return "card";
  }

  // Check ARIA roles
  const role = element.getAttribute("role");
  if (role) {
    switch (role) {
      case "navigation":
        return "nav";
      case "banner":
        return "header";
      case "contentinfo":
        return "footer";
      case "main":
        return "section";
      case "complementary":
        return "aside";
      case "dialog":
        return "card";
      case "form":
        return "form";
      default:
        break;
    }
  }

  return "generic";
}

/**
 * Generates a human-readable label for an element.
 */
export function generateLabel(
  element: HTMLElement,
  semanticType: SemanticType,
): string {
  // Try to get a meaningful name
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const id = element.id;
  if (id) {
    // Clean up ID (e.g., "main-header" -> "Main Header")
    return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Use semantic type as fallback
  return semanticType.charAt(0).toUpperCase() + semanticType.slice(1);
}

/**
 * Checks if an element is within the viewport.
 */
export function isInViewport(rect: DOMRect): boolean {
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

/**
 * Gets the nesting depth of an element in the DOM.
 */
export function getElementDepth(element: HTMLElement): number {
  let depth = 0;
  let current: HTMLElement | null = element;

  while (current) {
    depth++;
    current = current.parentElement;
  }

  return depth;
}

/**
 * Creates a unique identifier for an element.
 */
export function generateElementId(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id || "";
  const classList = Array.from(element.classList).slice(0, 2).join(".");

  return `${tag}${id ? "#" + id : ""}${classList ? "." + classList : ""}-${Date.now()}`;
}
