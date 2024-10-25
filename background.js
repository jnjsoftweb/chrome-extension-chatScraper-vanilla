chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveMarkdown") {
    const markdown = request.markdown;
    const filename = `chat_export_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: true,
      },
      () => {
        URL.revokeObjectURL(url);
      }
    );
  }
});

function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["content.js"],
      },
      (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function ensureContentScriptInjected(tabId) {
  try {
    await sendMessageToContentScript(tabId, { action: "ping" });
    console.log("Content script is already injected");
  } catch (error) {
    console.log("Content script not found, injecting...");
    await injectContentScript(tabId);
    // Wait for a short time to ensure the script is fully loaded
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Content script injected");
  }
}

async function addCheckboxes(tabId) {
  try {
    await ensureContentScriptInjected(tabId);
    const response = await sendMessageToContentScript(tabId, { action: "addCheckboxes" });
    console.log("Response from content script:", response);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  await addCheckboxes(tab.id);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("chat.openai.com")) {
    await addCheckboxes(tabId);
  }
});
