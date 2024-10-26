chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveMarkdown") {
    const originalMessages = request.originalMessages;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (request.saveJson) {
      const originalFilename = `chat_export_original_${timestamp}.json`;
      const originalJson = JSON.stringify(originalMessages, null, 2);
      chrome.downloads.download({
        url: "data:application/json;charset=utf-8," + encodeURIComponent(originalJson),
        filename: originalFilename,
        saveAs: false,
      });
    }

    if (request.saveMarkdown) {
      const markdownOriginalFilename = `chat_export_markdown_original_${timestamp}.md`;
      const markdownOriginal = convertToMarkdown(originalMessages);
      chrome.downloads.download({
        url: "data:text/markdown;charset=utf-8," + encodeURIComponent(markdownOriginal),
        filename: markdownOriginalFilename,
        saveAs: false,
      });
    }

    if (request.saveMarkdownWithCodeBlock) {
      const markdownWithCodeBlockFilename = `chat_export_markdown_with_codeblock_${timestamp}.md`;
      const markdownWithCodeBlock = convertToMarkdownWithCodeBlock(originalMessages);
      chrome.downloads.download({
        url: "data:text/markdown;charset=utf-8," + encodeURIComponent(markdownWithCodeBlock),
        filename: markdownWithCodeBlockFilename,
        saveAs: false,
      });
    }

    sendResponse({ status: "success" });
  }
  return true;
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

function convertToMarkdown(messages) {
  return messages
    .map((msg) => {
      const roleIcon = msg.role === "assistant" ? "🤖" : "👤";
      return `## ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${msg.content.trim()}\n\n`;
    })
    .join("---\n\n");
}

function convertToMarkdownWithCodeBlock(messages) {
  return messages
    .map((msg) => {
      const roleIcon = msg.role === "assistant" ? "🤖" : "👤";
      let content = msg.content;

      // 코드 블록 변환
      content = content.replace(/([a-zA-Z]+)[\r\n]+코드 복사[\r\n]+([\s\S]*?)(?=[\r\n]+(?:[\d]|[^/#<│├└{}\(\)\sa-zA-Z]|$))/g, "```$1\n$2\n```");
      return `## ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${content.trim()}\n\n`;
    })
    .join("---\n\n");
}
