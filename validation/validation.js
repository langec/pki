var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var mongojs = require('mongojs');
var db = mongojs('registration',['requests']);
var http = require('http');

//alle get-requests an den server fangen
app.get('/*', function (req, res) {
  console.log('received request for: ' + req.path);
  var valid = true;
  var filepath;
  
  // je nach angeforderter datei, aber nur die 4, keine anderen
  switch (req.path) {
    case '/':
      filepath = './index.html';
      break;
    case '/validation-ng.js':
      filepath = './validation-ng.js';
      break;
    case '/angular.min.js':
      filepath = './angular/angular.min.js';
      break;
    case '/angular.min.js.map':
      filepath = './angular/angular.min.js.map';
      break;
    case '/registrationrequests':
      //api
      //db auf offene request abfragen
      db.requests.find({status:'new' },function(err, docs) {
        var data = docs;
        //antwort schicken
        res.send(data);
      });
      break;
    default:
      valid = false;
      break;
  }
  
  //wenn eine gültige anfrage gestellt wurde 
  if(valid){
    if(filepath){
      //wenn datei angefordert, dann lesen und schicken
      fs.readFile(filepath, function(err,file) {
        if(err){
          console.log('err:' + err);
          res.writeHead(500);
          res.write('error reading file');
          res.end();
        }else{
          res.writeHead(200);
          res.write(file);
          res.end();
        }
      });
    }else{
      //sonst api, wurde bereits abgearbeitet (res.send())
      console.log("API-call");
    }
  }else{
  // wenn nicht dann 404 - file not found
    res.writeHead(404);
    res.write('file not found JUNGE!!');
    res.end();
  }
  
});

app.get('/', function (req, res) {
  //offene requests holen
   db.requests.find({status:'new' },function(err, docs) {
    // docs is an array of all the documents in mycollection
    var data = docs;
    res.send(data);
  });
  
});

app.post('/approve', function (req, res) {
  //registration request auf "approved" setzen und csr erstellen und an ca schicken
  var csrRequest;
  //db update, request auf "approved" setzen
  db.requests.findAndModify({
      query: { _id: mongojs.ObjectId(req.body.id) },
      update: { $set: { status:'approved' } },
      new: true
  }, function(err, doc, lastErrorObject) {
    //datenbank hat request auf approved gesetzt und in 'doc' zurückgeliefert
      csrRequest = doc;
      console.log(doc.cn);
      
      //für kommandozeilenbefehl
      var exec = require('child_process').exec;
      
      //cert req erstellen per kommandozeile und openssl
      var child = exec("openssl req -new -config etc/server.conf -out csrs/"+csrRequest.cn+".csr -keyout pkeys/"+csrRequest.cn+".key -subj /C="+csrRequest.c+"/ST=\""+csrRequest.st+"\"/L=\""+csrRequest.l+"\"/O=\""+csrRequest.o+"\"/OU=\""+csrRequest.ou+"\"/CN=\""+csrRequest.cn+"\"",
        function (error, stdout, stderr) {
          console.log("exec done");
          //kommandozeilenausgabe überprüfen
          if(error){
            console.log("error" + error);
            console.log(stderr);
            res.send("request not approved, check serverlog");
          }else{
            console.log("reading csr file: " + "./csrs/"+csrRequest.cn+".csr")
          
            //csr lesen und an ca schicken
            fs.readFile("./csrs/"+csrRequest.cn+".csr",'utf-8',function(err,data){
              if(!err){
                console.log("postToCa");
                //an ca schicken
                postToCa(data);
              }else{
                console.log(err);
              }
            });
            res.send("request approved");
          }
      //ende exec callback
      });
      
      //db.requests.save(req.body.request);
      
  });
});


app.post('/reject', function (req, res) {
  //registration request  auf rejected setzen
  db.requests.findAndModify({
      query: { _id: mongojs.ObjectId(req.body.id) },
      update: { $set: { status:'rejected' } },
      new: true
  }, function(err, doc, lastErrorObject) {
      //hier passiert nix
  });
  res.send("request rejected");
});

//schickt csr an ca
function postToCa(data){
  console.log("posting csr to ca:");
  console.log(data);
  //http-post header / optionen
  var caPostOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/certificateRequests',
    method: 'POST',
    headers: {
      'Content-Type': 'text',
      'Content-Length': data.length
    }
  };
  
  //request an ca aufbauen
  var req = http.request(caPostOptions,function(res){
    //antwort der ca 
    console.log("response ca: " + res.statusCode);
    
    //ca schickt daten, kann in mehreren blöcken geschehen(theoretisch)
    res.on('data', function(chunk){
      console.log("chunk: "+ chunk);
    });
    //fehler bei http-post
    req.on('error', function(e){
      console.log("error: " + e);
    });
  })
  //request schreiben und schicken
  req.write(data);
  req.end();
}

var server = app.listen(4400, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

