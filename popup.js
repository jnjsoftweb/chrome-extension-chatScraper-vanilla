document.addEventListener("DOMContentLoaded", function () {
  const checkMessagesButton = document.getElementById("checkMessages");
  const saveMessagesButton = document.getElementById("saveMessages");

  async function ensureContentScriptInjected() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
          reject(new Error("No active tab found"));
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: "ping" }, function(response) {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                files: ["content.js"],
              },
              () => {
                if (chrome.runtime.lastError) {
                  reject(new Error("Failed to inject content script"));
                } else {
                  resolve();
                }
              }
            );
          } else {
            resolve();
          }
        });
      });
    });
  }

  async function sendMessageToActiveTab(message) {
    await ensureContentScriptInjected();
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
          reject(new Error("No active tab found"));
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    });
  }

  if (checkMessagesButton) {
    checkMessagesButton.addEventListener("click", async () => {
      try {
        const response = await sendMessageToActiveTab({ action: "addCheckboxes" });
        console.log("체크박스 추가 응답:", response);
      } catch (error) {
        console.error("체크박스 추가 중 오류 발생:", error.message);
        alert("체크박스 추가 중 오류가 발생했습니다: " + error.message);
      }
    });
  }

  if (saveMessagesButton) {
    saveMessagesButton.addEventListener("click", async () => {
      try {
        const response = await sendMessageToActiveTab({ action: "getSelectedMessages" });
        console.log("받은 응답:", response);
        if (response && response.status === "Markdown sent for saving") {
          console.log("마크다운 저장 요청이 전송되었습니다.");
          // 백그라운드 스크립트에서 직접 다운로드를 처리하므로 추가 작업 불필요
        } else if (response && response.status === "No messages selected") {
          console.log("선택된 메시지가 없습니다.");
        } else {
          console.error("예상치 못한 응답:", response);
        }
      } catch (error) {
        console.error("선택된 메시지 가져오기 중 오류 발생:", error.message);
      }
    });
  }
});
