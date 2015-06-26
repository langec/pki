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
function Verify(CAfile,CACRL) {
    this.caFilePath = CAfile;
    this.caCRL = CACRL;
    this.childProcess;
}

// Functions |--------------------------------------------------
Verify.prototype.getCrlUrl = function(cert){
    var progCall = 'openssl x509 -in \"' + cert + '\" -noout -text';
    console.log(progCall);  //FIXME: DEBUG

    this.childProcess = exec(progCall , function (error, stdout, stderr) {
        var lines = stdout.toString().split('\n');
        var uri = ""
        for(var i = 0;i < lines.length;i++){
            if(lines[i].search("Full Name:") != -1){
                uri = lines[++i].trim().replace("URI:", "");
                break;
            }
        }
        return uri;
    });
};

/**
 *  This function performs an verification of a certificate (*.pem) by using the openssl verify command
 *
 * @param cert - path to the Certificate in .pem format
 * @param callback - function which will be called after verification to send the results back to the client
 */
Verify.prototype.verify = function (cert, crlpath, callback) {
    var progCall = 'openssl verify -crl_check -CRLfile \"'+ crlpath +'\" -CAfile \"' + this.caFilePath + '\" \"' + cert + '\"';

    console.log(progCall);
    this.childProcess = exec(progCall , function (error, stdout, stderr) {
        var  jsonResult = {
            'status': 0,
            'content':""
        };

        if (error != null) {
            // FIXME: Was soll passieren, wenn es kracht ?
            jsonResult.status = 404;
            jsonResult.content = error;

            callback(jsonResult);
            return;
        }

        var resultArray = stdout.toString().split("/");
        var result = resultArray[resultArray.length - 1];

        if (result.length == 0){
            jsonResult.status = 404;
            // FIXME: only for debug
            jsonResult.content = stderr.toString();

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

module.exports = Verify;