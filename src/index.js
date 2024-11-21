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
            <div id="waifu-tips"></div>
            <canvas id="live2d" width="800" height="800"></canvas>
            <div id="waifu-tool"></div>
        </div>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }



            #myform {
                z-index: 1000; 
                display: flex;
                gap: 10px;
                padding: 20px;
                // background-color: white; /* 可选，设置背景色 */
                // border-top: 1px solid #eee; /* 可选，添加上边框 */
                position: sticky;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                background-color: rgba(255, 255, 255, 0.5); /* 改为半透明 */
                border-top: 1px solid rgba(238, 238, 238, 0.5); /* 边框也改为半透明 */
            }

            #input-msg {
                flex: 1;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
                font-size: 16px;
                background-color: rgba(255, 255, 255, 0.5); /* 改为半透明 */
                border-top: 1px solid rgba(238, 238, 238, 0.5); /* 边框也改为半透明 */
            }

            input[type="submit"] {
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.3s;
            }

            input[type="submit"]:hover {
                background-color: #45a049;
            }

            /* 新增移动设备适配 */
            @media screen and (max-width: 480px) {
                body {
                    padding: 10px;
                }

                #myform {
                    padding: 10px;
                    gap: 8px;
                }

                #input-msg {
                    padding: 10px;
                    font-size: 15px;
                }

                input[type="submit"] {
                    padding: 10px 15px;
                    font-size: 15px;
                }
            }

        </style>
        <form id="myform"">
        <input type="text" id = "input-msg" name="input-msg" value=""><br>
        <input name="Submit"  type="submit" value="Send"/>
        </form>
        `);

    // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
    setTimeout(() => {
        document.getElementById("waifu").style.bottom = 0;
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
