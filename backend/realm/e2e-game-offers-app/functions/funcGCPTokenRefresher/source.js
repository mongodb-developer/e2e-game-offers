//Request for an accesstoken using a JWT
//Developped by Charles Van Parys
//the 28/06/2021

exports = async function() {
    const http = context.services.get("web");
    const JWT = context.functions.execute('funcCreateJWT');
    const secretName = 'gcp-svc-acct-access-token-SECRET';
    const secretId = '60b826959dca3689de4b3b8a';
    const secretValue = 'gcp-svc-acct-access-token';

    let request = {
        scheme: 'https',
        host: 'www.googleapis.com',
        path: '/oauth2/v4/token',
        query: {
            'grant_type': ['urn:ietf:params:oauth:grant-type:jwt-bearer'],
            'assertion': [JWT]
        },
        headers: {
            'Authorization': ['Bearer ' + JWT],
            'Content-Type': ['application/x-www-form-urlencoded']
        }
    };
    
    var call = await http.post(request)
        .then(response => {
            return response.body.text();
        });
    call = JSON.parse(call);
    console.log(call.access_token);
    
    var value = call.access_token;
    var setSecret = context.functions.execute("funcSetRealmSecret", secretName, secretId, value, secretValue);
    
    return setSecret;
};