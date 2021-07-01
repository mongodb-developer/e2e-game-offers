# MongoDB Change Streams to GCP BigQuery

## What This Does

This python script is responsible for the MongoDB change stream capture and data transformation to stream required
data into BigQuery. The data will be used in BigQuery for machine learning as part of the End-to-End Demo of GameOffers.

### How To Run

* SSH into the GCP Compute Instance
* Ensure you have python3 and pip3 installed
* Ensure you install python modules: pymongo, dnspython, google-cloud-bigquery
* If not already on the instance, upload the "mdb_cs_to_bq.py" file
* Set the MDBGAMEUSER environment variable on the instance (export MDBGAMEUSER=\<user:userpassword\>)
* RUN THE SCRIPT: python3 mdb_cs_to_bq.py
* When the demo is completed terminate the python script
