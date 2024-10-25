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
          console.log("마크다운이 성공적으로 저장되었습니다.");
          alert("선택한 메시지가 마크다운 파일로 저장되었습니다.");
        } else if (response && response.status === "No messages selected") {
          console.log("선택된 메시지가 없습니다.");
          alert("선택된 메시지가 없습니다. 메시지를 선택한 후 다시 시도해 주세요.");
        } else {
          console.error("예상치 못한 응답:", response);
          alert("예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.");
        }
      } catch (error) {
        console.error("선택된 메시지 가져오기 중 오류 발생:", error.message);
        alert("메시지를 가져오는 중 오류가 발생했습니다: " + error.message);
      }
    });
  }
});
