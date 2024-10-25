console.log("컨텐츠 스크립트가 로드되었습니다!");
// 여기에 웹 페이지에서 실행될 코드를 작성합니다

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
    const content = message.querySelector(".text-message").textContent;
    selectedMessages.push({ role, content });
  });
  return selectedMessages;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("메시지 수신:", request);
  if (request.action === "ping") {
    sendResponse({ status: "Content script is alive" });
  } else if (request.action === "addCheckboxes") {
    addCheckboxesToMessages();
    sendResponse({ status: "Checkboxes added" });
  } else if (request.action === "getSelectedMessages") {
    sendResponse({ messages: getSelectedMessages() });
  }
  return true; // 비동기 응답을 위해 true 반환
});

// 페이지 로드 시 체크박스 추가 및 옵저버 시작
addCheckboxesToMessages();
observeChat();