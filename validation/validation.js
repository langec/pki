var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var mongojs = require('mongojs');
var db = mongojs('registration',['requests']);
var http = require('http');
var csrCfgFile = fs.readFileSync('./etc/server.conf');
csrCfgFile += "subjectAltName          = @alt_names\n\n[alt_names]\n";
var exec = require('child_process').exec;

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'pki.fhbielefeld@gmail.com',
        pass: '123geheim'
    }
});

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

//post requests von view/validation-ng
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
      
      // .csr erstellen
      createCSR(csrRequest, res);        
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

//cert req erstellen per kommandozeile und openssl
function createCSR(csrRequest, res){
  
  var configfileToUse = "etc/server.conf";
  
  //san feld aufbauen
  var san;
  if(csrRequest.sans.length != 0){
    console.log('request has san(s)');
    san = '';
    for (var i = 0; i < csrRequest.sans.length; i++) {
      console.log(csrRequest.sans[i]);
        san += csrRequest.sans[i].sanType + " = " + csrRequest.sans[i].san + "\n";
    }
    console.log("setting san:\n" + san + "\n\n");
    fs.writeFileSync('./etc/san.conf', csrCfgFile + san);
    configfileToUse = "etc/san.conf";
  }
  
  //subj feld aufbauen
  var subj="/C="+csrRequest.c+"/ST=\""+csrRequest.st+"\"/L=\""+csrRequest.l+"\"/O=\""+csrRequest.o+"\"/OU=\""+csrRequest.ou+"\"/CN=\""+csrRequest.cn+"\"/emailAddress=\""+csrRequest.emailAddress+"\"/";
  
  //command zusammensetzen
  var command = "openssl req -new -config " + configfileToUse + " -out csrs/"+csrRequest.cn+".csr -keyout pkeys/"+csrRequest.cn+".key -subj "+subj;
  console.log(command);
  
  var child = exec(command, function (error, stdout, stderr) {
      console.log("exec done");
      //kommandozeilenausgabe überprüfen
      if(error){
        console.log("error" + error);
        console.log(stderr);
        res.send("request not approved, check serverlog");
      }else{
        console.log("reading csr file: " + "./csrs/"+csrRequest.cn+".csr");
      
        //csr lesen und an ca schicken
        fs.readFile("./csrs/"+csrRequest.cn+".csr",'utf-8',function(err,data){
          if(!err){
            console.log("postToCa");
            //an ca schicken
            postToCa(csrRequest,data);
          }else{
            console.log(err);
          }
        });
        res.send("request approved");
      }
  //ende exec callback
  });
}

//schickt csr an ca
function postToCa(request,data){
  console.log("posting csr to ca:");
  console.log(data);
  //http-post header / optionen
  var caPostOptions = {
    hostname: 'h2418540.stratoserver.net',//localhost
    // hostname: 'localhost',//localhost
    port: 8080,
    path: '/certificateRequests',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length
    }
  };
  
  //request an ca aufbauen
  var req = http.request(caPostOptions,function(res){
    //antwort der ca 
    console.log("response ca: " + res.statusCode);
    var caResponse = '';
    //ca schickt daten, kann in mehreren blöcken geschehen(theoretisch)
    var data;
    res.on('data', function(chunk){
      console.log("chunk: "+ chunk);
      caResponse += chunk;
      //mail(request,chunk);
      //verifyCert(chunk.toString());
    });
    
    //fehler bei http-post
    res.on('error', function(e){
      console.log("error: " + e);
      return false;
    });
    
    res.on('end', function () {
      console.log('end');
      mail(request,caResponse);
      //verifyCert(data.toString());
    });
    
  })
  //request schreiben und schicken
  req.write(data);
  req.end();
  return true;
}

function mail(request, certificate){
  
  var mailOptions = {
    from: 'PKI <pki.fhbielefeld@gmail.com>', // sender address
    to: request.emailAddress, // list of receivers
    subject: 'Zertifikat ' + request.cn, // Subject line
    text: 'Hallo, Key eigentlich per Brief/Post', // plaintext body
    html: '<b>Hallo, Key eigentlich per Brief/Post</b>', // html body
    attachments: [
        {   // utf-8 string as an attachment
            filename: request.cn + '.crt',
            content: certificate
        },
        {
            filename: request.cn + '.key',
            content: fs.readFileSync("./pkeys/"+request.cn+".key")
        }]
  };
  
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          console.log(error);
      }else{
          console.log('Message sent: ' + info.response);
      }
  });
}

function verifyCert(data){
  console.log("verifying cert");
  var vaPostOptions = {
    hostname: 'localhost',
    port: 6600,
    path: '/verifyraw',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length
    }
  };
  console.log("asda");
  console.log(data);
  console.log("asda");
  var req = http.request(vaPostOptions,function(res){
    var data;
    console.log("response va: " + res.statusCode);
    res.on('data', function(chunk){
      console.log("chunk: "+ chunk);
      data+=chunk;
    });
    req.on('error', function(e){
      console.log("error: " + e);
    });
    req.on('end', function () {
      console.log('BODY: ' + data);
      
    });
  })
  console.log(data);
  req.write(data);
  req.end();
}

var server = app.listen(4400, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

