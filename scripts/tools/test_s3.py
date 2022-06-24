
import sys
import json
import time
import os
import arrow
import boto3

import logger

from gcore import mongoapi, users
from workers import s3worker

bucket_name = "com.dh.test"

'''
json.load_s3 = lambda f: json.load(s3.Object(key=f).get()["Body"])
json.dump_s3 = lambda obj, f: s3.Object(key=f).put(Body=json.dumps(obj))
'''

# Create an S3 client
s3 = None

def setClient(_cli):
    global s3
    s3 = _cli

def createClient(profile = 'default'):
    global s3
    if s3 is None:
        session = boto3.Session(profile_name=profile)
        s3 = session.client('s3')

def uploadFile(s3, local, remote, bucket_name):

    with open(local) as f:
        data = json.load(f)
    print(data)
    print(bucket_name)
    s3.upload_file(local, bucket_name, remote)


if __name__ == '__main__':

    logfile  = 'test.log'
    logger = logger.setupLogging(logfile)
    #set_logger(logger)
    
    mongoapi.set_logger(logger)

    args =  sys.argv

    if len(args) < 3:
        email = "david.hockley@gmail.com"
        env = "test"
    else:
        email = args[1]
        env = args[2]
    
    DB, CONF = mongoapi.setup(env)

    createClient(CONF['aws'])

    # Call S3 to list current buckets
    response = s3.list_buckets()
    #print(response)

    bkts = [bucket['Name'] for bucket in response['Buckets']]
    
    if CONF['bucket'] not in bkts:
        print("try creating bucket {}".format(CONF['bucket']))
        s3.create_bucket(
            Bucket=CONF['bucket'], 
            CreateBucketConfiguration={
                'LocationConstraint': 'eu-west-3'
            })

    uploadFile(s3, 'fake/upload_test2.json', 'direct-file',  CONF['bucket'])




