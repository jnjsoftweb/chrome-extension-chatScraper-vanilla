document.addEventListener("DOMContentLoaded", function () {
  // 저장된 설정 불러오기
  chrome.storage.sync.get(
    {
      defaultChecked: true,
      saveJson: true,
      saveMarkdown: true,
      saveMarkdownWithCodeBlock: true,
      enableChatGPT: true,
      enableClaude: false,
      enableCopilot: false,
    },
    function (items) {
      document.getElementById("defaultChecked").checked = items.defaultChecked;
      document.getElementById("saveJson").checked = items.saveJson;
      document.getElementById("saveMarkdown").checked = items.saveMarkdown;
      document.getElementById("saveMarkdownWithCodeBlock").checked = items.saveMarkdownWithCodeBlock;
      document.getElementById("enableChatGPT").checked = items.enableChatGPT;
      document.getElementById("enableClaude").checked = items.enableClaude;
      document.getElementById("enableCopilot").checked = items.enableCopilot;
    }
  );

  // 저장 버튼 클릭 이벤트
  document.getElementById("save").addEventListener("click", function () {
    chrome.storage.sync.set(
      {
        defaultChecked: document.getElementById("defaultChecked").checked,
        saveJson: document.getElementById("saveJson").checked,
        saveMarkdown: document.getElementById("saveMarkdown").checked,
        saveMarkdownWithCodeBlock: document.getElementById("saveMarkdownWithCodeBlock").checked,
        enableChatGPT: document.getElementById("enableChatGPT").checked,
        enableClaude: document.getElementById("enableClaude").checked,
        enableCopilot: document.getElementById("enableCopilot").checked,
      },
      function () {
        alert("설정이 저장되었습니다.");
      }
    );
  });
});
