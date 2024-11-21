const express = require('express');
const request = require('request');
var XMLHttpRequest = require('xhr2');
var xhr = new XMLHttpRequest();

const bodyParser = require('body-parser');
const https = require('https');

const app = express();

app.use(express.json());

app.all("*", function (req, res, next) {
  console.log(`${req.method} request to ${req.url}`); // Log incoming requests
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, POST, GET, OPTIONS");

  if (req.method.toLowerCase() === "options") {
    console.log("Handling OPTIONS request");
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.static(__dirname + "/")); //use static files in ROOT/public folder

app.get("/", function(request, response){ //root dir
    response.send("Hello!!");
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

app.listen(80, () => {
    console.log('Proxy server running on http://localhost:80');
});
