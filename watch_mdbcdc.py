import os
import pymongo
from bson.json_util import dumps

# Set the database credentials as an environmental variable on the compute engine VM instance
# Example: export MDBCONN="'mongodb+srv://<username>:<password>@<cluster_id>.mongodb.net/myFirstDatabase'"
client = pymongo.MongoClient(os.environ['MDBCONN'])

database = client['game']

playerOffers = database.get_collection("playerOffers")

# Capture change stream, filter on inserts only
change_stream = client.changstream.playerOffers.watch([{
    '$match': {
        'operationType': {'$in': ['insert']}
    }
}])

for change in change_stream:
    print(dumps(change))
    # For readability testing only // remove this line once running correctly
    print('')
