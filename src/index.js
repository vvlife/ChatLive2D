import Model from "./model.js";
import showMessage from "./message.js";
import showResponseToUser from "./chat.js";
import randomSelection from "./utils.js";
import tools from "./tools.js";

function loadWidget(config) {

    const model = new Model(config);
    localStorage.removeItem("waifu-display");
    sessionStorage.removeItem("waifu-text");
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu">
            <div id="waifu-tips">按住我說話</div>
            <canvas id="live2d" width="800" height="800"></canvas>
            <div id="waifu-tool"></div>
        </div>
        <style>
            #waifu {
                position: fixed;
                left: 20px;
                bottom: 20px;
                width: 300px;
                height: 300px;
                cursor: move;
                user-select: none;
                z-index: 1000;
            }

            // #waifu-tips {
            //     position: absolute;
            //     bottom: 100%;
            //     left: 50%;
            //     transform: translateX(-50%);
            //     padding: 10px;
            //     background-color: rgba(255, 255, 255, 0.8);
            //     border-radius: 5px;
            //     margin-bottom: 10px;
            //     display: none;
            //     white-space: nowrap;
            // }

            #waifu-tips.waifu-tips-active {
                display: block;
            }
        </style>
        `);

        let savedApiKey = localStorage.getItem('savedApiKey');

        // 添加拖動功能
        const waifuElement = document.getElementById('waifu');
        let isDragging = false;
        let offsetX, offsetY;

        waifuElement.addEventListener('mousedown', (e) => {
            savedApiKey = localStorage.getItem('savedApiKey');
            if (e.target === waifuElement) {
                isDragging = true;
                offsetX = e.clientX - waifuElement.getBoundingClientRect().left;
                offsetY = e.clientY - waifuElement.getBoundingClientRect().top;
                waifuElement.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                waifuElement.style.left = (e.clientX - offsetX) + 'px';
                waifuElement.style.top = (e.clientY - offsetY) + 'px';
                waifuElement.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            waifuElement.style.cursor = 'move';
        });

        // 顯示初始提示
        setTimeout(() => {
            const tips = document.getElementById('waifu-tips');
            tips.classList.add('waifu-tips-active');
            setTimeout(() => {
                showMessage(`主人可以長按開始對話哦~<br>首次使用請點擊信息圖標設置API密鑰`, 4000);
            }, 1000);
            tips.classList.remove('waifu-tips-active');
        }, 1000);

        // 添加錄音功能到人物
        let mediaRecorder;
        let audioChunks = [];

        waifuElement.addEventListener('mousedown', async () => {
            const tips = document.getElementById('waifu-tips');
            tips.innerHTML = "正在錄音...";
            tips.classList.add('waifu-tips-active');
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };
                mediaRecorder.start();
            } catch (err) {
                console.error('錄音錯誤:', err);
                tips.innerHTML = "錄音失敗，請重試";
            }
        });

        waifuElement.addEventListener('mouseup', async () => {
            const tips = document.getElementById('waifu-tips');
            tips.classList.remove('waifu-tips-active');
            
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = [];
                    
                    // 使用保存的API KEY
                    const apiKey = localStorage.getItem('siliconflow_api_key') || 'YOUR_API_KEY';
                    
                    // 後續API調用代碼保持不變...
                    // 调用语音转文本API
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'recording.wav');
                    formData.append('model', 'FunAudioLLM/SenseVoiceSmall');
                    
                    try {
                        // 第一步：语音转文本
                        const transcribeResponse = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + savedApiKey
                            },
                            body: formData
                        });
                        
                        const transcription = await transcribeResponse.json();
                        
                        // 第二步：发送给对话模型
                        const chatResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + savedApiKey
                            },
                            body: JSON.stringify({
                                model: 'Qwen/Qwen2.5-7B-Instruct',
                                messages: [
                                    { role: 'user', content: transcription.text }
                                ],
                                stream: false
                            })
                        });
                        
                        const result = await chatResponse.json();
                        
                        // 验证响应结构
                        if (!result.choices || !result.choices[0] || !result.choices[0].message || !result.choices[0].message.content) {
                            throw new Error('Invalid API response structure');
                        }
                        
                        const responseText = result.choices[0].message.content;

                    
                        
                        // 在人物对话框显示结果
                        const tips = document.getElementById('waifu-tips');
                        tips.innerHTML = responseText;
                        tips.classList.add('waifu-tips-active');
                        
                        // 语音播报结果
                        const speechResponse = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + savedApiKey
                            },
                            body: JSON.stringify({
                                model: 'FunAudioLLM/CosyVoice2-0.5B',
                                input: result.choices[0].message.content,
                                voice: 'FunAudioLLM/CosyVoice2-0.5B:diana',
                                response_format: 'mp3'
                            })
                        });
                        
                        const audioBlob = await speechResponse.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();
                    } catch (err) {
                        console.error('API调用错误:', err);
                    }
                };
            }
        });

    // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
    setTimeout(() => {
        document.getElementById("waifu").style.bottom = "20px";
    }, 0);

    (function registerTools() {
        tools["switch-model"].callback = () => model.loadOtherModel();
        tools["switch-texture"].callback = () => model.loadRandModel();
        if (!Array.isArray(config.tools)) {
            config.tools = Object.keys(tools);
        }
        for (let tool of config.tools) {
            if (tools[tool]) {
                const { icon, callback } = tools[tool];
                document.getElementById("waifu-tool").insertAdjacentHTML("beforeend", `<span id="waifu-tool-${tool}">${icon}</span>`);
                document.getElementById(`waifu-tool-${tool}`).addEventListener("click", callback);
            }
        }
    })();

    function welcomeMessage(time) {
        if (location.pathname === "/") { // 如果是主页
            for (let { hour, text } of time) {
                const now = new Date(),
                    after = hour.split("-")[0],
                    before = hour.split("-")[1] || after;
                if (after <= now.getHours() && now.getHours() <= before) {
                    return text;
                }
            }
        }
        const text = `欢迎阅读<span>「${document.title.split(" - ")[0]}」</span>`;
        let from;
        if (document.referrer !== "") {
            const referrer = new URL(document.referrer),
                domain = referrer.hostname.split(".")[1];
            const domains = {
                "baidu": "百度",
                "so": "360搜索",
                "google": "谷歌搜索"
            };
            if (location.hostname === referrer.hostname) return text;

            if (domain in domains) from = domains[domain];
            else from = referrer.hostname;
            return `Hello！来自 <span>${from}</span> 的朋友<br>${text}`;
        }
        return text;
    }

    function registerEventListener(result) {
        // 检测用户活动状态，并在空闲时显示消息
        let userAction = false,
            userActionTimer,
            messageArray = result.message.default,
            lastHoverElement;
        window.addEventListener("mousemove", () => userAction = true);
        window.addEventListener("keydown", () => userAction = true);

        setInterval(() => {
            if (userAction) {
                userAction = false;
                clearInterval(userActionTimer);
                userActionTimer = null;
            } else if (!userActionTimer) {
                userActionTimer = setInterval(() => {
                    showResponseToUser(null, 10000);
                }, 20);
            }
        }, 10);

        result.seasons.forEach(({ date, text }) => {
            const now = new Date(),
                after = date.split("-")[0],
                before = date.split("-")[1] || after;
            if ((after.split("/")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split("/")[0]) && (after.split("/")[1] <= now.getDate() && now.getDate() <= before.split("/")[1])) {
                text = randomSelection(text);
                text = text.replace("{year}", now.getFullYear());
                messageArray.push(text);
            }
        });

    }

    (function initModel() {
        let modelId = localStorage.getItem("modelId"),
            modelTexturesId = localStorage.getItem("modelTexturesId");
        if (modelId === null) {
            // 首次访问加载 指定模型 的 指定材质
            modelId = 1; // 模型 ID
            modelTexturesId = 53; // 材质 ID
        }
        model.loadModel(modelId, modelTexturesId);
        fetch(config.waifuPath)
            .then(response => response.json())
            .then(registerEventListener);
    })();
}

function initWidget(config, apiPath) {
    if (typeof config === "string") {
        config = {
            waifuPath: config,
            apiPath
        };
    }
    document.body.insertAdjacentHTML("beforeend", `<div id="waifu-toggle">
            <span>看板娘</span>
        </div>`);
    const toggle = document.getElementById("waifu-toggle");
    toggle.addEventListener("click", () => {
        toggle.classList.remove("waifu-toggle-active");
        if (toggle.getAttribute("first-time")) {
            loadWidget(config);
            toggle.removeAttribute("first-time");
        } else {
            localStorage.removeItem("waifu-display");
            document.getElementById("waifu").style.display = "";
            setTimeout(() => {
                document.getElementById("waifu").style.bottom = 0;
            }, 0);
        }
    });
    if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
        toggle.setAttribute("first-time", true);
        setTimeout(() => {
            toggle.classList.add("waifu-toggle-active");
        }, 0);
    } else {
        loadWidget(config);
    }
    const form = document.getElementById('myform');
    form.addEventListener('submit', event => {
        event.preventDefault(); // 防止表单提交
        const inputMsg = document.getElementById('input-msg');
        const msg = inputMsg.value;
        inputMsg.value = '';
        console.log("user msg: " + msg);
        showResponseToUser(msg, 4000);
    });

    const waifu = document.getElementById("waifu");
    let isDragging = false;
    let startX;
    let startY;
    let originalX;
    let originalY;

    function getTransformValues() {
        const transform = window.getComputedStyle(waifu).transform;
        if (transform === 'none') return { x: 0, y: 0 };
        
        const matrix = new DOMMatrix(transform);
        return {
            x: matrix.m41,
            y: matrix.m42
        };
    }

    function dragStart(e) {
        if (e.target === waifu || waifu.contains(e.target)) {
            isDragging = true;
            const { x, y } = getTransformValues();
            originalX = x;
            originalY = y;
            startX = e.clientX;
            startY = e.clientY;
            
            // 添加临时事件监听
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);
        }
    }

    function drag(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newX = originalX + deltaX;
        const newY = originalY + deltaY;
        
        waifu.style.transform = `translate(${newX}px, ${newY}px)`;
    }

    function dragEnd() {
        isDragging = false;
        
        // 移除临时事件监听
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
    }

    // 只在waifu元素上监听mousedown
    waifu.addEventListener('mousedown', dragStart);

}

export default initWidget;

