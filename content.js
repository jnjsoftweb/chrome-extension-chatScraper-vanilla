console.log("컨텐츠 스크립트가 로드되었습니다!");

// 전역 변수 선언을 피하기 위해 즉시 실행 함수를 사용합니다.
(function() {
  console.log("ChatGPT 페이지 구조:", document.body.innerHTML);

  function addCheckboxesToMessages() {
    const messages = document.querySelectorAll("[data-message-author-role]");
    console.log("찾은 메시지 수:", messages.length);

    messages.forEach((message, index) => {
      if (!message.querySelector(".message-checkbox")) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "message-checkbox";
        checkbox.dataset.index = index;
        checkbox.checked = true;  // 기본적으로 체크된 상태로 설정
        message.insertBefore(checkbox, message.firstChild);
        console.log("체크박스 추가됨:", index);
      }
    });
  }

  function observeChat() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const callback = function (mutationsList, observer) {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          addCheckboxesToMessages();
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

  function getSelectedMessages() {
    const selectedMessages = [];
    const checkboxes = document.querySelectorAll(".message-checkbox:checked");
    checkboxes.forEach((checkbox) => {
      const message = checkbox.closest("[data-message-author-role]");
      const role = message.getAttribute("data-message-author-role");

      let content = "";
      const contentElement = message.querySelector(".whitespace-pre-wrap");
      if (contentElement) {
        content = contentElement.innerText.trim();
      } else {
        const markdownElement = message.querySelector(".markdown");
        if (markdownElement) {
          content = markdownElement.innerText.trim();
        } else {
          content = "내용을 찾을 수 없습니다.";
        }
      }

      selectedMessages.push({ role, content });
    });
    return selectedMessages;
  }

  function convertToMarkdown(messages) {
    return messages.map(msg => {
      const roleIcon = msg.role === 'assistant' ? '🤖' : '👤';
      return `## ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n\n${msg.content}\n\n`;
    }).join('---\n\n');
  }

  function registerMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("메시지 수신:", request);

      if (request.action === "ping") {
        sendResponse({ status: "Content script is alive" });
      } else if (request.action === "addCheckboxes") {
        addCheckboxesToMessages();
        sendResponse({ status: "Checkboxes added" });
      } else if (request.action === "getSelectedMessages") {
        const messages = getSelectedMessages();
        console.log("선택된 메시지:", messages);
        if (messages.length > 0) {
          const markdown = convertToMarkdown(messages);
          chrome.runtime.sendMessage({
            action: "saveMarkdown",
            markdown: markdown
          });
          sendResponse({ status: "Markdown sent for saving" });
        } else {
          sendResponse({ status: "No messages selected" });
        }
      }

      return true; // 비동기 응답을 위해 true 반환
    });
  }

  // 페이지 로드 시 체크박스 추가 및 옵저버 시작
  addCheckboxesToMessages();
  observeChat();
  registerMessageListener();
})();
