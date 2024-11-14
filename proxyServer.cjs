const express = require('express');
const request = require('request');
var XMLHttpRequest = require('xhr2');
var xhr = new XMLHttpRequest();

const bodyParser = require('body-parser');
const https = require('https');

const app = express();

app.use(express.json());

app.use(express.static(__dirname + "/")); //use static files in ROOT/public folder

app.get("/", function(request, response){ //root dir
    response.send("Hello!!");
});

app.post('/proxy-baidu', (req, res) => {
    const access_token = req.query.access_token; // 从查询参数获取 access_token
    const messages = req.body.messages;

    const data = JSON.stringify({
        messages: messages
    });

    console.log("proxy get message1: " + data);

    const options = {
        hostname: 'aip.baidubce.com',
        // https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ai_apaas
        path: `/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/yi_34b_chat?access_token=${access_token}`,
        //path: `/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/yi_34b_chat?access_token=${access_token}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(proxyRes.statusCode).send(data);
        });
    });

    proxyReq.on('error', (error) => {
        console.log(error);
        res.status(500).send(error);
    });

    proxyReq.write(data);
    proxyReq.end();
});

app.post('/proxy-token-front-end', (req, res) => {
    const options = {
        url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + req.query.client_id + '&client_secret=' + req.query.client_secret,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
    };

    request(options, (error, response, body) => {
        if (error) {
            console.log(error)
            return res.status(500).send(error);
        }
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(response.statusCode).send(body);
    });
});

app.post('/proxy-token', (req, res) => {
    const options = {
        url: 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + AK + '&client_secret=' + SK,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
    };

    request(options, (error, response, body) => {
        if (error) {
            console.log(error)
            return res.status(500).send(error);
        }
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(response.statusCode).send(body);
    });
});

app.post('/proxy', (req, res) => {
    const options = {
        url: 'http://localhost:11434/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'qwen2.5:0.5b',
            messages: [
                { role: 'user', content: req.body.messages[0].content }
            ],
            stream: false
        })
    };
    console.log("req.body: " + JSON.stringify(req.body))
    request(options, (error, response, body) => {
        if (error) {
            console.log(error);
            return res.status(500).send(error);
        }
        
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(response.statusCode).send(body);
    });
});

// 添加对应的 OPTIONS 请求处理
app.options('/proxy-ollama', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).send();
});

app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","content-type");
    //跨域允许的请求方式 
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options'){
        res.send(200);  //让options尝试请求快速结束
    }
    else{
        next();
    }
});


app.listen(8000, () => {
    console.log('Proxy server running on http://localhost:80');
});
