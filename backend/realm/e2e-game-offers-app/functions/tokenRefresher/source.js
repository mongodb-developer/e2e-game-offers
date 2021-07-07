exports = async function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://docs.mongodb.com/realm/triggers/overview/

    Functions run by Triggers are run as System users and have full access to Services, Functions, and MongoDB Data.

    Access a mongodb service:
    const collection = context.services.get(<SERVICE_NAME>).db("<DB_NAME>").collection("<COLL_NAME>");
    const doc = collection.findOne({ name: "mongodb" });

    Note: In Atlas Triggers, the service name is defaulted to the cluster name.

    Call other named functions if they are defined in your application:
    const result = context.functions.execute("function_name", arg1, arg2);

    Access the default http client and execute a GET request:
    const response = context.http.get({ url: <URL> })

    Learn more about http client here: https://docs.mongodb.com/realm/functions/context/#context-http
  */
  const http = context.services.get("web");
  const collection = context.services.get("mongodb-atlas").db("secret").collection("token");
  const currentAccessTokenDoc = await collection.findOne();
  //console.log(JSON.stringify(currentAccessTokenDoc));
  const currentAccessToken= currentAccessTokenDoc.accessToken.accessToken;
  const logLastValidToken = collection.updateOne({},{"$set":{"lastValidToken": currentAccessToken}});
  return http.post({
      url: "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/automl-appaccount@e2e-game-offers.iam.gserviceaccount.com:generateAccessToken",
      body: {
        "scope":["https://www.googleapis.com/auth/cloud-platform"]
      },
      headers: {
        "Content-Type": ["application/json"],
        "Authorization": ["Bearer " + currentAccessToken]
      },
      encodeBodyAsJSON: true
    })
    .then(response => {
      console.log("New Access Token: " + response.body.text());
      const newAccessToken = JSON.parse(response.body.text());
      const insertNewToken = collection.updateOne({},{"$set":{"accessToken":newAccessToken}});
      return newAccessToken.accessToken;
    });
};
