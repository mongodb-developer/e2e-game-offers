# Set up for watching change streams on playerOffers collection.

import os
import re
import pymongo
import logging
import json
from bson import Binary, Code
from bson import ObjectId
from bson.json_util import dumps

# Set necessary MongoDB Atlas connection and environment variables
atlasconn = "mongodb+srv://{}@game-main.maftg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority&readConcernLevel=majority".format(
    os.environ['MDBGAMEUSER'])

client = pymongo.MongoClient(atlasconn)
db = client.beautest
collpo = db.playerOffers
collppol = db.playerPersonalizedOffersLog


# class JSONEncoder(json.JSONEncoder):
#     def default(self, o):
#         if isinstance(o, ObjectId):
#             return str(o)
#         return json.JSONEncoder.default(self, o)


# Open a watch on the database to capture change streams
# Added error correction handling with resume token if interrupt happens

try:

    # REMOVE THIS WHEN DONE TESTING
    # Print lines were for early testing. Leaving at the moment, but can be pulled before
    # full deployment
    # print(db)
    # print('')
    # print(collpo)
    # print('')
    # print(client)
    # print('')

    resume_token = None
    print('Resume token value at start is ', resume_token)
    pipeline = [{
        '$match': {
            '$and': [
                {'operationType': {'$in': ['update']}},
                {'fullDocument.isPurchase': {'$eq': True}}
            ]
        }
    }]

    # This does not work...when adding the 'project' pipe it appears the pymongo
    # library for change streams does not support. Only the $match works.
    # pipeline = [
    #     {
    #         '$match': {
    #             '$and': [
    #                 {
    #                     'operationType': {'$in': ['update']}
    #                 },
    #                 {
    #                     'fullDocument.isPurchased': {'$eq': True}
    #                 }
    #             ]
    #         }
    #     },
    #     {
    #         '$project': {
    #             'fullDocument._id': 1,
    #             'fullDocument.playerId': 0,
    #             'fullDocument.characterId': 0,
    #             'fullDocument.offerId': 0,
    #             'fullDocument.shards': 0,
    #             'fullDocument.price': 0,
    #             'fullDocument.predictionScore': 0,
    #             'fullDocument.predictionDt': 0,
    #             'fullDocument.isPurchased': 0,
    #             'fullDocument.purchaseDt': 0
    #         }
    #     }
    # ]

    # with collpo.watch(pipeline=pipeline, full_document='updateLookup') as stream:
    with collpo.watch(pipeline=pipeline, full_document='updateLookup') as stream:
        for insert_change in stream:
            # REMOVE THIS WHEN DONE TESTING
            # print('This should be a dict ', type(insert_change))
            # print('Resume token value at start of loop is: ', resume_token)

            print(insert_change)
            captured_stream = insert_change
            print('')

            # REMOVE THIS WHEN DONE TESTING - THIS JUST PRINTS THE DICT VALUE OF THE STREAM
            # print(captured_stream)
            # REMOVE THIS WHEN DONE TESTING - THIS JUST PRINTS K/V OF DICT
            # for key, value in captured_stream.items():
            #     print(key, value)
            # print('Value of fullDocument ID is ',
            #       captured_stream.get('documentKey'))

            resume_token = stream.resume_token
            print('Resume token value was updated after stream to: ', resume_token)

            # REMOVE THIS WHEN DONE TESTING
            # Print line below is for test purposes if suspicion that we aren't capturing
            # the resume token for error handling. This comment and print can be deleted
            # before full deployment
            # print(resume_token)

            # The 'documentKey' in the change stream for collection: playerOffers has the
            # MDB '_id' ObjectId that is needed for querying and matching the correct record
            # in collection: playerPersonalizedOffers under 'offers.0.insertedId'. However,
            # because the 'documentKey' value is the full '_id : ObjectId('xxxxxxxxxxx')'
            # format and we only want the actual ObjectId we need to do some regex before
            # piping the result into the playerPersonalizedOffers query.
            documentKey = captured_stream.get('documentKey')
            # print('The documentKey is: ', documentKey)
            # print('Type of documentKey is: ', type(documentKey))
            documentKeyObjId = documentKey.get('_id')
            # print('The documentKeyObjId is: ', documentKeyObjId)
            # print('the type of documentKeyObjId is: ', type(documentKeyObjId))

            # strDocumentKey = JSONEncoder().encode(documentKey)
            # strDocumentKey = dumps(documentKey)

            # print('Type strDocumentKey is: ', type(strDocumentKey))
            # print('Value of strDocumentKey is: ', strDocumentKey)
            # example output when converted to string: {"_id": {"$oid": "60b941225fdf17c3633a4c8e"}}
            # REGEX expression to match only ObjectID from the documentKey value
            # pattern = '(?<=\s)[^)]*'
            #pattern = "r'(?<=\s)[^{^}]*'"
            # documentKeyObjectId = re.search(r'(?<=\s)[^{^}]*', strDocumentKey)
            # print(documentKeyObjectId.string)

            # getDoc = collppol.find({documentKey})
            # print(getDoc)

            queryDoc = collppol.find({'offers.0.insertedId': documentKeyObjId})
            print(list(queryDoc))

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
        with collpo.watch(pipeline=pipeline, full_document='updateLookup', resume_after=resume_token) as stream:
            for insert_change in stream:
                print(insert_change)
