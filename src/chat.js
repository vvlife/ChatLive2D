import randomSelection from "./utils.js";

let messageTimer;

let shareMsg;

function showResponseToUser(text, timeout) {
    const tips = document.getElementById("waifu-tips");
    if(shareMsg == null && text != null){
        shareMsg = text;
        return;
    }
    if(shareMsg == null){
        return;
    }
    console.log("get text1: " + text);
    var input = shareMsg;
    shareMsg = null;
    text = getOllamaResponse(input);
    console.log("hello1:"+text);
    if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > 8)) return;
    if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
    }
    text = randomSelection(text);
    sessionStorage.setItem("waifu-text", 8);
    tips.innerHTML = text;
    tips.classList.add("waifu-tips-active");
    messageTimer = setTimeout(() => {
        sessionStorage.removeItem("waifu-text");
        tips.classList.remove("waifu-tips-active");
    }, timeout);
    shareMsg == null;
}

function getOllamaResponse(content) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', live2d_path + 'proxy', false); // false makes it synchronous
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  const data = {
    model: 'qwen2.5:0.5b',
    messages: [
      { role: 'user', content: content }
    ],
    stream: false
  };

  xhr.send(JSON.stringify(data));

  if (xhr.status === 200) {
    const response = JSON.parse(xhr.responseText);
    return response.message.content;
  } else {
    throw new Error(`HTTP error! status: ${xhr.status}`);
  }
}

export default showResponseToUser;