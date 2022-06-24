
import sys
import json
import time
import os
import arrow
import boto3

import logger

from gcore import mongoapi, users

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

def uploadFile(s3, filename, remote_name, bucket_name):
    s3.upload_file(filename, bucket_name, remote_name)

def upload(job, db, conf):
    source = job["payload"]["source"]
    target = job["payload"]["target"]
    bucket = job["payload"]["bucket"]
    uploadFile(s3, source, target, bucket)

    return True, {}



tasks = {
    's3.upload':upload
}
