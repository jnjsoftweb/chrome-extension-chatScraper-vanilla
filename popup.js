document.addEventListener("DOMContentLoaded", function () {
  const checkMessagesButton = document.getElementById("checkMessages");
  const saveMessagesButton = document.getElementById("saveMessages");

  async function ensureContentScriptInjected(tabId) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content.js"],
        },
        (result) => {
          if (chrome.runtime.lastError) {
            console.error("콘텐츠 스크립트 주입 오류:", chrome.runtime.lastError);
          } else {
            console.log("콘텐츠 스크립트 주입 완료");
          }
          resolve(result);
        }
      );
    });
  }

  async function sendMessageToActiveTab(message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) {
          reject(new Error("활성 탭을 찾을 수 없습니다"));
          return;
        }

        try {
          await ensureContentScriptInjected(tabs[0].id);
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  if (checkMessagesButton) {
    checkMessagesButton.addEventListener("click", async () => {
      try {
        await sendMessageToActiveTab({ action: "addCheckboxes" });
        console.log("체크박스가 성공적으로 추가되었습니다");
      } catch (error) {
        console.error("체크박스 추가 중 오류 발생:", error);
      }
    });
  }

  if (saveMessagesButton) {
    saveMessagesButton.addEventListener("click", async () => {
      try {
        const response = await sendMessageToActiveTab({ action: "getSelectedMessages" });
        if (response && response.messages) {
          const markdown = response.messages.map((msg) => `## ${msg.role}\n\n${msg.content}\n\n`).join("");
          chrome.runtime.sendMessage({
            action: "saveMarkdown",
            markdown: markdown,
          });
        }
      } catch (error) {
        console.error("선택된 메시지 가져오기 중 오류 발생:", error);
      }
    });
  }
});