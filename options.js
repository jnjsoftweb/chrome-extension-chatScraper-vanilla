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
      saveFolder: "",
    },
    function (items) {
      document.getElementById("defaultChecked").checked = items.defaultChecked;
      document.getElementById("saveJson").checked = items.saveJson;
      document.getElementById("saveMarkdown").checked = items.saveMarkdown;
      document.getElementById("saveMarkdownWithCodeBlock").checked = items.saveMarkdownWithCodeBlock;
      document.getElementById("enableChatGPT").checked = items.enableChatGPT;
      document.getElementById("enableClaude").checked = items.enableClaude;
      document.getElementById("enableCopilot").checked = items.enableCopilot;
      document.getElementById("saveFolder").value = items.saveFolder;
    }
  );

  // 폴더 선택 버튼 클릭 이벤트
  document.getElementById("chooseFolderBtn").addEventListener("click", function () {
    const folderInput = document.getElementById("saveFolder");
    folderInput.value = folderInput.value || "downloads/";  // 기본값 설정
    folderInput.disabled = false;  // 사용자가 직접 입력할 수 있도록 활성화
  });

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
        saveFolder: document.getElementById("saveFolder").value,
      },
      function () {
        alert("설정이 저장되었니다.");
      }
    );
  });

  document.getElementById("saveFolder").placeholder = "예: chatgpt (다운로드 폴더 내 경로)";
});
