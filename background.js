chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveMarkdown") {
    const markdownOriginal = request.markdownOriginal;
    const markdownWithCodeBlock = request.markdownWithCodeBlock;
    const originalMessages = request.originalMessages;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const markdownOriginalFilename = `chat_export_markdown_original_${timestamp}.md`;
    const markdownWithCodeBlockFilename = `chat_export_markdown_with_codeblock_${timestamp}.md`;
    const originalFilename = `chat_export_original_${timestamp}.json`;

    // 원본 마크다운 파일 저장
    chrome.downloads.download({
      url: 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdownOriginal),
      filename: markdownOriginalFilename,
      saveAs: false
    }, (markdownOriginalDownloadId) => {
      if (chrome.runtime.lastError) {
        console.error("원본 마크다운 다운로드 중 오류 발생:", chrome.runtime.lastError);
      } else {
        console.log("원본 마크다운 파일이 성공적으로 다운로드되었습니다. 다운로드 ID:", markdownOriginalDownloadId);
      }
    });

    // 코드 블록이 적용된 마크다운 파일 저장
    chrome.downloads.download({
      url: 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdownWithCodeBlock),
      filename: markdownWithCodeBlockFilename,
      saveAs: false
    }, (markdownWithCodeBlockDownloadId) => {
      if (chrome.runtime.lastError) {
        console.error("코드 블록 적용 마크다운 다운로드 중 오류 발생:", chrome.runtime.lastError);
      } else {
        console.log("코드 블록 적용 마크다운 파일이 성공적으로 다운로드되었습니다. 다운로드 ID:", markdownWithCodeBlockDownloadId);
      }
    });

    // 원본 메시지 JSON 파일 저장
    const originalJson = JSON.stringify(originalMessages, null, 2);
    chrome.downloads.download({
      url: 'data:application/json;charset=utf-8,' + encodeURIComponent(originalJson),
      filename: originalFilename,
      saveAs: false
    }, (originalDownloadId) => {
      if (chrome.runtime.lastError) {
        console.error("원본 메시지 다운로드 중 오류 발생:", chrome.runtime.lastError);
        sendResponse({ status: "error", message: chrome.runtime.lastError.message });
      } else {
        console.log("원본 메시지 파일이 성공적으로 다운로드되었습니다. 다운로드 ID:", originalDownloadId);
        sendResponse({ 
          status: "success", 
          markdownOriginalDownloadId: markdownOriginalDownloadId,
          markdownWithCodeBlockDownloadId: markdownWithCodeBlockDownloadId,
          originalDownloadId: originalDownloadId 
        });
      }
    });

    return true;  // 비동기 sendResponse를 사용하기 위해 true 반환
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
