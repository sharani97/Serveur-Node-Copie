from gcore import mongoapi, users

import logger
import bcrypt


import unittest
from robber import expect
from dataclass import Reward

# pylint: disable=no-member


class MongoApiTest(unittest.TestCase):

    def setUp(self):
        _log = logger.setupLogging('test_mongo.log')
        mongoapi.set_logger(_log)
        DB, CONF = mongoapi.setup('test')
        self.db = DB
        self.conf = CONF

        self.db.points.delete_many({})
        self.db.users.delete_many({
            'username':{'$ne':'JOBS_TOOL'}
        })

        expect(self.db.users.count()).to.be.eq(1)

    def test_create_and_reward_user(self):

        # account_created":{"ap":5, "kp":3},
        # except points should be given on register not on create

        user = mongoapi.create_user("bob", "bob@test.org", [], 'pending')
        expect(self.db.users.count()).to.be.eq(2)
        expect(self.db.points.count({'user':user['_id']})).to.be.eq(0)

        mongoapi.reward_user(self.db, str(user['_id']), Reward(kp=5) )
        expect(self.db.points.count({'user':user['_id']})).to.be.eq(1)

        pt = self.db.points.find_one({
            'user':user['_id'], 
            'cat':'kp'
        })

        expect(pt['amount']).to.be.eq(5)


    def test_create_and_login_user(self):

        pwd = "toto"
        user = mongoapi.create_user("bob", "bob2@test.org", [], 'created')
        users.set_password("bob2@test.org", pwd, self.db)
        usr = users.get_from_email("bob2@test.org", self.db)
        expect(bcrypt.checkpw(pwd.encode("utf8"), usr["token"])).to.be.true()


