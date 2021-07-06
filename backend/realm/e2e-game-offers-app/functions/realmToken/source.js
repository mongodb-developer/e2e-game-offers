//Function getting an access token for the realm admin API and calling the valueToSecret function to set it in a secret
//Improvements possible: you should be able to test the token and use the refresher token
//Developped by Charles Van Parys
//On the 5/07/2021

exports =async function(){
  var realmAccessToken = context.values.get("realmAccessTokenValue")
  var groupID= context.values.get("groupID");
  var appID = context.values.get("appID");
  var http = context.services.get("web");
  var realmAPIkeys = context.values.get("realmAPIkeys");
  realmAPIkeys = JSON.parse(realmAPIkeys);
  var publicKey = realmAPIkeys.publicKey;
  var privateKey = realmAPIkeys.privateKey;
  var secretName= 'realmAccessToken';
  var secretId = '60e3258b1e3bf6a998588ca0';
  var valueSecret = 'realmAccessTokenValue';
  var realmToken = await getToken(http, publicKey, privateKey);
  var doc = realmToken.body.text();
  doc = JSON.parse(doc);
  console.log(JSON.stringify(doc))
  var tokenToSecret = await context.functions.execute('valueToSecret', secretName,  secretId, doc.access_token ,  valueSecret);
  console.log(tokenToSecret);
  return tokenToSecret;
}

async function getToken(web, publicKey, privateKey){
  var request = {
  url: "https://realm.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login",
  headers : {
      'Content-Type': ['application/json']
  },
  body: {
    username: publicKey,
    apiKey: privateKey,
  },
  encodeBodyAsJSON : true
  }
  return web.put(request).then(response=>{
    return response});
}