const siteConfigs = {
  'chat.openai.com': {
    name: 'ChatGPT',
    messageSelector: '[data-message-author-role]',
    contentSelector: '.whitespace-pre-wrap',
    alternativeContentSelector: '.markdown',
    modelInfoSelector: '#model-selector button span', // 예시 선택자
  },
  'claude.ai': {
    name: 'Claude',
    messageSelector: '.message', // Claude의 메시지 선택자 (예시)
    contentSelector: '.message-content', // Claude의 내용 선택자 (예시)
    alternativeContentSelector: '.markdown-content', // 대체 내용 선택자 (예시)
    modelInfoSelector: '.model-info', // 모델 정보 선택자 (예시)
  },
  'copilot.microsoft.com': {
    name: 'Copilot',
    messageSelector: '.copilot-message', // Copilot의 메시지 선택자 (예시)
    contentSelector: '.message-text', // Copilot의 내용 선택자 (예시)
    alternativeContentSelector: '.formatted-content', // 대체 내용 선택자 (예시)
    modelInfoSelector: '.model-version', // 모델 정보 선택자 (예시)
  }
};
