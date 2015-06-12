var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var mongojs = require('mongojs');
		  var db = mongojs('registration',['requests']);
      
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/', function (req, res) {
  console.log(req.body);
  
  console.log("test: " + req.body.request);
  var request = req.body.request;
  request.status = 'new';
  db.requests.save(request);
  res.send("hi")
});

var server = app.listen(3300, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});