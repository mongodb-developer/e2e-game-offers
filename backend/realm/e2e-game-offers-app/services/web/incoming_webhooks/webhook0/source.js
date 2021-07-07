// This function requires a valid/active gcp service account access token.
// Authenticate this way: gcloud auth activate-service-account automl-appaccount@e2e-game-offers.iam.gserviceaccount.com --key-file=./E2E-GCP-CRED.json --project=e2e-game-offers
// Update the token in the secret named "gcp-svc-acct-access-token-SECRET"

// TEST PAYLOAD
const testPayload = {"payload":{"row":{"values":["111","12","727","1481","14","55","7","12","false","C","6","3","101534","3"],"columnSpecIds":["3802386636512165888","1496543627298471936","920082874995048448","631852498843336704","3225925884208742400","2937695508057030656","5243538517270724608","5819999269574148096","8125842278787842048","5531768893422436352","7261151150332706816","1208313251146760192","8414072654939553792","6108229645725859840"]}}};

exports = function(payload) {
  
  if (payload == null) payload = testPayload;
  console.log("PAYLOAD: " + JSON.stringify(payload));
  
  const accessToken = context.values.get("gcp-svc-acct-access-token"); 
  console.log(accessToken);
  
  const http = context.services.get("web");
  return http.post({
      url: "https://automl.googleapis.com/v1beta1/projects/e2e-game-offers/locations/us-central1/models/TBL6662871139531882496:predict",
      body: payload,
      headers: {
        "Content-Type": ["application/json"],
        "Authorization": ["Bearer " + accessToken]
      },
      encodeBodyAsJSON: true
    })
    .then(response => {
      return JSON.parse(response.body.text());
    })
};