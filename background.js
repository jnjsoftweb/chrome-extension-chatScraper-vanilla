chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    chrome.storage.sync.get({ saveFolder: "" }, function(items) {
      const saveFolder = items.saveFolder;

      if (request.saveJson) {
        const originalFilename = `${saveFolder}chat_export_original_${timestamp}.json`;
        const originalJson = JSON.stringify(originalMessages, null, 2);
        saveFile(originalFilename, originalJson, "application/json");
      }

      if (request.saveMarkdown) {
        const markdownOriginalFilename = `${saveFolder}chat_export_markdown_original_${timestamp}.md`;
        const markdownOriginal = convertToMarkdown(originalMessages);
        saveFile(markdownOriginalFilename, markdownOriginal, "text/markdown");
      }

      if (request.saveMarkdownWithCodeBlock) {
        const markdownWithCodeBlockFilename = `${saveFolder}chat_export_markdown_with_codeblock_${timestamp}.md`;
        const markdownWithCodeBlock = convertToMarkdownWithCodeBlock(originalMessages);
        saveFile(markdownWithCodeBlockFilename, markdownWithCodeBlock, "text/markdown");
      }

      sendResponse({ status: "success" });
    });
  }
  return true;
});

function saveFile(filename, content, mimeType) {
  chrome.storage.sync.get({ saveFolder: "" }, function(items) {
    let saveFolder = items.saveFolder.trim();
    
    // 절대 경로인지 확인
    const isAbsolutePath = /^([A-Za-z]:[\\/]|\/)/;
    
    let fullPath;
    if (isAbsolutePath.test(saveFolder)) {
      console.log("절대 경로가 감지되었습니다.");
      saveFolder = saveFolder.replace(/\\/g, '/');  // 백슬래시를 슬래시로 변환
      if (!saveFolder.endsWith('/')) {
        saveFolder += '/';
      }
      fullPath = saveFolder + filename.replace(/^.*[\\\/]/, '');  // 파일명에서 경로 부분 제거
    } else {
      console.log("상대 경로가 감지되었습니다.");
      fullPath = saveFolder ? (saveFolder + '/' + filename).replace(/^\//, '') : filename;
    }
    
    // 중복된 경로 제거 및 'downloads' 폴더명 제거
    fullPath = fullPath.replace(/\/+/g, '/').replace(/^downloads\//, '');

    console.log("Saving file to:", fullPath);  // 디버깅을 위한 로그

    chrome.downloads.download({
      url: `data:${mimeType};base64,${btoa(unescape(encodeURIComponent(content)))}`,
      filename: fullPath,
      saveAs: false,
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError);
      } else {
        console.log("File saved successfully. Download ID:", downloadId);
      }
    });
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