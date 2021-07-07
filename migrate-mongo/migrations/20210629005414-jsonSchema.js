module.exports = {
  async up(db, client) {

    await db.createCollection("playerProfile", {
      validator: {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["playerId"],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "playerId": {
              "bsonType": "string"
            },
            "avatarId": {
              "bsonType": "int",
              "minimum": 1,
              "maximum": 16
            },
            "deviceBenchmark": {
              "bsonType": "object",
              "properties": {
                "accelerometer": {
                  "bsonType": "bool"
                },
                "deviceModel": {
                  "bsonType": "string"
                },
                "graphicsMemorySize": {
                  "bsonType": "int"
                },
                "processorCount": {
                  "bsonType": "int"
                },
                "sparseTextures": {
                  "bsonType": "bool"
                },
                "supports3DTextures": {
                  "bsonType": "bool"
                },
                "supportsLocationService": {
                  "bsonType": "bool"
                },
                "supportsShadows": {
                  "bsonType": "bool"
                },
                "supportsVibration": {
                  "bsonType": "bool"
                },
                "systemMemorySize": {
                  "bsonType": "int"
                }
              }
            },
            "geo": {
              "bsonType": "string"
            },
            "globalGameCounters": {
              "bsonType": "object",
              "properties": {
                "energy": {
                  "bsonType": "int"
                },
                "gold": {
                  "bsonType": "int"
                }
              }
            },
            "lastLoginDt": {
              "bsonType": "date"
            },
            "locale": {
              "bsonType": "string"
            },
            "signUpDt": {
              "bsonType": "date"
            },
            "stats": {
              "bsonType": "object",
              "properties": {
                "charactersUnlocked": {
                  "bsonType": "int"
                },
                "mvpWins": {
                  "bsonType": "int"
                },
                "playerLevel": {
                  "bsonType": "int"
                },
                "totalCollectionPower": {
                  "bsonType": "int"
                },
                "totalGameTimeDays": {
                  "bsonType": "int"
                },
                "totalMoneySpent": {
                  "bsonType": "double"
                }
              }
            }
          }
        }
      }
    
    
    
    
    });

    await db.createCollection("playerRoster", {
      validator: {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["playerId"],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "playerId": {
              "bsonType": "string"
            },
            "roster": {
              "bsonType": "array",
              "minItems": 1,
              "maxItems": 16,
              "items": {
                "bsonType": "object",
                "properties": {
                  "abilities": {
                    "bsonType": "int"
                  },
                  "characterId": {
                    "bsonType": "int"
                  },
                  "gearTier": {
                    "bsonType": "int"
                  },
                  "level": {
                    "bsonType": "int"
                  },
                  "redStars": {
                    "bsonType": "int"
                  },
                  "shards": {
                    "bsonType": "int"
                  },
                  "stars": {
                    "bsonType": "int"
                  }
                }
              }
            },
            "lastUpdateDt": {
              "bsonType": "date"
            }
          }
        }
      }
    });

    await db.createCollection("playerOffers", {
      validator: {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["playerId","characterId"],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "characterId": {
              "bsonType": "int"
            },
            "isPurchased": {
              "bsonType": "bool"
            },
            "offerId": {
              "bsonType": "int"
            },
            "playerId": {
              "bsonType": "string"
            },
            "predictionDt": {
              "bsonType": "date"
            },
            "predictionScore": {
              "bsonType": "double"
            },
            "price": {
              "bsonType": "double"
            },
            "purchaseDt": {
              "bsonType": "date"
            },
            "shards": {
              "bsonType": "int"
            }
          }
        }
      }
    });

    await db.createCollection("playerActivityLast7Days", {
      validator: {
        "$jsonSchema": {
          "bsonType": "object",
          "required": ["playerId","characterId"],
          "properties": {
            "_id": {
              "bsonType": "objectId"
            },
            "activityDt": {
              "bsonType": "date"
            },
            "amount": {
              "bsonType": "int"
            },
            "characterId": {
              "bsonType": "int"
            },
            "equipmentType": {
              "bsonType": "string"
            },
            "playerId": {
              "bsonType": "string"
            }
          }
        }
      }
    });

  },

  async down(db, client) {

    await db.playerProfile.drop();

    await db.playerRoster.drop();

    await db.playerOffers.drop();
    
    await db.playerActivityLast7Days.drop();

  }
};
