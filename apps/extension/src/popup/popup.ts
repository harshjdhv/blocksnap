// ============================================================================
// BlockSnap Extension - Popup Script
// ============================================================================

import { Messages } from "../shared/messages";

const captureBtn = document.getElementById("capture-btn") as HTMLButtonElement;
const btnText = document.getElementById("btn-text") as HTMLSpanElement;

let isActive = false;

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
    updateUI();
  } catch {
    // Content script not injected yet
    isActive = false;
    updateUI();
  }
}

function updateUI(): void {
  if (isActive) {
    captureBtn.classList.add("active");
    btnText.textContent = "Stop Capturing";
  } else {
    captureBtn.classList.remove("active");
    btnText.textContent = "Start Capturing";
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

captureBtn.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;

    if (isActive) {
      // Deactivate
      await chrome.tabs.sendMessage(tab.id, Messages.deactivate());
      isActive = false;
    } else {
      // Try to activate - handle missing content script
      try {
        await chrome.tabs.sendMessage(tab.id, Messages.activate());
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
              await chrome.tabs.sendMessage(tab.id, Messages.activate());
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
    }

    updateUI();

    // Close popup after action
    setTimeout(() => window.close(), 300);
  } catch (error: any) {
    console.error("[BlockSnap Popup] Error:", error);

    // Show slightly more specific error
    const msg = error.message || String(error);
    if (msg.includes("refresh")) {
      btnText.textContent = "Refresh Page & Try Again";
    } else {
      btnText.textContent = "Failed - Try Refreshing";
    }

    setTimeout(() => {
      btnText.textContent = isActive ? "Stop Capturing" : "Start Capturing";
    }, 3000);
  }
});

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
