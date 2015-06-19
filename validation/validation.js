var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var mongojs = require('mongojs');
var db = mongojs('registration',['requests']);
var http = require('http');



app.get('/', function (req, res) {
  //offene requests holen
   db.requests.find({status:'new' },function(err, docs) {
    // docs is an array of all the documents in mycollection
    var data = docs;
    res.send(data);
  });
  
});

app.post('/approve', function (req, res) {
  //registration request löschen oder auf abgelehnt/angenommen setzen
  var csrRequest;
  db.requests.findAndModify({
      query: { _id: mongojs.ObjectId(req.body.id) },
      update: { $set: { status:'approved' } },
      new: true
  }, function(err, doc, lastErrorObject) {
      csrRequest = doc;
      console.log(doc.cn);
      //cert req erstellen
      var exec = require('child_process').exec;
      //openssl req -new -config etc/server.conf -out certs/simple.org.csr -keyout certs/simple.org.key
      var child = exec("openssl req -new -config etc/server.conf -out csrs/"+csrRequest.cn+".csr -keyout pkeys/"+csrRequest.cn+".key -subj /C="+csrRequest.c+"/ST=\""+csrRequest.st+"\"/L=\""+csrRequest.l+"\"/O=\""+csrRequest.o+"\"/OU=\""+csrRequest.ou+"\"/CN=\""+csrRequest.cn+"\"",
        function (error, stdout, stderr) {
          console.log("exec done");
          if(error){
            console.log("error" + error);
            console.log(stderr);
          }
          
          console.log("reading csr file: " + "./csrs/"+csrRequest.cn+".csr")
          fs.readFile("./csrs/"+csrRequest.cn+".csr",'utf-8',function(err,data){
            console.log(err);
            if(!err){
              console.log("postToCa");
              postToCa(data);
            }else{
              console.log(err);
            }
          });
      });
      
      //db.requests.save(req.body.request);
      res.send("request approved");
  });
});


app.post('/reject', function (req, res) {
  //registration request löschen oder auf abgelehnt/angenommen setzen
  db.requests.findAndModify({
      query: { _id: mongojs.ObjectId(req.body.id) },
      update: { $set: { status:'rejected' } },
      new: true
  }, function(err, doc, lastErrorObject) {
      // doc.tag === 'maintainer'
  });
  //cert req erstellen
  
  
  //db.requests.save(req.body.request);
  res.send("request rejected");
});

function postToCa(data){
  console.log("posting csr to ca");
  var caPostOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/certificateRequests',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length
    }
  };
  console.log(data);
  var req = http.request(caPostOptions,function(res){
    console.log("response ca: " + res.statusCode);
    res.on('data', function(chunk){
      console.log("chunk: "+ chunk);
    });
    req.on('error', function(e){
      console.log("error: " + e);
    });
  })
  req.write(data);
  req.end();
}

var server = app.listen(4400, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

