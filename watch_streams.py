# Set up for watching change streams on playerOffers collection.

import os
import pymongo
import logging
from bson.json_util import dumps

# Set necessary MongoDB Atlas connection and environment variables
atlasconn = "mongodb+srv://{}@game-main.maftg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority&readConcernLevel=majority".format(
    os.environ['MDBGAMEUSER'])

client = pymongo.MongoClient(atlasconn)
db = client.beautest
collection = db.playerOffers


# Open a watch on the database to capture change streams
# Added error correction handling with resume token if interrupt happens

try:

    # Print lines were for early testing. Leaving at the moment, but can be pulled before
    # full deployment

    # print(db)
    # print('')
    # print(collection)
    # print('')
    # print(client)
    # print('')

    resume_token = None
    pipeline = []

    with collection.watch(pipeline=pipeline, full_document='updateLookup') as stream:
        for insert_change in stream:
            print(insert_change)
            resume_token = stream.resume_token
            # Print line below is for test purposes if suspicion that we aren't capturing
            # the resume token for error handling. This comment and print can be deleted
            # before full deployment
            # print(resume_token)

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
        with collection.watch(pipeline=pipeline, full_document='updateLookup', resume_after=resume_token) as stream:
            for insert_change in stream:
                print(insert_change)
