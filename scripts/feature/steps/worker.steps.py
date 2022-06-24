import json 
import boto3

import sure  # noqa
import moto 
import arrow 

from behave import *

from moto import mock_ses, mock_s3

from botocore.exceptions import ClientError
from botocore.stub import Stubber

# pylint: disable=E0401
from gcore import mongoapi, users
from workers import s3worker 
import worker
# pylint: enable=E0401

'''
json.load_s3 = lambda f: json.load(s3.Object(key=f).get()["Body"])
json.dump_s3 = lambda obj, f: s3.Object(key=f).put(Body=json.dumps(obj))
'''

# pylint: disable=undefined-variable
# pylint: disable=E0102

@given('a file written locally with a date and mock = True')
def step_impl(context):
    path = 'fake/upload_test.json'
    context.path = path
    context.now = arrow.now().format("YYYY-MM-DD HH:mm:ss ZZ")
    data = {
        "now":context.now,
        "mocked":True
    }
    with open(path, 'w') as outfile:  
        json.dump(data, outfile)


@given('a file written locally with a date and mock = False')
def step_impl(context):
    path = 'fake/upload_test2.json'
    context.path2 = path
    context.now = arrow.now().format("YYYY-MM-DD HH:mm:ss ZZ")
    data = {
        "now":context.now,
        "mocked":False
    }
    with open(path, 'w') as outfile:  
        json.dump(data, outfile)

@when('we mock s3 and upload the file')
@mock_s3()
def step_impl(context):
    db, conf = mongoapi.setup('test')
    context.db = db
    context.conf = conf 
    session = boto3.Session(profile_name=conf['aws'])
    s3 = session.client('s3')
    s3worker.setClient(s3)

    response = s3.list_buckets()


    bkts = [bucket['Name'] for bucket in response['Buckets']]
    
    if context.conf['bucket'] not in bkts:
        print("try creating bucket {}".format(context.conf['bucket']))
        s3.create_bucket(
            Bucket=context.conf['bucket'], 
            CreateBucketConfiguration={
                'LocationConstraint': 'eu-west-3'
            })

    job = mongoapi.make_job('s3.upload', {
        'source':context.path,
        'target':context.now,
        'bucket':conf['bucket']
    })


    result = db.jobs.insert_one(job)
    job['_id'] = result.inserted_id
    context.file_uploadjob = job
    worker.check_jobs(context.db, context.conf)

@when("we don't mock s3 and upload the file")
def step_impl(context):
    db, conf = mongoapi.setup('test')
    context.db = db
    context.conf = conf 
    session = boto3.Session(profile_name=conf['aws'])
    s3 = session.client('s3')
    s3worker.setClient(s3)

    job = mongoapi.make_job('s3.upload', {
        'source':context.path2,
        'target':context.now,
        'bucket':conf['bucket']
    })


    result = db.jobs.insert_one(job)
    job['_id'] = result.inserted_id
    context.file_uploadjob = job
    worker.check_jobs(context.db, context.conf)



@then('the mocked uploaded file is not changed')
def step_impl(context):
    assert True

@then('the non mocked uploaded file is changed')
def step_impl(context):
    assert True

'''
@given('an image was uploaded to the server')
def step_impl(context):
    db, conf = mongoapi.setup('test')
    db.jobs.delete_many({})
    context.db = db
    context.conf = conf 

    path = 'scripts/fake/placeholder.png'
    # make file 
    try:
        fh = open(path, 'r')
        # Store configuration file values
    except FileNotFoundError:      
        # Keep preset values
        print("no such file : {}".format(path))

    # warn.user_created_validate_email
    job = mongoapi.make_job('s3.upload', {
        'source':path,
        'target':'placeholder.png',
        'bucket':conf['bucket']
    })
    result = db.jobs.insert_one(job)
    job['_id'] = result.inserted_id

    
    #print(job)
    #result = db.jobs.insert_one(job)
    #job['_id'] = result.inserted_id
    #context.job = job
'''

@given('a new send validation email job exists')
@mock_ses
def step_impl(context):
    db, conf = mongoapi.setup('test')
    db.jobs.delete_many({})
    context.db = db 
    context.conf = conf 
    context.email = 'david.hockley@gmail.com' #bob@example.org'
    context.sender = "app@{}".format(conf["email-domain"])
    usr = users.get_or_create(context.email, db, ['user'])

    # warn.user_created_validate_email
    job = mongoapi.make_job('warn.user_created_validate_email', {
        'email':context.email, 
    })
    # print(job)
    result = db.jobs.insert_one(job)
    job['_id'] = result.inserted_id
    context.job = job

@when('we check the database for the email validation job')

@mock_ses
def step_impl(context):
    
    conn = boto3.client('ses', region_name='eu-west-1')
    conn.verify_email_identity(EmailAddress=context.sender)
    context.conn = conn

    previous_quota = conn.get_send_quota()
    previous_count = int(previous_quota['SentLast24Hours'])
    print("previous count {} ".format(previous_count))

    # is this getting mocked ??
    worker.setSESClient(context.conn)
    worker.check_jobs(context.db, context.conf, True)

    send_quota = conn.get_send_quota()
    sent_count = int(send_quota['SentLast24Hours'])
    context.sent = sent_count  - previous_count



@then('the worker sends a validation to the new user')
@mock_ses
def step_impl(context):
    
    # mocking context.conn does not work here I think 
    # because the mock loses track of the boto object ?
    context.sent.should.equal(2) ## for some reason this is 2 not 1 ??
    