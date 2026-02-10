// ============================================================================
// BlockSnap Extension - Popup Script
// ============================================================================

import { Messages } from "../shared/messages";
import type { CaptureMode } from "../shared/types";

const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const btnText = document.getElementById("btn-text") as HTMLSpanElement;
const modeCards = document.querySelectorAll(
  ".mode-card",
) as NodeListOf<HTMLButtonElement>;

let isActive = false;
let selectedMode: CaptureMode = "block";

// ============================================================================
// State Management
// ============================================================================

async function checkCurrentState(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    // Try to get state from content script
    const response = await chrome.tabs.sendMessage(tab.id, Messages.getState());
    isActive = response?.isActive || false;
    if (response?.mode) {
      selectedMode = response.mode;
    }
    updateUI();
  } catch {
    // Content script not injected yet
    isActive = false;
    updateUI();
  }
}

function updateUI(): void {
  // Update button state
  if (isActive) {
    captureBtn.classList.add("active");
    btnText.textContent = "Stop Capturing";
  } else {
    captureBtn.classList.remove("active");
    btnText.textContent = getModeButtonText(selectedMode);
  }

  // Update selected mode
  modeCards.forEach((card) => {
    const mode = card.dataset.mode as CaptureMode;
    if (mode === selectedMode) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

function getModeButtonText(mode: CaptureMode): string {
  switch (mode) {
    case "block":
      return "Start Block Capture";
    case "visible":
      return "Capture Visible Page";
    case "region":
      return "Select Region";
    case "fullpage":
      return "Capture Full Page";
    default:
      return "Start Capturing";
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

// Mode card click handlers
modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    const mode = card.dataset.mode as CaptureMode;
    selectedMode = mode;
    updateUI();

    // Also start the capture immediately
    startCapture(mode);
  });
});

// Main capture button
captureBtn.addEventListener("click", async () => {
  if (isActive) {
    await stopCapture();
  } else {
    await startCapture(selectedMode);
  }
});

async function startCapture(mode: CaptureMode): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    // Try to activate - handle missing content script
    try {
      await chrome.tabs.sendMessage(tab.id, Messages.activate(mode));
      isActive = true;
    } catch (error) {
      console.log("[BlockSnap] Content script not ready, injecting...");

      // Fallback: Inject content script dynamically using manifest path
      const manifest = chrome.runtime.getManifest();
      const contentScript = manifest.content_scripts?.[0]?.js?.[0];

      if (contentScript) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [contentScript],
        });

        // Poll for script readiness (up to 3 seconds)
        let retries = 30;
        let success = false;
        while (retries > 0) {
          await new Promise((r) => setTimeout(r, 100)); // Wait 100ms
          try {
            await chrome.tabs.sendMessage(tab.id, Messages.activate(mode));
            success = true;
            break;
          } catch (e) {
            retries--;
          }
        }

        if (!success)
          throw new Error(
            "Content script failed to load. Please refresh the page.",
          );
        isActive = true;
      } else {
        throw new Error("Could not find content script in manifest");
      }
    }

    updateUI();

    // Close popup after action (except for block mode which stays active)
    if (mode !== "block") {
      setTimeout(() => window.close(), 200);
    } else {
      setTimeout(() => window.close(), 300);
    }
  } catch (error: any) {
    console.error("[BlockSnap Popup] Error:", error);
    handleError(error);
  }
}

async function stopCapture(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    await chrome.tabs.sendMessage(tab.id, Messages.deactivate());
    isActive = false;
    updateUI();

    setTimeout(() => window.close(), 300);
  } catch (error: any) {
    console.error("[BlockSnap Popup] Error:", error);
    handleError(error);
  }
}

function handleError(error: any): void {
  const msg = error.message || String(error);
  if (msg.includes("refresh")) {
    btnText.textContent = "Refresh Page & Try Again";
  } else {
    btnText.textContent = "Failed - Try Refreshing";
  }

  setTimeout(() => {
    btnText.textContent = isActive
      ? "Stop Capturing"
      : getModeButtonText(selectedMode);
  }, 3000);
}

// ============================================================================
// Initialize
// ============================================================================

// Check state on popup open
checkCurrentState();

// Update shortcut hint based on OS
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const shortcutHint = document.querySelector(".shortcut-hint");
if (shortcutHint && !isMac) {
  shortcutHint.innerHTML =
    "<kbd>Ctrl</kbd> + <kbd>⇧</kbd> + <kbd>S</kbd> to toggle";
}
