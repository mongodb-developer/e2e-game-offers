//Inserting the Access Token in a realm secret named 'accesstoken' via the admin API
//Developped by Charles Van Parys
//the 28/06/2021

exports =async function(secretName, secretID, value, secretValue){
  var realmAccessToken = context.values.get("realmAccessTokenValue")
  console.log("Value of secret: "+ secretName + " was: "+ context.values.get(secretValue));
  var groupID= context.values.get("groupID");
  var appID = context.values.get("appID");
  var http = context.services.get("web");
  var request = {
  url: "https://realm.mongodb.com/api/admin/v3.0/groups/"+ groupID +"/apps/"+ appID +"/secrets/" + secretID,
  headers : {
      'Authorization': ['Bearer '+ realmAccessToken],
      'Content-Type': ['application/json']
  },
  body: {
    '_id': secretID,
    'name': secretName,
    'value': value,
  },
  encodeBodyAsJSON : true
  }
  return http.put(request).then(response=>{
    return response});

};