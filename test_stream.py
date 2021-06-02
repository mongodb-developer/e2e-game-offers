# Change stream quick test

import os
import pymongo

client = pymongo.MongoClient(os.environ['MDBCONN2'])
print(client.changestream.playerOffers.insert_one(
    {"quick": "test"}).inserted_id)
