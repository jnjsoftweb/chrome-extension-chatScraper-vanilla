chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);  // 디버깅 로그 추가

  if (request.action === "chooseFolder") {
    chrome.fileSystem.chooseEntry({ type: 'openDirectory' }, function(folderEntry) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      if (folderEntry) {
        chrome.fileSystem.getDisplayPath(folderEntry, function(path) {
          sendResponse({ path: path });
        });
      } else {
        sendResponse({ error: "No folder selected" });
      }
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  if (request.action === "saveMarkdown") {
    const originalMessages = request.originalMessages;
    const timestamp = new Date().toISOString();
    const url = sender.tab ? sender.tab.url : '';
    const ai = getAIType(url);
    const model = request.model || '';

    console.log("Preparing to save files...");  // 디버깅 로그 추가

    chrome.storage.sync.get({ saveFolder: "", saveJson: true, saveMarkdown: true, saveMarkdownWithCodeBlock: true }, function(items) {
      const saveFolder = items.saveFolder;

      console.log("Storage settings:", items);  // 디버깅 로그 추가

      if (items.saveJson) {
        const originalFilename = `${saveFolder}chat_export_original_${timestamp.replace(/[:.]/g, "-")}.json`;
        const originalJson = JSON.stringify(originalMessages, null, 2);
        saveFile(originalFilename, originalJson, "application/json");
      }

      if (items.saveMarkdown) {
        const markdownOriginalFilename = `${saveFolder}chat_export_markdown_original_${timestamp.replace(/[:.]/g, "-")}.md`;
        const markdownOriginal = convertToMarkdown(originalMessages, url, ai, model, timestamp);
        saveFile(markdownOriginalFilename, markdownOriginal, "text/markdown");
      }

      if (items.saveMarkdownWithCodeBlock) {
        const markdownWithCodeBlockFilename = `${saveFolder}chat_export_markdown_with_codeblock_${timestamp.replace(/[:.]/g, "-")}.md`;
        const markdownWithCodeBlock = convertToMarkdownWithCodeBlock(originalMessages, url, ai, model, timestamp);
        saveFile(markdownWithCodeBlockFilename, markdownWithCodeBlock, "text/markdown");
      }

      sendResponse({ status: "success" });
    });

    return true;  // 비동기 응답을 위해 true 반환
  }
});

function saveFile(filename, content, mimeType) {
  console.log("Saving file:", filename);  // 디버깅 로그 추가

  chrome.downloads.download({
    url: `data:${mimeType};base64,${btoa(unescape(encodeURIComponent(content)))}`,
    filename: filename,
    saveAs: false,
  }, function(downloadId) {
    if (chrome.runtime.lastError) {
      console.error("Download failed:", chrome.runtime.lastError);
    } else {
      console.log("File saved successfully. Download ID:", downloadId);
    }
  });
}

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

function getAIType(url) {
  if (url.includes('chat.openai.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude.ai';
  if (url.includes('copilot.microsoft.com')) return 'copilot';
  return 'unknown';
}

function convertToMarkdown(messages, url, ai, model, timestamp) {
  const frontmatter = `---
title: Chat Export
url: ${url}
ai: ${ai}
model: ${model}
createdAt: ${timestamp}
---

`;

  const content = messages
    .map((msg) => {
      const roleIcon = msg.role === "assistant" ? "🤖" : "👤";
      return `## ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${msg.content.trim()}\n\n`;
    })
    .join("---\n\n");

  return frontmatter + content;
}

function convertToMarkdownWithCodeBlock(messages, url, ai, model, timestamp) {
  const frontmatter = `---
title: Chat Export
url: ${url}
ai: ${ai}
model: ${model}
createdAt: ${timestamp}
---

`;

  const content = messages
    .map((msg) => {
      const roleIcon = msg.role === "assistant" ? "🤖" : "👤";
      let content = msg.content;

      // 코드 블록 변환
      content = content.replace(/([a-zA-Z]+)[\r\n]+코드 복사[\r\n]+([\s\S]*?)(?=[\r\n]+(?:[\d]|[^/#<│├└{}\(\)\sa-zA-Z]|$))/g, "```$1\n$2\n```");
      return `## ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${content.trim()}\n\n`;
    })
    .join("---\n\n");

  return frontmatter + content;
}
