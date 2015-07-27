var express = require('express');
var bodyParser = require('body-parser');
var exec = require("child_process").exec
var child;
var child_process = require("child_process");
var fs = require('fs');

var app = express();

var OCSPprocess = undefined;
var restartOCSPserver = false;

app.enable('trust proxy');

app.use(bodyParser.text({})); 

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
	var ip = getIP(req);
    console.log("Sending help response to " + ip);
    res.writeHead(200, {"Content-type" : "text/plain"});
    res.end("To issue a certificate request: POST to /certificateRequests");
});

app.get('/crl', function (req, res) {
	var ip = getIP(req);   
	var crlContent;
	
	try
    {
        crlContent = fs.readFileSync("crl/intermediate.crl.pem");
    }
    catch(err)
    {
        handleError(res, "Error reading CRL " + err);
    }
	
	console.log("Sending CRL to " + ip);
    res.writeHead(200, {"Content-type" : "text/plain"});
    res.end(crlContent);
});

app.post('/revokeCert', function (req, res) {
	console.log("Certificate Revocation Received!");
    console.log(req.body);
	
	var AUTHORIZED_IPS = ["37.120.163.132", "::ffff:212.201.135.142"];
	var ip = getIP(req);
	 
	if(/*!ipIsLocalhost(ip)*/ AUTHORIZED_IPS.indexOf(ip) < 0)
	{
		handleError(res, "Certificate Revocation only allowed by " + AUTHORIZED_IPS + "! (IP was: " + ip + ")");
		return;
	}
	
	var certId = req.body;
	if(certId.length < 4)
	{
		handleError(res, "Invalid post body. Body must contain certID (This is usually a four digit number, such as 1013.)");
		return;
	}
	
	//revoke cert
	child = exec("openssl ca -config openssl.cnf -revoke newcerts/" + certId + ".pem -key dieme1234", function (error, stdout, stderr) {
		if (error !== null) {
            console.log("error while revoking cert");
            handleError(res, error);
        }
        else
        {
			//if revokation worked, recreate CRL
			child = exec("openssl ca -config openssl.cnf -gencrl -out crl/intermediate.crl.pem -key dieme1234", function (error, stdout, stderr) {
				if (error !== null) {
					console.log("error while recreating CRL");
					handleError(res, error);
				}
				else
				{
					//success, yaaaay! :)			
					res.writeHead(200, {"Content-type" : "text/plain"});
                    res.end("Certificate with ID " + certId + " successfully revoked.");
					
					console.log("certificate revoked! (re)starting OCSP...");
					
					//restart the OCSP process
					if(OCSPprocess !== undefined)
					{
						//kill running process first
						restartOCSPserver = true;
						//OCSPprocess.kill();
					}
					else
					{
						//startOCSPServer();
					}
				}
			});
		}
	});
});

function startOCSPServer()
{
	
	OCSPprocess = child_process.spawn("openssl" , ["ocsp", "-index", "index.txt", "-port", "127.0.0.1:8081",  "-rsigner", "../certs/ca.cert.pem", "-rkey", "../private/ca.key.pem", "-CA", "intermediate.cert.pem", "-text"], 
		{
			detached: true/*,
			stdio: [
			  'pipe', // pipe
			  'pipe', // pipe child's stdout to parent
			  'pipe' // pipe stderr, too.
			]*/
		}
	);
	
	OCSPprocess.on('error', function (err) {
		console.log('error while starting OCSP server: '+err);
	});
	
	//get the password into the OCSP... unfortunately there is no -key parameter this time, so we are using an even dirtier hack! :D	
	OCSPprocess.stderr.on('data', function (data) {
		var stdoutString = data.toString();
		
		console.log("wtf2: " + stdoutString);
		
		if(stdoutString.indexOf("pass phrase") >= 0)
		{
			//OCSPprocess.stdin.write('dieme1234\n');
			console.log("feeding server with pass phrase...");
		}
		
		}
	);

	//try to restart the ocsp server once it gets terminated
	OCSPprocess.on('close', function (code, signal) {
		console.log('OCSP server terminated due to receipt of signal '+signal);
		if(restartOCSPserver === true)
		{
			startOCSPServer();
			//this is to avoid an endless restarting loop
			restartOCSPserver = false;
		}	
	});
}

app.post('/certificateRequests', function (req, res) {
    console.log("Certificate Request Received!");
    console.log(req.body);
    
    var ip = getIP(req);
    var timestamp = new Date().getTime();
    var csrName = timestamp + "_" + ip + ".csr.pem";
	csrName = csrName.replace(/:/g, '_');
    
    try
    {
        //write the request to a tmp file
        console.log("writing tmp csr");
        fs.writeFileSync("csr/" + csrName, req.body);
    }
    catch(err)
    {
        handleError(res, "Error writing temporary CSR: " + err);
    }
    
    
    var certName = timestamp + "_" + ip + ".cert.pem";
	certName = certName.replace(/:/g, '_');
    
    //sign request using openssl
    console.log("signing tmp csr");
    child = exec("openssl ca -batch -config openssl.cnf -extensions server_cert -notext -md sha256 -in csr/"+csrName+" -out certs/"+certName+" -key dieme1234", function (error, stdout, stderr) {
        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);

        //this check needs to be run before error check
        if(stderr.indexOf("TXT_DB error number 2") >= 0)
        {
            handleError(res, "This certificate request was already signed. Generate a new request to fix this.");
        }
        else if (error !== null) {
            console.log("error while signing csr");
            handleError(res, error);
        }
        else
        {
            console.log("verifying cert against ca chain");
            //verify cert against ca chain
            child = exec("openssl verify -CAfile ca-chain.cert.pem certs/"+certName, function (error, stdout, stderr) {
                //console.log('stdout: ' + stdout);
                //console.log('stderr: ' + stderr);
                if (error !== null) 
                {
                    console.log("error while verifying cert against ca chain");
                    handleError(res, error);
                } 
                //check output of openssl verify, must be "<cert path>: OK"
                //else if(stdout !== "certs/"+certName + ": OK\n")
                else if(stdout.indexOf("certs/"+certName + ": OK") < 0)
                {
                    console.log("NOT OK: verifying cert against ca chain");
                    handleError(res, "Certificate validation against ca chain failed. (Verify output: "+stdout+")");
                } 
                else
                {
                    var certContent;
                    
                    try
                    {
                        console.log("reading written cert");
                        certContent = fs.readFileSync("certs/"+certName);
                    }
                    catch(err)
                    {
                        handleError(res, "Error reading generated certificate file: " + err);
                    }
    
                    //send cert back to client
                    console.log("sending cert");
                    res.writeHead(200, {"Content-type" : "text/plain"});
                    res.end(certContent);
                }
            });
        }
    });
});

app.listen(8080, function () {
  console.log('CA gestartet (Port: 8080)');
});

function handleError(res, err)
{
    if(err)
    {
        console.log("ERROR: " + err);
        res.writeHead(500, {"Content-type" : "text/plain"});
        res.end("ERROR: " + err);
    }
}

function getIP(req)
{
	var ip = req.ip;;
	return ip;
}

function ipIsLocalhost(ip)
{
	//::1 is ipv6 localhost.
	return (ip === "localhost" || ip === "127.0.0.1" || ip === "::1");
}