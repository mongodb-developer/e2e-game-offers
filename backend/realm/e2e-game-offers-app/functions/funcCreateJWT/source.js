//JWT creation for a gcp access-token for the service account using the cred.json in a value
//developped by Charles Van Parys
//last_modified: 24/06/2021



exports = function() {
    var date = Math.floor(Date.now() / 1000);
    var credentials = JSON.parse(context.values.get('gcp-credentials'));
    var privateKey = credentials.private_key;
    var iss = credentials.client_email;

    var header = {
        "alg": "RS256",
        "typ": "JWT"
    }
    var claim = {
        "aud": "https://www.googleapis.com/oauth2/v4/token",
        "iss": iss,
        "scope": "https://www.googleapis.com/auth/cloud-platform",
    }
    claim.iat = date;
    claim.exp = date + (60 * 60)

    var request_body = base64(JSON.stringify(header)) + "." + base64(JSON.stringify(claim));
    
    const sign = require("crypto").createSign('SHA256');
    sign.update(request_body);
    const signature = sign.sign(privateKey, 'base64');
    
    return (request_body + '.' + signature);
};

function base64(string) {
    var text = BSON.Binary.fromText(string)
    var base64 = text.toBase64()
    return base64;
}