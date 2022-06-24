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

from gcore import mongoapi, const, global_vars
from loc import _, l10n
from dataclass import *

from .utils import Util, setup as util_setup

import logger
import worker

current_dir = os.path.dirname(os.path.abspath(__file__))

# pylint: disable=no-member

@mock_ses
@mock_s3
class MissionWorkerTest(unittest.TestCase):

    # @mock_ses()
    def setUp(self):

        _log = logger.setupLogging('test_mission_worker.log')
        mongoapi.set_logger(_log)
        jobs.set_logger(_log)




        DB, CONF = mongoapi.setup('test')
        self.db = DB
        self.conf = CONF
        self.mission1 = None
        tasks_setup(CONF, DB, _log)
        util_setup(CONF, DB, _log)

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

        #Util = utils.Util(DB, CONF)

        # clean up db

        Util.clearDb()

        # create users
        orgadmin = Util.createTestUser("orgadmin", ["orgadmin"])
        user1 = Util.createTestUser("user1")
        user2 = Util.createTestUser("user2")

        self.orgadmin = orgadmin
        self.user1 = user1
        self.user2 = user2

        self.members = [user1, user2]

        org = Util.createTestOrg([orgadmin], [user1, user2])
        self.org = org

        utc = arrow.utcnow() #.datetime
        self.now = utc

        expect(self.db.missions.count()).to.be.eq(0)
        expect(self.db.users.count()).to.be.eq(4) # inc. tool


    def mission_path(self, mission):
        return '{}/../../temp/missionreport_{}_{}.xlsx'.format(current_dir, mission["_id"], arrow.now().format('YYYY-MM-DD'))

    def report_exists(self, mission):
        return os.path.isfile(self.mission_path(mission))

    def report_time(self, mission):
        return os.path.getmtime(self.mission_path(mission))

    def remove_report(self, mission):
        os.remove(self.mission_path(mission))

    def test_check_later_job_created(self):

        # create mission
        mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1)

        Job.create(const.JOB_MISSION_CHECK_PHASE_END, {
            'mission_id':mission1['_id'],
            'phase':1
        })

        expect(self.db.jobs.count()).to.be.eq(1)


        with CustomExplanation('mission report should not yet exists (1)'):
            expect(self.report_exists(mission1)).to.be.eq(False)

        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)

        expect(self.db.jobs.count()).to.be.eq(2)

        nb_jobs = self.db.jobs.count({
            'state':'new',
            'exec_at':{'$gt':arrow.utcnow().naive}
        })
        expect(nb_jobs).to.be.eq(1)

        new_job = self.db.jobs.find_one({
            'state':'new',
            'exec_at':{'$gt':arrow.utcnow().naive}
        })

        expect(math.floor(new_job['exec_at'].timestamp())).to.be.eq(math.floor(mission1['phase1']['end'].timestamp()))
        mission1 = self.db.missions.find_one({'_id':mission1['_id']})
        expect(mission1['phase1']['state']).to.be.eq('ready')


    @mock.patch('tasks.EmailSender.send_bulk_templated_email', mock.MagicMock(return_value='patched'))
    def test_check_phase1(self):


        # create mission
        mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1, ongoing=False)
        ideas = Util.makeRandomIdeas(mission1, [self.user1, self.user2],4,1)

        self.mission1 = mission1
        job_count = self.db.jobs.count()

        expect(job_count).to.be.eq(0)

        with CustomExplanation('mission report should not yet exists (2)'):
            expect(self.report_exists(mission1)).to.be.eq(False)

        with CustomExplanation('file db should be empty'):
            expect(self.db.files.count({})).to.be.eq(0)

        Job.create(const.JOB_MISSION_CHECK_PHASE_END, {
            'mission_id': mission1['_id'],
            'phase':1
        })


        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)

        with CustomExplanation('file should be created'):
            expect(self.db.files.count({})).to.be.eq(1)


        job_count = self.db.jobs.count()

        with CustomExplanation('job count post check, should be 1, is {}'.format(job_count)):
            expect(job_count).to.be.eq(1) # warn is done

        nb_new_jobs = self.db.jobs.count({
            'state':'new',
            'exec_at':{'$lt':arrow.utcnow().datetime}
        })


        # should send messages for end of mission. and emails. and report. and notif.
        # finishing the mission should generate a report
        with CustomExplanation("new job count post check, should be 0, is {}".format(nb_new_jobs)):
            expect(nb_new_jobs).to.be.eq(0)

        with CustomExplanation('mission report should now exist (2)'):
            expect(self.report_exists(mission1)).to.be.eq(True)

        filedate0 = self.report_time(mission1)

        mission1 = self.db.missions.find_one({'_id':mission1['_id']})
        expect(mission1['phase1']['state']).to.be.eq('finished')

        with CustomExplanation('mission report should exists (2)'):
            expect(self.report_exists(self.mission1)).to.be.eq(True)

        # now get mission report, should not be regenerated
        mongoapi.save_job(self.db, 'report.mission',
            {
            'mission_id': self.mission1['_id'],
            'phase':1
        })

        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)
        filedate1 = self.report_time(mission1)

        expect(filedate1).to.be.eq(filedate0)
        self.remove_report(mission1)

    @mock.patch('tasks.EmailSender.send_bulk_templated_email', mock.MagicMock(return_value='patched'))
    def test_check_phase2(self):
        #conn = boto3.client('ses', region_name=self.conf['zone'])
        #conn.verify_domain_dkim(Domain=self.conf['email-domain'])

        # create mission
        mission2 = Util.createTestMission(self.org, self.orgadmin, self.members, 2, False)

        # create ideas

        ideas = Util.makeRandomIdeas(mission2, [self.user1, self.user2],2,2)

        idea1 = ideas[0]
        idea2 = ideas[1]

        _start = arrow.get(mission2["phase2"]["start"])
        _end = arrow.get(mission2["phase2"]["start"])

        skew = 0
        votes = Util.makeRandomVotes(mission2, [self.orgadmin]+self.members, ideas, None, _start, _end)


        vote_count = self.db.votes.count()
        expect(vote_count).to.be.eq(6)

        job_count = self.db.jobs.count()

        with CustomExplanation('vote count should be 0, is {}'.format(job_count)):
            expect(job_count).to.be.eq(0)

        Job.create(const.JOB_MISSION_CHECK_PHASE_END, {
            'mission_id': mission2['_id'],
            'phase':2
        })

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        job_count = self.db.jobs.count({
            'state':'new',
            'exec_at':{'$lt':arrow.utcnow().datetime}
        })

        ## warning finish job is created
        with CustomExplanation('job could should be 0, is {}'.format(job_count)):
            expect(job_count).to.be.eq(0)

        mission2 = self.db.missions.find_one({'_id':mission2['_id']})

        expect(mission2['phase2']['state']).to.be.eq('finished')

        idea1 = self.db.ideas.find_one({'_id':idea1['_id']})
        idea2 = self.db.ideas.find_one({'_id':idea2['_id']})

        vote_count = self.db.votes.count()

        with CustomExplanation('vote count should be 0, is {}'.format(vote_count)):
            expect(vote_count).to.be.eq(0)

        expect("data" in idea1).to.be.true()

        expect(idea1['data']['phase2']).to.be.eq({
            'total':5,
            'nb':3,
            'avg':2.0 -1/3,
            'vote_2':2,
            'vote_1':1
        })

        expect("data" in idea2).to.be.true()

        expect(idea2['data']['phase2']).to.be.eq({
            'avg':0-1/3,
            'nb':3,
            'total':-1,
            'vote_0':2,
            'vote_-1':1
        })
        self.remove_report(mission2)

    @mock.patch('tasks.EmailSender.send_bulk_templated_email', mock.MagicMock(return_value='patched'))
    def test_check_phase3(self):

        #conn = boto3.client('ses', region_name=self.conf['zone'])
        #conn.verify_domain_dkim(Domain=self.conf['email-domain'])


        # create mission
        mission3 = Util.createTestMission(self.org, self.orgadmin, self.members, 3, False)

        ideas = Util.makeRandomIdeas(mission3, [self.user1, self.user2],2,3)

        idea1 = ideas[0]
        idea2 = ideas[1]

        # create ideas

        idea1['price'] = 2
        idea2['price'] = 1.2

        mongoapi.update_object(self.db, "idea", idea1)
        mongoapi.update_object(self.db, "idea", idea2)

        # create orders
        order1_1 = Util.makeTestOrder(mission3, idea1, self.user1,  10000,1)
        order2_1 = Util.makeTestOrder(mission3, idea1, self.user2,   2000,1.5)
        order2_2 = Util.makeTestOrder(mission3, idea2, self.user2,   7000,1.1)
        order3_1 = Util.makeTestOrder(mission3, idea1, self.orgadmin,5000,1.1)
        order3_2 = Util.makeTestOrder(mission3, idea2, self.orgadmin,5000,1.1)

        expect(self.db.orders.count()).to.be.eq(5)
        expect(self.db.jobs.count()).to.be.eq(0)

        mongoapi.save_job(self.db, 'mission.check_phase_end',
            {
            'mission_id': mission3['_id'],
            'phase':3
        })

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        mission3 = self.db.missions.find_one({'_id':mission3['_id']})


        idea1 = self.db.ideas.find_one({'_id':idea1['_id']})
        idea2 = self.db.ideas.find_one({'_id':idea2['_id']})

        expect("data" in idea1).to.be.true()

        expect(math.floor(100*idea1['data']['phase3']['popularity'])).to.be.eq(58)

        expect(idea1['data']['phase3']['total']).to.be.eq(17000)
        expect(idea1['data']['phase3']['nb_buyers']).to.be.eq(3)

        expect("data" in idea2).to.be.true()

        expect(math.floor(100*idea2['data']['phase3']['popularity'])).to.be.eq(41)
        expect(idea2['data']['phase3']['total']).to.be.eq(12000)
        expect(idea2['data']['phase3']['nb_buyers']).to.be.eq(2)

        expect(self.db.orders.count()).to.be.eq(0)
        expect(mission3['phase3']['state']).to.be.eq('finished')
        self.remove_report(mission3)

