var express = require('express');
var bodyParser = require('body-parser');
var exec = require("child_process").exec, child;
var fs = require('fs');

var app = express();

function handleError(res, err)
{
    if(err)
    {
        console.log("ERROR: " + err);
        res.writeHead(500, {"Content-type" : "text/plain"});
        res.end("ERROR: " + err);
    }
}

app.use(bodyParser.text({}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    console.log("Sending help response.");
    res.writeHead(200, {"Content-type" : "text/plain"});
    res.end("To issue a validation request: POST to /validate");
});

app.post('/validate', function (req, res) {
    res.end("TODO");
});

app.listen(8080);