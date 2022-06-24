from gcore import mongoapi, users, global_vars

import logger
import bcrypt

from dataclass import *

import unittest
from robber import expect
from dataclass import Reward
from .utils import Util, setup as util_setup
# pylint: disable=no-member


class DataclassTest(unittest.TestCase):

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
        expect(self.db.users.count()).to.be.eq(1)

    def test_user_get(self):

        _user = mongoapi.create_user("bob", "bob@test.org", [], 'pending')
        user = User.get(_user["_id"])
        expect(user.email).to.be.eq("bob@test.org")
        expect(user.username).to.be.eq("bob")

        _user2 = User.create("bob2", "theBuilder", "bob2","bob2@test.org")
        user2 = User.get(_user2["_id"])
        expect(user2.email).to.be.eq("bob2@test.org")
        
        Friendship.create(user._id, user2._id)

        friends = user.get_friends()
        expect(len(friends)).to.be.eq(1)
        expect(friends[0]._id).to.be.eq(user2._id)

        friends2 = user2.get_friends()
        expect(len(friends2)).to.be.eq(1)
        expect(friends2[0]._id).to.be.eq(user._id)

    
    def test_mission(self):
        orgadmin = Util.createTestUser("orgadmin", ["orgadmin"])
        user1 = Util.createTestUser("user1") 
        user2 = Util.createTestUser("user2")  

        self.orgadmin = orgadmin 
        self.user1 = user1
        self.user2 = user2

        self.members = [user1, user2]
        
        self.org = Util.createTestOrg([orgadmin], [user1, user2])

        mission1 = Util.createTestMission(self.org, self.orgadmin, self.members,1)

        mission = Mission(mission1)

        phases = mission.phases

        expect(len(mission.phases)).to.be.eq(3)

        expect(mission.phases[0].isReady).to.be.true()
        expect(mission.phases[1].isReady).to.be.false()
        expect(mission.phases[2].isReady).to.be.false()

        expect(mission.phases[0].nb).to.be.eq(1)
        expect(mission.phases[1].nb).to.be.eq(2)
        expect(mission.phases[2].nb).to.be.eq(3)

        expect(mission.phase).to.be.eq(mission.phases[0])


        expect(mission.isActive).to.be.true()
        expect(mission.loctype).to.be.eq("brainstorm")


