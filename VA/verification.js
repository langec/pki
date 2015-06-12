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
function Verify(CAfile, CApath) {
    this.directoryPath = CApath;
    this.caFilePath = CAfile;
    this.childProcess;
}

// Functions |--------------------------------------------------
/**
 *  This function performs an verification of a certificate (*.pem) by using the openssl verify command
 *
 * @param cert - path to the Certificate in .pem format
 * @param callback - function which will be called after verification to send the results back to the client
 */
Verify.prototype.verify = function (cert, callback) {
    console.log('Verify: openssl verify -verbose -CAfile' + cert + ' -CApath ' + this.directoryPath);

    this.childProcess = exec('openssl verify -CAfile ' + this.caFilePath + ' -verbose -CApath ' + this.directoryPath + ' ' + cert, function (error, stdout, stderr) {
        if (error != null) {
            // FIXME: Was soll passieren, wenn es kracht ?
            callback('exec error: ' + error);
        }

        var resultArray = stdout.toString().split("/");
        var result = resultArray[resultArray.length - 1]

        // FIXME: Welche infos sollen an den client gehen? Reicht der Status zB "OK"
        callback(result);
    });
};

module.exports = Verify;