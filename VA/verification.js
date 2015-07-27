/**
 * INPUT VA(verify)
 *  + CAfile - Root File der CA um andere Certificates zu zertifizieren
 *  + CApath - Path zum DIR
 *
 *  OUTPUT VA(verify)
 *  + result of openssl verify : String
 */
var exec = require('child_process').exec;

// Ctor |--------------------------------------------------
/**
 *
 * @param CAfile - Root File der CA um andere Certificates zu zertifizieren
 * @param CApath - Path zum DIR
 *
 * @constructor
 */
function Verify(CAfile) {
    this.caFilePath = CAfile;
    this.childProcess;
}

// Functions |--------------------------------------------------
Verify.prototype.getCrlUrl = function(cert, mode, callback){
    var progCall = 'openssl x509 -in \"' + cert + '\" -noout -text';
    console.log(progCall);  //FIXME: DEBUG

    var url ="";
    this.childProcess = exec(progCall , function (error, stdout, stderr) {
        var lines = stdout.toString().split('\n');
        var endreached = false;

        for(var i = 0;i < lines.length;i++){
            switch (mode){
                case 0: // CRL
                    if(lines[i].search("Full Name:") != -1){
                        url = lines[++i].trim().replace("URI:", "");
                        endreached = true;
                    }
                    break;

                case 1: //FIXME: OCSP
                    if(lines[i].search("OCSP -") != -1){
                        cleanline = lines[i].split("OCSP -")[1];
                        url = cleanline.trim().replace("URI:", "");
                        endreached = true;
                    }
                    break;
            }

            // found entry
            if (endreached){
                break;
            }
        }

        if(stderr != ""){
            console.log("ERROR-getCrlUrl Mode: "+mode+" " + stderr);
        }

        console.log("found URL:" + url)
        callback(url);
    });
};

/**
 *  This function performs an verification of a certificate (*.pem) by using the openssl verify command
 *
 * @param cert - path to the Certificate in .pem format
 * @param callback - function which will be called after verification to send the results back to the client
 */
Verify.prototype.verify = function (cert, crlUrl, callback) {
    var progCall = 'openssl verify -crl_check -CRLfile \"'+ crlUrl +'\" -CAfile \"' + this.caFilePath + '\" \"' + cert + '\"';

    console.log(progCall);
    this.childProcess = exec(progCall , function (error, stdout, stderr) {
        var  jsonResult = {
            'status': 0,
            'content':""
        };

        if (error != null && error.code != 2) {
            // FIXME: Was soll passieren, wenn es kracht ?
            jsonResult.status = 404;
            jsonResult.content ="ERROR" +  error;

            callback(jsonResult);
            return;
        }

        var resultArray = stdout.toString().trim().split(":");
        var result = resultArray[resultArray.length - 1];

        if (result.length == 0){
            jsonResult.status = 404;
            // FIXME: only for debug
            jsonResult.content = "ERROR: " + stderr.toString();

            callback(jsonResult);

        }else {
            // FIXME: Welche infos sollen an den client gehen? Reicht der Status zB "OK"
            jsonResult.status = 200;
            jsonResult.content = result;
            console.log("Result: " + result );
            callback(jsonResult);
        }
    });
};


Verify.prototype.verifyOcsp = function(cert, ocspUrl, callback){
    //var progCall = 'openssl ocsp -issure \"' +this.caFilePath+ '\" -cert \"'+cert +'\" -text -url \"' +ocspUrl+ '\"';
    //TODO intermidiate cert better path!
    var progCall = 'openssl ocsp -CAfile \"' +this.caFilePath+ '\" -issuer \"./private/intermediate.cert.pem\" -cert \"'+cert +'\" -url \"' +ocspUrl+ '\"';

    this.childProcess = exec(progCall , function (error, stdout, stderr) {
        var  jsonResult = {
            'status': 0,
            'content':""
        };

        var errMsg = stderr.toString();
        if (!errMsg ) {
            jsonResult.status = 404;
            jsonResult.content = "ERROR: " + error;

            console.log("ERROR-verifyOcsp: " + errMsg);
        }

        var resultArray = stdout.toString().trim().split(".pem");
        var result = resultArray[resultArray.length - 1];
        result = result.substr(2,result.length -1)

        if (result.length == 0){
            jsonResult.status = 404;
            jsonResult.content ="ERROR: " +  errMsg;

            callback(jsonResult);

        }else {
            // FIXME: Welche infos sollen an den client gehen? Reicht der Status zB "OK"
            jsonResult.status = 200;
            //jsonResult.content = result;
            jsonResult.content = result;
            console.log("Result: " + result );
            callback(jsonResult);
        }
    });
};


module.exports = Verify;