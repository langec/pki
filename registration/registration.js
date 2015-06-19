var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var mongojs = require('mongojs');
var db = mongojs('registration',['requests']);

//alle get-requests an den server fangen
app.get('/*', function (req, res) {
  console.log('received request for: ' + req.path);
  var valid = true;
  var filepath;
  
  // je nach angeforderter datei, aber nur die 4, keine anderen
  switch (req.path) {
    case "/":
      filepath = './index.html';
      break;
    case '/reg-ng.js':
      filepath = './reg-ng.js';
      break;
    case '/angular.min.js':
      filepath = './angular/angular.min.js';
      break;
    case '/angular.min.js.map':
      filepath = './angular/angular.min.js.map';
      break;
    default:
      valid = false;
      break;
  }
  //wenn eine gültige anfrage gestellt wurde datei lesen udn schicken
  if(valid){
    fs.readFile(filepath, function(err,file) {
      res.writeHead(200);
      res.write(file);
      res.end();
    });
  }else{
    // wenn nicht dann 404 - file not found
    res.writeHead(404);
    res.write('file not found JUNGE!!');
    res.end();
  }
  
});

// client(index.html bzw reg-ng.js) postet neuen request
app.post('/', function (req, res) {
  console.log(req.body);
  //cert request informationen aus html request(req) lesen
  var registrationRequest = req.body.registrationRequest;
  registrationRequest.status = 'new';
  //cert request in db speichern
  db.requests.save(registrationRequest);
  res.send("OK")
});

//server starten
var server = app.listen(3300, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Registration app listening at http://%s:%s', host, port);
});