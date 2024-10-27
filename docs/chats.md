```prompt
@Codebase 
chatGPT나 claude ai 같은 인공지능 챗봇을 사용할 때, 채팅 메시지를 선택(체크박스)하여 마크다운으로 저장하는 chrome extension을 만들고 싶어요.
```



<div data-message-author-role="user" data-message-id="aaa207c4-c2c5-4ec2-9147-4b2db1eb9bf8" dir="auto" class="min-h-8 text-message flex w-full flex-col items-end gap-2 whitespace-normal break-words [.text-message+&amp;]:mt-5"><input type="checkbox" class="message-checkbox" data-index="0"><div class="flex w-full flex-col gap-1 empty:hidden items-end rtl:items-start"><div class="relative max-w-[70%] rounded-3xl px-5 py-2.5 bg-[#f4f4f4] dark:bg-token-main-surface-secondary"><div class="whitespace-pre-wrap">chatGPT 대화 중 필요한 부분을 선택해서 마크다운 파일로 저장할 수 있는 크롬 익스텐션을 만들고 싶어요.</div></div></div></div>


<div data-message-author-role="assistant" data-message-id="4151abf2-d86b-4eec-9b54-5b69b0e9ccfa" dir="auto" class="min-h-8 text-message flex w-full flex-col items-end gap-2 whitespace-normal break-words [.text-message+&amp;]:mt-5" data-message-model-slug="gpt-4o"><input type="checkbox" class="message-checkbox" data-index="1"><div class="flex w-full flex-col gap-1 empty:hidden first:pt-[3px]"><div class="markdown prose w-full break-words dark:prose-invert light"><p>🧙🏾‍♂️: 대화를 마크다운 파일로 선택 저장할 수 있는 크롬 익스텐션을 개발하고자 하는군요! 멋진 아이디어예요! 우선 목표를 확실히 하기 위해 몇 가지 질문이 있어요:</p><ol><li>대화의 <strong>어느 부분</strong>을 저장할지 선택하는 UI/UX가 필요할까요? 예를 들어, 텍스트를 드래그해서 선택한다든지, 특정 메시지를 체크박스로 선택한다든지 하는 방식이 있을 수 있겠네요.</li><li>저장된 마크다운 파일의 형식은 어떻게 구성되길 원하시나요? (예: <code># 헤더</code>, <code>- 리스트</code>, 혹은 일반 텍스트 등)</li><li>버튼을 누르면 바로 파일로 저장되는 방식인지, 아니면 미리보기와 수정 후 저장 기능도 필요하신가요?</li></ol><p>이 질문들을 통해 프로젝트의 방향을 명확히 하고 함께 익스텐션을 만들어봅시다! 😎</p><p>어떻게 진행하고 싶으신가요?</p></div></div></div>



네, 이 부분의 기능을 자세히 설명해 드리겠습니다. 해당 코드는 마크다운 형식의 코드 블록을 식별하고 변환하는 역할을 합니다.

content = content.replace(/(\w+)\n코드 복사\n([\s\S]*?)(?=\n\n(?=\S)|\n(?=\d)|\n(?=[^\w\s])|\n$|$)/gm, (match, lang, code) => {
  code = code.trim();
  return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
});

이 정규 표현식의 각 부분을 설명하겠습니다:
1. (\w+): 언어 이름을 캡처합니다 (예: javascript, python 등).
\n코드 복사\n: "코드 복사" 문자열을 찾습니다.
([\s\S]*?): 코드 블록의 내용을 캡처합니다. 이는 모든 문자(줄 바꿈 포함)를 최소한으로 매칭합니다.
(?=\n\n(?=\S)|\n(?=\d)|\n(?=[^\w\s])|\n$|$): 이 부분은 코드 블록의 끝을 찾습니다.
\n\n(?=\S): 빈 줄 다음에 비공백 문자가 오는 경우
\n(?=\d): 줄 시작이 숫자인 경우
\n(?=[^\w\s]): 줄 시작이 영문자나 공백이 아닌 경우
\n$: 문자열의 마지막 줄인 경우
$: 문자열의 끝인 경우
그러나 이 방식으로도 모든 경우를 정확하게 처리하지 못하고 있는 것 같습니다. 코드 블록을 더 정확하게 식별하기 위해 다음과 같이 수정해 보겠습니다:



- 빈 줄 다음에 나오는 줄의 첫 문자가
  - 숫자 이거나
  - 공백문자, '/', '#', 알파벳이 아닌 경우

그 바로 전이 코드 블럭의 끝이 되고,

이 경우에 바로 전 빈 줄까지 코드 블럭으로 하고,
빈 줄을 하나 더 추가하면 될 것 같아요.

이것을 정규식으로 표현할 수 있나요?



const text = `
html
코드 복사
<!DOCTYPE html>
<html>
  <head>
    <title>Save as Markdown</title>
    <style>
      button {
        padding: 8px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h3>Select messages to save</h3>
    <button id="save">Save to Markdown</button>
    <script src="popup.js"></script>
  </body>
</html>

json
코드 복사
{
  "manifest_version": 3,
  "name": "ChatGPT to Markdown",
  "version": "1.0"
}
`;

// 언어를 포함해 코드 블럭 감싸기
const replacedText = text.replace(/([a-zA-Z]+)\n코드 복사\n([\s\S]*?)(?=\n(?:[a-zA-Z]+\n코드 복사|$))/g, "```$1\n$2\n```");
console.log(replacedText);



### 

@Codebase 
현재 크롬 익스텐션의 설정값을 크롬 브라우저에서 조정하게 할 수 있나요.
'설정' 버튼을 누르면,

"""
- 체크 박스 디폴트: (v)true, ()false
- 저장 파일: [v] json, [v] md, [v] 코드블럭 적용 md
- page: [v] chatgpt.com [] claude.ai  [] copilot
"""

등과 같은 설정 화면이 뜨고, 설정을 변경하면 익스텐션의 설정값이 바뀌면서 기능이 분화되도록 하는 기능요


'설정'에

"""
- 저장 폴더: 
- 파일 이름:
"""