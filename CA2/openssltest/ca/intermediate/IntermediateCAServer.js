var express = require('express');
var bodyParser = require('body-parser');
var exec = require("child_process").exec, child;
var fs = require('fs');

var app = express();

function handleError(res, err)
{
    if(err)
    {
        console.log(err);
        res.header("Status Code", "500");
        res.header("Content-type", "text/plain");
        res.send(err);
    }
}

app.use(bodyParser.text({     // to support URL-encoded bodies
})); 

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    console.log("Sending help response.");
    res.header("Content-type", "text/plain");
    res.send("To issue a certificate request: POST to /certificateRequests");
});

app.post('/certificateRequests', function (req, res) {
    console.log("Certificate Request Received!");
    console.log(req.body);
    
    var timestamp = new Date().getTime();
    var csrName = timestamp + ".csr.pem";
    
    //write the request to a tmp file
    fs.writeFileSync("csr/" + csrName, req.body);
    
    var certName = timestamp + ".cert.pem";
    
    //sign request using openssl
    child = exec("openssl ca -batch -config openssl.cnf -extensions server_cert -notext -md sha256 -in csr/"+csrName+" -out certs/"+certName+" -key dieme1234", function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            handleError(res, error);
        }
        else
        {
            //verify cert against ca chain
            child = exec("openssl verify -CAfile /certs/ca-chain.cert.pem certs/"+certName, function (error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) 
                {
                    handleError(res, error);
                } 
                else if(stdout != "OK")
                {
                    handleError(res, "Certificate validation against ca chain failed. (Was: "+stdout+")");
                } 
                else
                {
                    //send cert back to client
                    var certContent = fs.readFileSync("certs/"+certName);
                    
                    res.header("Status Code", "200");
                    res.header("Content-type", "text/plain");
                    res.send(certContent);
                }
            });
        }
    });
});

app.set('json spaces', 1);
app.listen(8080);