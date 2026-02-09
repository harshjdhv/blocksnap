// ============================================================================
// BlockSnap Extension - Block Detection Engine
// ============================================================================

import type {
  BlockCandidate,
  BlockDetectionConfig,
  SemanticType,
} from "../shared/types";
import { DEFAULT_DETECTION_CONFIG } from "../shared/constants";
import {
  shouldSkipElement,
  hasVisualBoundary,
  isLayoutContainer,
  getSemanticWeight,
  classifyElement,
  generateLabel,
  isInViewport,
  getElementDepth,
  generateElementId,
} from "../lib/dom-utils";

// Style cache for performance
const styleCache = new WeakMap<Element, CSSStyleDeclaration>();

/**
 * Gets cached computed styles for an element.
 */
function getCachedStyles(element: Element): CSSStyleDeclaration {
  let styles = styleCache.get(element);
  if (!styles) {
    styles = getComputedStyle(element);
    styleCache.set(element, styles);
  }
  return styles;
}

/**
 * Clears the style cache.
 */
export function clearStyleCache(): void {
  // WeakMap automatically garbage collects, but we can
  // create a new instance to force clear
}

/**
 * Calculates a score for how likely an element is a meaningful UI block.
 */
function calculateBlockScore(
  element: HTMLElement,
  depth: number,
  config: BlockDetectionConfig,
): number {
  const styles = getCachedStyles(element);
  const rect = element.getBoundingClientRect();

  let score = 0;

  // === Semantic Score ===
  const semanticWeight = getSemanticWeight(element);
  score += semanticWeight * config.semanticWeight;

  // === Visual Boundary Score ===
  if (hasVisualBoundary(styles)) {
    score += 1.0 * config.visualWeight;
  }

  // Bonus for rounded corners (common in modern UI)
  const borderRadius = parseFloat(styles.borderRadius) || 0;
  if (borderRadius >= 8) {
    score += 0.3 * config.visualWeight;
  }

  // Bonus for shadows (card-like elements)
  if (styles.boxShadow !== "none" && styles.boxShadow !== "") {
    score += 0.4 * config.visualWeight;
  }

  // === Layout Score ===
  if (isLayoutContainer(styles)) {
    score += 0.5;
  }

  // Parent of multiple children is often a meaningful container
  if (element.children.length >= 2) {
    score += 0.3;
  }

  // === Size Score ===
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Penalize very small elements
  if (rect.width < config.minWidth || rect.height < config.minHeight) {
    score -= 2;
  }

  // Penalize very large elements (close to viewport size)
  const widthRatio = rect.width / viewportWidth;
  const heightRatio = rect.height / viewportHeight;

  if (widthRatio > 0.95 && heightRatio > 0.95) {
    score -= 1; // Almost full page
  }

  // Sweet spot: medium-sized elements
  if (
    widthRatio > 0.1 &&
    widthRatio < 0.9 &&
    heightRatio > 0.1 &&
    heightRatio < 0.8
  ) {
    score += 0.5 * config.sizeWeight;
  }

  // === Depth Penalty ===
  // Very deep nesting is often less meaningful
  if (depth > 10) {
    score -= (depth - 10) * 0.1;
  }

  // === Bonus for specific patterns ===
  const tag = element.tagName.toLowerCase();

  // Interactive elements
  if (
    tag === "button" ||
    tag === "a" ||
    element.getAttribute("role") === "button"
  ) {
    score += 0.8;
  }

  // Forms are always meaningful
  if (tag === "form") {
    score += 1.0;
  }

  // Images with meaningful wrappers
  if (tag === "figure" || (tag === "div" && element.querySelector("img"))) {
    score += 0.4;
  }

  return score;
}

/**
 * Finds the best matching block for a target element.
 * Traverses up the DOM tree and scores each candidate.
 */
export function findBestBlock(
  target: HTMLElement,
  config: Partial<BlockDetectionConfig> = {},
): BlockCandidate | null {
  const finalConfig: BlockDetectionConfig = {
    ...DEFAULT_DETECTION_CONFIG,
    maxWidth: window.innerWidth,
    maxHeight: window.innerHeight,
    ...config,
  };

  const candidates: BlockCandidate[] = [];
  let current: HTMLElement | null = target;
  let depth = 0;

  while (current && depth < finalConfig.maxDepth) {
    // Skip body and html
    if (current === document.body || current === document.documentElement) {
      break;
    }

    // Skip elements that shouldn't be considered
    if (!shouldSkipElement(current)) {
      const rect = current.getBoundingClientRect();

      // Only consider elements in viewport with reasonable size
      if (
        isInViewport(rect) &&
        rect.width >= finalConfig.minWidth &&
        rect.height >= finalConfig.minHeight
      ) {
        const semanticType = classifyElement(current);
        const score = calculateBlockScore(
          current,
          getElementDepth(current),
          finalConfig,
        );

        candidates.push({
          id: generateElementId(current),
          element: current,
          score,
          rect,
          semanticType,
          label: generateLabel(current, semanticType),
        });
      }
    }

    current = current.parentElement;
    depth++;
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by score descending and return the best
  candidates.sort((a, b) => b.score - a.score);

  // Apply a preference for the first few candidates (closer to cursor)
  // if scores are close
  const best = candidates[0];

  // If the second candidate has a similar score but is closer to the target,
  // prefer it (helps with nested cards)
  if (candidates.length > 1) {
    const second = candidates[1];
    const scoreDiff = best.score - second.score;

    // If scores are within 0.5, prefer the one closer to target
    if (scoreDiff < 0.5 && second.element.contains(target)) {
      return second;
    }
  }

  return best;
}

/**
 * Gets the element at a specific point, handling shadow DOM.
 */
export function getElementAtPoint(x: number, y: number): HTMLElement | null {
  // First, try the standard approach
  let element = document.elementFromPoint(x, y) as HTMLElement | null;

  if (!element) return null;

  // If the element has a shadow root, drill into it
  if (element.shadowRoot) {
    const shadowElement = element.shadowRoot.elementFromPoint(x, y);
    if (shadowElement instanceof HTMLElement) {
      element = shadowElement;
    }
  }

  return element;
}

/**
 * Batch processes multiple points to find blocks (for preview mode).
 */
export function findBlocksInArea(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number = 50,
): BlockCandidate[] {
  const blocksMap = new Map<HTMLElement, BlockCandidate>();

  for (let x = startX; x < endX; x += gridSize) {
    for (let y = startY; y < endY; y += gridSize) {
      const element = getElementAtPoint(x, y);
      if (element) {
        const block = findBestBlock(element);
        if (block && !blocksMap.has(block.element)) {
          blocksMap.set(block.element, block);
        }
      }
    }
  }

  return Array.from(blocksMap.values());
}
