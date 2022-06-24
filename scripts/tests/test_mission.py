import math
import unittest
import arrow
import time 
import boto3 
import os 
from robber import expect
from robber import CustomExplanation

from moto import mock_ses, mock_s3

# because send templated email is not implemented so moto is not enough 
import mock 

from workers import jobs

from tasks import EmailSender, setup as tasks_setup

from dataclass import User, Mission 

from gcore import mongoapi, const, global_vars
from loc import _
from loc import l10n

from .utils import Util, setup as util_setup

import logger
import worker

current_dir = os.path.dirname(os.path.abspath(__file__))

# pylint: disable=no-member

@mock_ses
@mock_s3
class MissionTest(unittest.TestCase):

    def setUp(self):

        _log = logger.setupLogging('test_mission_worker.log')
        mongoapi.set_logger(_log)
        jobs.set_logger(_log)

        DB, CONF = mongoapi.setup('test')
        util_setup(CONF, DB, _log)
        tasks_setup(CONF, DB, _log)

        self.db = DB
        self.conf = CONF
        self.mission1 = None

        s3 = boto3.client('s3')
        response = s3.list_buckets()

        # Get a list of all bucket names from the response
        buckets = [bucket['Name'] for bucket in response['Buckets']]

        new_bucket = self.conf["files"]["report"]["s3"]
        if new_bucket not in buckets:
            s3.create_bucket(Bucket=new_bucket)

        global_vars.setup(DB, CONF, 'test', _log)

        conn = boto3.client('ses', region_name=CONF['zone'])
        conn.verify_domain_dkim(Domain=CONF['email-domain'])
        conn.verify_email_identity(EmailAddress="app@test.org")
        conn.verify_email_identity(EmailAddress="orgadmin@test.org")

        EmailSender.client = conn
        EmailSender.logger = _log

        

        # clean up db 
        Util.clearDb()

        # create users
        orgadmin = Util.createTestUser("orgadmin", ["orgadmin"])
        user1 = Util.createTestUser("user1") 
        user2 = Util.createTestUser("user2")  

        self.orgadmin = User(orgadmin) 
        self.user1 = User(user1)
        self.user2 = User(user2)

        self.members = [user1, user2]

        org = Util.createTestOrg([orgadmin], [user1, user2])
        self.org = org

        utc = arrow.utcnow() #.datetime
        self.now = utc 

        expect(self.db.missions.count()).to.be.eq(0)
        expect(self.db.users.count()).to.be.eq(4) # inc. tool

    def test_missionlocked(self):

        # create mission
        mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1)

        mongoapi.save_job(self.db, const.JOB_MISSION_LOCKED, 
            { 'mission_id':mission1['_id'], 'from':str(self.orgadmin._id), 'from_name':self.orgadmin.anoname })


        # jobs = self.db.jobs.find()
        #for job in jobs:
        #    print(job)

        expect(self.db.jobs.count()).to.be.eq(1)

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        #expect(self.db.jobs.count()).to.be.eq(1)

    def test_mission_in_progress(self):

        # create mission

        mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1, True)

        mongoapi.save_job(self.db, const.JOB_MISSION_IN_PROGRESS, 
            { 'mission_id':mission1['_id'], 'from':self.orgadmin._id, 'from_name':self.orgadmin.anoname })


        jobs = self.db.jobs.find()
        #for job in jobs:
        #    print(job)

        expect(self.db.jobs.count()).to.be.eq(1)

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        #expect(self.db.jobs.count()).to.be.eq(1)
