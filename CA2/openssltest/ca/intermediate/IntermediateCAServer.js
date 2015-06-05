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
        res.writeHead(500, {"Content-type" : "text/plain"});
        //res.header("Content-type", "text/plain");
        res.end(err);
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
    res.writeHead(200, {"Content-type" : "text/plain"});
    res.end("To issue a certificate request: POST to /certificateRequests");
});

app.post('/certificateRequests', function (req, res) {
    console.log("Certificate Request Received!");
    console.log(req.body);
    
    var timestamp = new Date().getTime();
    var csrName = timestamp + ".csr.pem";
    
    //write the request to a tmp file
    console.log("writing tmp csr");
    fs.writeFileSync("csr/" + csrName, req.body);
    
    var certName = timestamp + ".cert.pem";
    
    //sign request using openssl
    console.log("signing tmp csr");
    child = exec("openssl ca -batch -config openssl.cnf -extensions server_cert -notext -md sha256 -in csr/"+csrName+" -out certs/"+certName+" -key dieme1234", function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if(stderr.indexOf("TXT_DB error number 2") >= 0)
        {
            handleError(res, "This certificate request was already signed.");
        }
        else if (error !== null) {
            console.log("error while signing csr");
            handleError(res, error);
        }
        else
        {
            console.log("verifying cert against ca chain");
            //verify cert against ca chain
            child = exec("openssl verify -CAfile certs/ca-chain.cert.pem certs/"+certName, function (error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) 
                {
                    console.log("error while verifying cert against ca chain");
                    handleError(res, error);
                } 
                else if(stdout !== "certs/"+certName + ": OK\n")
                {
                    console.log("NOT OK: verifying cert against ca chain");
                    handleError(res, "Certificate validation against ca chain failed. (Was: "+stdout+")");
                } 
                else
                {
                    //send cert back to client
                    console.log("reading written cert");
                    var certContent = fs.readFileSync("certs/"+certName);
                    
                    res.header("Status Code", "200");
                    res.header("Content-type", "text/plain");
                    console.log("sending cert");
                    res.end(certContent);
                }
            });
        }
    });
});

app.set('json spaces', 1);
app.listen(8080);