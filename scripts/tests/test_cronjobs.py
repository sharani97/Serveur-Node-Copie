

import logger
import bcrypt
import arrow
import mock 
import unittest
import time
import worker

from robber import expect

from gcore import mongoapi, users, global_vars, const 
from dataclass import User, Mission, Org, Idea, Reward, Comment, Job
from payloadclass import MidWeekJobPayload

from .utils import Util, setup as util_setup
# pylint: disable=no-member
class CronJobsTest(unittest.TestCase):

    def setUp(self):
        env = 'test'
        _log = logger.setupLogging('test_mongo.log')
        mongoapi.set_logger(_log)
        DB, CONF = mongoapi.setup(env)
        self.db = DB
        self.conf = CONF
        util_setup(CONF, DB, _log)
        Util.clearDb()

        global_vars.setup(DB, CONF, env, _log)

        # create users
        orgadmin:User = Util.createTestUser("orgadmin", ["orgadmin"])
        user1:dict = Util.createTestUser("user1") 
        user2:dict = Util.createTestUser("user2")

        self._user1 = User(user1)
        self._user2 = User(user2)
        long_time_no_see = arrow.now().shift(weeks=-3).format(const.DB_DATE_FMT)
        self._user1.update_fields({
            'last_connexion':long_time_no_see, 
            'validated':True
        })
        self._user2.update_fields({
            'last_connexion':long_time_no_see, 
            'validated':True
        })

        print(User.get(self._user1._id).data)

        self.orgadmin = orgadmin 
        self.user1 = user1
        self.user2 = user2

        self.members = [user1, user2]
        
        org = Util.createTestOrg([orgadmin], [user1, user2])
        self.org = org

        utc = arrow.utcnow() #.datetime
        self.now = utc 

        expect(self.db.missions.count()).to.be.eq(0)
        expect(self.db.users.count()).to.be.eq(4) # inc. t

        self.mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1,ongoing=True)
        
        self.idea1 = Util.makeIdea(self.mission1, self.user1, None, 1,1)


    @mock.patch('tasks.EmailSender.send_bulk_templated_email', mock.MagicMock(return_value='patched'))
    def test_mid_week_warn(self):
        self.comment = Comment.create(self._user2._id, self.idea1['_id'], "idea", "This is a comment")

        job = Job.create(const.JOB_CRON_MIDWEEK_INVITES, {})

        time.sleep(.100)
        start_time = time.time()
        worker.check_jobs(self.db, self.conf)

        end_time = time.time()
        time_diff = end_time - start_time
 
        job2 = Job.create(const.JOB_CRON_COME_AND_POST, {})
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        job3 = Job.create(const.JOB_CRON_WEEKLY_NOTFS, {
            'phases':[1]
        })
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        self.mission2 = Util.createTestMission(self.org, self.orgadmin, self.members,2,ongoing=True)
        self.idea2 = Util.makeRandomIdeas(self.mission2, [self.orgadmin], 10, 2)

        job4 = Job.create(const.JOB_CRON_WEEKLY_NOTFS, {
            'phases':[2]
        })
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)

        self.mission3 = Util.createTestMission(self.org, self.orgadmin, self.members,3,ongoing=True)
        self.idea3 = Util.makeRandomIdeas(self.mission2, [self.orgadmin], 10, 2)

        job4 = Job.create(const.JOB_CRON_WEEKLY_NOTFS, {
            'phases':[3]
        })
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)





