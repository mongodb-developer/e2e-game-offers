# Set up for watching change streams on playerOffers collection.

import os
import pymongo
import logging
from bson.json_util import dumps

atlasconn = "mongodb+srv://{}@game-main.maftg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority".format(
    os.environ['MDBGAMEUSER'])

client = pymongo.MongoClient(atlasconn)
db = client.gcptest
collection = db.playerOffers

try:
    print(db)
    print(collection)
    print(client)
    resume_token = None
    pipeline = []
    with db.collection.watch(pipeline) as stream:
        for insert_change in stream:
            print(insert_change)
            resume_token = stream.resume_token

except pymongo.errors.PyMongoError:
    # For ChangeStream encountering an unrecoverable error or the
    # resume attempt failed to recreate the cursor
    if resume_token is None:
        # There is no usable resume token because there was a failure
        # during ChangeStream initialization
        logging.error('Resume token null.')
    else:
        # If no error, use the interrupted ChangeStream resume token to create
        # a new ChangeStream. New stream will continue from the last seen insert
        # change operation without missing any events
        with db.collection.watch(pipeline, resume_after=resume_token) as stream:
            for insert_change in stream:
                print(insert_change)

# for change in change_stream:
#     print(dumps(change))
#     print('')
