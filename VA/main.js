/**
 * TODO: https connection
 * TODO: real response(ok, bad, unknown)
 * TODO: get CA Certificate
 * TODO: OCSP?
 */

//###############################################################################################################REQUIRE
var express = require('express');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy'); //middleware for form/file upload
var fs = require('fs-extra');       //File System - for file manipulation
var Random = require('random-js');
var crypto = require('crypto');
var Verify = require("./verification");
//var cron = require('cron');

//##################################################################################################################VARS
var certPathPrefix = __dirname + '/private/certs/';
<<<<<<< HEAD
var CAFile = "../CA/intermediate/certs/ca-chain.cert.pem";   //__dirname + "/private/ca-chain.cert.pem";
var CRLfile = __dirname + "/private/"; //TODO look for the CRL file
//var CAPath = "../CA2/openssltest/ca/intermediate";
=======
var CAFile = "../CA2/openssltest/ca/intermediate/certs/ca-chain.cert.pem"   //__dirname + "/private/ca-chain.cert.pem";
>>>>>>> 1151a5bb0ec2b191f3cce0403655328790b93546

var PORT = 6600;
var IP = "localhost";

//var cronJob = cron.job("*/10 * * * * *", updateJob); //debug mode all 5 seks
//var cronJob = cron.job("* */30 * * * *", updateJob); //realMode all 30mins

var app = express();
//app.use(bodyParser());
app.use(busboy());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//##############################################################################################################FUNCTIONS
//ERROR FUNCTION
function handleError(res, err) {
    sendResponse(res, 500, err);
}

function sendResponse(res, status, content) {
    if (status == null || status === undefined) status = 520; //Unknown Error
    if (status == null || status === undefined) content = "";

    console.log("Response(" + status + "): " + content);
    res.writeHead(status, {"Content-type": "text/plain"});
    res.end(content);
}

//Create unique file path
function createFilePath() {
    //gett Date
    var d = new Date();
    //get Randoom Number
    var rnd = new Random(Random.engines.mt19937().autoSeed());
    var n = rnd.integer(1, 1000000);
    //create hash
    var hash = crypto.createHash('sha1').update(d + n).digest('hex');

    return certPathPrefix + hash + ".pem";
}

//Save Files
function saveFile(path, file, cbClose, cbErr) {
    var fstream = fs.createWriteStream(path);
    file.pipe(fstream);
    fstream
        .on('close', function () {
            cbClose();
        })
        .on('error', function (e) {
            cbErr(e);
        });
}

//Write File
function writeFile(path, content, cb, cbErr) {
    //console.log("path: " + path + "\ncontent: " + content);
    fs.writeFile(path, content, function (err) {
        if (err) {
            cbErr(err);
        } else {
            cb();
        }
    });
}

/*//Old
function updateJob(){
    console.log("Updated!");
}//*/

//################################################################################################################ROUTES
app.get('/', function (req, res, next) {
    console.log("Sending help response.");
    res.writeHead(200, {"Content-type": "text/plain"});
    res.end("To issue a verification request: Send a POST Request with the Certificate to /verify (as File) or /verifyraw (as Raw Text)");
});

//VERIFY FILE
app.post('/verify', function (req, res, next) {
    console.log("/VERIFY");
    //console.log(req.body);

    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {

        certPath = createFilePath();
        //console.log("Save cert under: " + certPath)

        saveFile(certPath, file,
            function () {
                //Success
                console.log("Cert saved!");

                var v = new Verify(CAFile, CRLfile);
                v.verify(certPath, function (result) {
                    fs.unlink(certPath, function (err) {
                        if (err) {
                            next(err);

                        } else {
                            console.log('Cert successfully deleted.');

                            console.log("result: " + result);
                            //res.end(result);
                            sendResponse(res, result.status, result.content);
                        }
                    });
                })
                //FIXME without unlink only!
                //res.end("thx for the fish!");
                //sendResponse(200, "Thx for the File!");
            },
            function (err) {
                //Error
                next(err);
            })
    });

});

//VERIFY RAW STRING
var bodyParserText = bodyParser.text({});
app.post('/verifyraw', bodyParserText, function (req, res, next) {
    console.log("/VERIFY-RAW");
    console.log(req.body);

    certPath = createFilePath();
    console.log("Write cert to: " + certPath);

    writeFile(certPath, req.body,
        function () {
            console.log("Cert written and saved!");

            var v = new Verify(CAFile, CRLfile);
            v.verify(certPath, function (result) {
                fs.unlink(certPath, function (err) {
                    if (err) {
                        next(err);

                    } else {
                        console.log('Cert successfully deleted.');

                        console.log("result: " + result);
                        //res.end(result);
                        sendResponse(res, result.status, result.content);
                    }
                });
            })
            //FIXME without unlink only!
            //res.end("thx for the fish!");
            //sendResponse(200, "Thx for the Text!");
        },
        function (err) {
            next(err);
        })
});

app.use(function (err, req, res, next) {
    handleError(res, err);
});


//##########################################################################################################SERVER-START
app.listen(PORT, IP);
console.log("\nVA-Server running on " + IP + ":" + PORT);
