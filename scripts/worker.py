#! /usr/bin/env python3.5

import sys
import json
import time
import os
import arrow
import cgitb

# from pymongo import MongoClient
# from bson.objectid import ObjectId
from croniter import croniter
from copy import deepcopy

from tasks import setup as tasks_setup
from tasks import EmailSender, S3Sender

from gcore import mongoapi, global_vars
from workers import jobs, emails
import logger
import cleanup
from setup_ses_templates import checkAWSTemplates

from datetime import datetime

ignore_jobs = []

DB = None

args = sys.argv

ARG_NB = 1

WORKER_ID = "0"

if 'pm_id' in os.environ:
    WORKER_ID = os.environ['pm_id']
else:
    if len(args) > 1:
        WORKER_ID = args[1]
        ARG_NB = 2

logfile = 'jobs{}.log'.format(WORKER_ID)
logger = logger.setupLogging(logfile)
logger.info("Start of worker {}".format(WORKER_ID))

jobs.set_logger(logger)
cleanup.set_logger(logger)
mongoapi.set_logger(logger)


def setSESClient(_client):
    emails.setSESClient(_client)


def set_job_state(_job, state, db):
    if '_id' not in _job:
        return
    db.jobs.update_one({'_id': _job['_id']}, {
                       "$set": {'state': state}}, upsert=False)


def update_job(_job, db):
    if '_id' not in _job:
        return
    db.jobs.update_one({'_id': _job['_id']}, {"$set": _job}, upsert=False)


def cancel(_job, reason, db):
    _job['state'] = 'error'
    _job['payload']['error'] = reason
    update_job(_job, db)


def accept(_job, db):
    set_job_state(_job, 'accepted', db)


def complete(_job, db):
    _job["state"] = "done"
    update_job(_job, db)


def create_job(_job, db):
    result = db.jobs.insert_one(_job)
    _job['_id'] = result.inserted_id
    return _job


timer = 0
jobdict = {}
bad_jobs = []


def job_error(job):

    print("ERROR on job ! ")
    print(sys.exc_info())
    bad_jobs.append(job["_id"])
    EmailSender.send_email(["david.hockley@gmail.com"],
                           'Error on Idea Heroes {}'.format(global_vars.env),
                           "Error found in Python Worker",
                           cgitb.html(sys.exc_info())
                           )


def doJob(data, db, conf):

    if '_id' in data and data['_id'] in ignore_jobs:
        return False

    if '_id' in data and data['_id'] in bad_jobs:
        return False

    # logger.info(data)
    # 1. get user
    # logger.info('getting user')

    task = data["task"]

    # logger.info("doing task {}".format(task))

    if task in jobs.JOBDICT:

        # 1. accept job
        logger.info("accept job : {}".format(task))
        accept(data, db)

        try:
            _done, new_job = jobs.JOBDICT[task](data, db, conf)
            if new_job:
                create_job(new_job, db)

            if _done:
                complete(data, db)
                return True
            else:
                set_job_state(data, 'new', db)

        except mongoapi.JobException as exception:
            logger.info('{} failed : {}'.format(task, exception.message))
            cancel(exception.job, exception.message, db)
            return True
    else:
        if '_id' in data:
            ignore_jobs.append(data['_id'])
        logger.info('{} : not implemented in this worker'.format(task))
        return False

# start process


# manage cron type jobs
def setup_cron(ENV, DB, CONF):
    global timer
    global jobdict
    now = arrow.utcnow()
    timer = now.timestamp

    dt_now = now.datetime

    with open('scripts/cron/{}_joblist.json'.format(ENV), 'r') as json_file:
        jobdict = json.load(json_file)

    CURSOR = DB.jobs.find({
        'state': 'cron',
    })

    # find all those that have jobs
    for job in CURSOR:
        jobdict[job["id"]]["job"] = job

    # setup those that do not
    for job_id in jobdict:
        job_data = jobdict[job_id]
        if "job" not in job_data:

            # create job
            payload = {}

            if "payload" in job_data:
                payload = job_data["payload"]

            logger.info("Creating cron task {}".format(job_data["task"]))

            _job = {
                "id": job_id,
                "state": "cron",
                "task": jobdict[job_id]["task"],
                "payload": payload,
                "exec_at": dt_now,
                "creator": mongoapi.tool_user['_id']
            }
            create_job(_job, DB)


def check_cron(DB, CONF):
    global timer
    now = arrow.utcnow()
    elapsed = now.timestamp - timer
    if elapsed < 300:
        return

    timer = now.timestamp

    dt_now = now.datetime

    CURSOR = DB.jobs.find({
        'state': 'cron',
        'exec_at': {'$lt': dt_now}
    })

    for job in CURSOR:

        job_id = job["id"]
        job_data = jobdict[job_id]

        _new = deepcopy(job)
        _new.pop('_id', None)

        try:
            if doJob(_new, DB, CONF):
                # move job to later in time
                _iter = croniter(job_data["cron"], dt_now)
                _next = _iter.get_next(datetime)
                job['exec_at'] = _next
                logger.info("Rescheduling task {} to {}".format(
                    job["task"], _next))
                # save job
                update_job(job, DB)
        except:
            if global_vars.env == "test":
                raise
            else:
                job_error(job)


def check_jobs(DB, CONF, debug=False):

    # get jobs
    CURSOR = DB.jobs.find({
        'state': 'new',
        'exec_at': {'$lt': arrow.utcnow().datetime}
    })

    COUNT = 0

    for job in CURSOR:

        ok = False
        try:
            ok = doJob(job, DB, CONF)
        except:
            if global_vars.env == 'test':
                raise
            else:
                job_error(job)

        if ok:
            COUNT = COUNT + 1

    if COUNT == 0:
        time.sleep(5)


if __name__ == '__main__':

    logger.info('starting up worker')
    ENV = None
    if 'NODE_ENV' in os.environ:
        ENV = os.environ['NODE_ENV']
    else:
        ENV = args[ARG_NB]
        ARG_NB = ARG_NB + 1

    LOOP_COUNT = -1

    if len(args) > ARG_NB:
        LOOP_COUNT = int(args[ARG_NB])

    DB, CONF = mongoapi.setup(ENV)
    tasks_setup(CONF, DB, logger)

    global_vars.setup(DB, CONF, ENV, logger)

    S3Sender.setup()

    cleanup.go(DB, CONF)
    setup_cron(ENV, DB, CONF)
    # get job list
    checkAWSTemplates(DB, CONF, ENV)

    LOOP = -1

    while True:

        check_cron(DB, CONF)
        check_jobs(DB, CONF)

        LOOP = LOOP + 1
        if LOOP == LOOP_COUNT:
            break

        # main()
