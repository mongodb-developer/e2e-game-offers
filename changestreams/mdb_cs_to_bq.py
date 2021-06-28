# Set up for watching change streams on playerOffers collection.

import os
import sys
import re
import pymongo
import logging
import datetime
import json
# from bson import Binary, Code
from bson import ObjectId
from bson import json_util
from bson.json_util import dumps
from google.cloud import bigquery
from google.cloud.exceptions import NotFound

# Create MongoDB Atlas client object and necessary environment configuration
atlasconn = "mongodb+srv://{}@game-main.maftg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority&readConcernLevel=majority".format(
    os.environ['MDBGAMEUSER'])
client = pymongo.MongoClient(atlasconn)
db = client.beautest
collpo = db.playerOffers
collppol = db.playerPersonalizedOffersLog


# Create Google Cloud Big Query client object and necessary environment configuration
bqclient = bigquery.Client()
table_id = "e2e-game-offers.trainingDatasets.withoutPurchased_4clusters"

# Open a watch on the database to capture change streams and then process change
# and stream to GCP BigQuery
# Added error correction handling with resume token if interrupt happens
try:

    # Set initial resume_token to none and set pipeline to watch on 'update'
    # and filter with isPurchase field value set to 'true'
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

    # Create loop to watch for change streams
    # with collpo.watch(pipeline=pipeline, full_document='updateLookup') as stream:
    with collpo.watch(pipeline=pipeline, full_document='updateLookup') as stream:
        for insert_change in stream:

            # Can remove this print stream to console later if so desired
            print(insert_change)
            captured_stream = insert_change
            print('')

            # Grab resume_token id in case later logic is needed to refire stream
            resume_token = stream.resume_token
            print('Resume token value was updated after stream to: ', resume_token)

            # The 'documentKey' in the change stream for collection 'playerOffers' has the
            # MDB '_id' ObjectId that is needed for querying and matching the correct record
            # in collection 'playerPersonalizedOffers' under 'offers.0.insertedId'.
            # Need to pull the 'documentKey' and 'fullDocument' elements from the change stream
            # and load their values into a dict

            documentKeyId = captured_stream.get('documentKey')
            fullDocumentKey = captured_stream.get('fullDocument')

            # Grab just the ObjectId value from the key '_id'
            documentKeyObjId = documentKeyId.get('_id')

            # Grab just the offerId value fro the key 'offerId'
            playerOfferId = fullDocumentKey.get('offerId')

            # find_one will return a dictionary...easier to work with as if you do
            # a list it loads the entire cursor value back as a single index
            # I'm sure there is a more efficient way to do this but I'm not a developer
            # by trade, so there's that...
            print('Change stream trigger matched...running query for stateAtInference...')
            query = collppol.find_one(
                {'offers.0.insertedId': documentKeyObjId})

            print('Transforming data to ready for BiqQuery...')
            # Pull all values from the 'stateAtInference' key and then assign
            # individual values to feed to BigQuery
            bqdata = query.get('stateAtInference')
            characterId = bqdata.get('characterId')
            shardsToNextRank = bqdata.get('shardsToNextRank')
            totalEquipShardsLast7D = bqdata.get('totalEquipShardsLast7D')
            totalEquipsLast7D = bqdata.get('totalEquipsLast7D')
            totalPlayTimeLast7D = bqdata.get('totalPlayTimeLast7D')
            weekDayOfPurchase = bqdata.get('weekDayOfPurchase')
            grade = bqdata.get('characterGrade')
            level = bqdata.get('level')
            gear_tier = bqdata.get('gearTier')
            shards = bqdata.get('shards')
            stars = bqdata.get('stars')
            redstars = bqdata.get('redStars')
            abilities = bqdata.get('abilities')
            offerId = playerOfferId

            # Need to make adjustements to some value types...
            # BigQuey will error on float type...convert 'historicalSpend' to integer
            historicalSpend = int(bqdata.get('historicalSpend'))

            # BiqQuery will error on boolean type 'True/Flase'...need to convert to integer
            # for boolean type 1 or 0
            nextRankIsRedStar = bqdata.get('nextRankIsRedStar')
            if nextRankIsRedStar == True:
                nextRankIsRedStar = 1
            else:
                nextRankIsRedStar = 0

            # Set environmentals for streaming to BigQuery
            project = bqclient.project
            dataset_id = '{}.trainingDatasets'.format(project)
            table_id = '{}.withoutPurchased_4clusters'.format(dataset_id)

            # If errors start occurring make sure dataset can be found
            # Uncomment below if need to test dataset exists
            # try:
            #     bqclient.get_dataset(dataset_id)
            #     print('Dataset {} does exist...'.format(dataset_id))
            # except NotFound:
            #     print('Dataset {} is not found.'.format(dataset_id))

            # If dataset exists but you are still getting errors check
            # available tables that are under the dataset by uncommenting below
            # tables = bqclient.list_tables(dataset_id)
            # print("Tables contained in '{}':".format(dataset_id))
            # for table in tables:
            #     print('{}.{}.{}'.format(table.project,
            #           table.dataset_id, table.table_id))

            # Stream to BigQuery table
            print('Sending to BiqQuery...')

            rows_to_insert = [
                {u"characterId": characterId, u"historicalSpend": historicalSpend, u"nextRankIsRedStar": nextRankIsRedStar, u"shardsToNextRank": shardsToNextRank, u"totalEquipShardsLast7D": totalEquipShardsLast7D, u"totalEquipsLast7D": totalEquipsLast7D,
                    u"totalPlayTimeLast7D": totalPlayTimeLast7D, u"weekDayOfPurchase": weekDayOfPurchase, u"grade": grade, u"level": level, u"gear_tier": gear_tier, u"shards": shards, u"stars": stars, u"redstars": redstars, u"abilities": abilities, u"offerId": offerId}
            ]

            # Capture any errors
            bqerrors = bqclient.insert_rows_json(table_id, rows_to_insert)
            if bqerrors == []:
                print("New rows have been added to table")
            else:
                print("Error while inserting rows: {}".format(bqerrors))

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
