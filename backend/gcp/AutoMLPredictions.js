/**
 * Demonstrates using the AutoML client to request prediction from node.js
 * Authors:
 *    Charles Van Parys
 *    Sig Narvaez
 * 
 * Related links:
 * Format of payload for types:
 *    https://github.com/googleapis/nodejs-automl/issues/436
 *    https://stackoverflow.com/questions/66153580/invalid-argument-cannot-parse-protovalue-kind-unknown-as-string 
 */

process.env.GOOGLE_APPLICATION_CREDENTIALS = './E2E-GCP-Cred.json'

'use strict';

async function main(
  projectId =     'e2e-game-offers',
  computeRegion = 'us-central1',
  modelId =       'TBL6662871139531882496') {

  const automl = require('@google-cloud/automl');

  // Create client for prediction service.
  const automlClient = new automl.v1beta1.PredictionServiceClient();

  // Get the full path of the model.
  const modelFullId = automlClient.modelPath(projectId, computeRegion, modelId);

  async function predict() {

    // Set the payload by giving the row values.
    const payload = {
      "row": {
        "values": [
          {"numberValue":111},
          {"numberValue":12},
          {"numberValue":727},
          {"numberValue":1481},
          {"numberValue":14},
          {"numberValue":55},
          {"numberValue":7},
          {"numberValue":12},
          {"boolValue": false},
          {"stringValue":"C"},
          {"numberValue":6},
          {"numberValue":3},
          {"numberValue":101534},
          {"numberValue":3}
        ],
        "columnSpecIds": [
          "3802386636512165888",  // totalEquipsLast7D      Source: playerActivityForPersonalizedOffers
          "1496543627298471936",  // characterId (1 - 12)   Source: playerActivityForPersonalizedOffers
          "920082874995048448",   // shards                 Source: playerActivityForPersonalizedOffers
          "631852498843336704",   // totalPlayTimeLast7D    Source: playerActivityForPersonalizedOffers
          "3225925884208742400",  // abilities              Source: playerRoster[roser.charactedId = characterId]
          "2937695508057030656",  // TotalEquipShardsLast7D Source: playerActivityForPersonalizedOffers
          "5243538517270724608",  // gear_tier              Source: playerRoster[roser.charactedId = characterId]
          "5819999269574148096",  // level                  Source: playerRoster[roser.charactedId = characterId]
          "8125842278787842048",  // nextRankIsRedStar      Source: playerActivityForPersonalizedOffers 
          "5531768893422436352",  // Character Grade A-C    Source: playerRoster[roser.charactedId = characterId]. "A" (1,5 & 9) "B" (2,6, & 10) "C" (3,7 & 11) "D" (4,8 & 12) 
          "7261151150332706816",  // Red Stars              Source: playerRoster[roser.charactedId = characterId]
          "1208313251146760192",  // Stars                  Source: playerRoster[roser.charactedId = characterId]
          "8414072654939553792",  // historicalSpend        Source: playerActivityForPersonalizedOffers
          "6108229645725859840"   // weekDayOfPurchase      Source: Weekday of Date.now() when calling model
        ]
      }
    }
    
    console.log(payload);
    
    // Params is additional domain-specific parameters.
    // Currently there is no additional parameters supported.
    const [response] = await automlClient.predict({
      name: modelFullId
      ,payload: payload
      //,params: {feature_importance: true} // uncomment if full evaluation specs are desired
    });
    console.log('Prediction results:' + JSON.stringify(response));

    for (const result of response.payload) {
      console.log(`Predicted class name: ${result.displayName}`);
      console.log(`Predicted class score: ${result.tables.score}`);

      // Get features of top importance
      const featureList = result.tables.tablesModelColumnInfo.map(
        columnInfo => {
          return {
            importance: columnInfo.featureImportance,
            displayName: columnInfo.columnDisplayName,
          };
        }
      );
      // Sort features by their importance, highest importance first
      featureList.sort((a, b) => {
        return b.importance - a.importance;
      });

      // Print top 10 important features
      console.log('Features of top importance');
      console.log(featureList.slice(0, 10));
    }
  }

  predict();
}

main(...process.argv.slice(2)).catch(err => {
  console.error("Error 1",err.message);
  process.exitCode = 1;
});

process.on('unhandledRejection', err => {
  console.error("Error 2", err.message);
  process.exitCode = 1;
});