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

  function registerMessageListener() {
    let lastRequestTime = 0;
    const DEBOUNCE_TIME = 1000; // 1000ms로 증가

    let isProcessing = false;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("메시지 수신:", request);
      const now = Date.now();
      if (now - lastRequestTime < DEBOUNCE_TIME || isProcessing) {
        console.log("중복 요청 무시");
        return true;
      }
      lastRequestTime = now;
      isProcessing = true;

      if (request.action === "ping") {
        sendResponse({ status: "Content script is alive" });
        isProcessing = false;
      } else if (request.action === "addCheckboxes") {
        addCheckboxesToMessages();
        sendResponse({ status: "Checkboxes added" });
        isProcessing = false;
      } else if (request.action === "getSelectedMessages") {
        const messages = getSelectedMessages();
        console.log("선택된 메시지:", messages);
        setTimeout(() => {
          sendResponse({ messages: messages });
          isProcessing = false;
        }, 100); // 약간의 지연을 추가
      }
      return true; // 비동기 응답을 위해 true 반환
    });
  }

  // 페이지 로드 시 체크박스 추가 및 옵저버 시작
  addCheckboxesToMessages();
  observeChat();
  registerMessageListener();
})();
