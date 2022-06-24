
import bcrypt
import worker
import time 

import logger

from dataclass import *
from payloadclass import * 

import unittest
from robber import expect, CustomExplanation

from gcore import mongoapi, users, global_vars, const

from .utils import Util



# pylint: disable=no-member


class NotifTest(unittest.TestCase):

    def addUser(self, _user):
        self.users[_user._id] = _user

    def getUser(self, _id):
        return self.users[_id]

    def setUp(self):
        env = 'test'
        _log = logger.setupLogging('test_mongo.log')
        mongoapi.set_logger(_log)

        DB, CONF = mongoapi.setup(env)
        self.db = DB
        self.conf = CONF
        
        # clean up db 
        Util.clearDb()
        self.users = {}

        # create users
        orgadmin = Util.createTestUser("orgadmin", ["orgadmin"])
        self.orgadmin = User(orgadmin) 
        self.addUser(self.orgadmin )

        user1 = Util.createTestUser("user1") 
        self.user1 = User(user1)
        self.addUser(self.user1)

        user2 = Util.createTestUser("user2") 
        self.user2 = User(user2)
        self.addUser(self.user2)

        self.members = [user1, user2]

        org = Util.createTestOrg([orgadmin], [user1, user2])
        self.org = org 
        # create mission
        self.mission = Util.createTestMission(self.org, self.orgadmin, self.members,3)
        #print("mission ", self.mission)

        self.ideas = Util.makeRandomIdeas(self.mission, [self.user1, self.user2],4,3)


    def test_comment_notifs(self):

        comment = Comment.create(self.user1._id, self.mission['_id'], "mission", "This is a comment")

        Job.create(const.JOB_WARN_USER_COMMENTED, {
            "target_id":comment.target_id,
            "target_type":comment.target_type,
            "user_id":self.user1._id,
            "title":comment.title,
            "subject": comment._id
        })

        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)
        with CustomExplanation(' 1 notif, to owner'): 
            expect(self.db.notifs.count({})).to.be.eq(1)

        not0 = self.db.notifs.find_one({
            "read":False
        })
        _not0 = Notif(not0)

        _target = self.getUser(_not0.target)

        expect(_target.username).to.be.eq("orgadmin")
        expect(_not0.type).to.be.eq(const.NOTIF_USER_COMMENTED_MISSION)
        expect(_not0.subject).to.be.eq(self.mission['_id'])
        expect(_not0.read).to.be.eq(False)

        #expect(_not0.subject).to.be.eq(comment._id)
        #expect(_not0.text).to.be.eq("user1 a commenté : This is a comment")
        #expect(_not0.target).to.be.eq(self.orgadmin._id)

        _not0.setRead()
        expect(self.db.notifs.count({'read':False})).to.be.eq(0)

        comment2 = Comment.create(self.user2._id, self.ideas[0]['_id'], 'idea', 'this is an idea comment')
        Job.create(const.JOB_WARN_USER_COMMENTED, {
            "target_id":comment2.target_id,
            "target_type":comment2.target_type,
            "user_id":self.user2._id,
            "subject":comment2._id
        })

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)   

        # with CustomExplanation(' 1 notif, to owner, 1 to previous'): 
        expect(self.db.notifs.count({'read':False})).to.be.eq(1)

        not1 = self.db.notifs.find_one({
            "read":False
        })

        _not1 = Notif(not1)

        _not1.setRead()

        comment3 = Comment.create(self.user2._id, self.mission['_id'], "mission", "This is a comment")
        Job.create(const.JOB_WARN_USER_COMMENTED, {
            "target_id":comment3.target_id,
            "target_type":"mission",
            "user_id":self.user2._id,
            "title":comment.title
        })

        # for the job to be "in the past"
        time.sleep(.100)
        worker.check_jobs(self.db, self.conf)   
        
        # with CustomExplanation(' 1 notif, to owner, 1 to previous'): 
        expect(self.db.notifs.count({"read":False})).to.be.eq(2)



        comment = Comment.create(self.orgadmin._id, self.mission['_id'], "mission", "This is a comment also")

        Job.create(const.JOB_WARN_USER_COMMENTED, {
            "target_id":self.mission['_id'],
            "target_type":"mission",
            "user_id":self.orgadmin._id
        })

        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)   

        # comment on mission 
        # check creator is warned 
        # 
        pass

    def test_messages_notifs(self):

        msg = "coucou ceci est un message"
        conv = Conversation.create(self.user1._id, self.user2._id)
        conv.message(self.user1._id, msg)

        chat_payload = ChatPayload(self.user2._id, self.user1._id, msg)

        Job.create(const.JOB_WARN_USER_MESSAGED, chat_payload.payload)

        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)    
        
        # todo : proper warn messaging 
        # expect(self.db.notifs.count({"read":False})).to.be.eq(0)



        # comment on mission 
        # check creator is warned 
        # 
        pass

    def test_like_notifs(self):

        like = Like.create(self.user1._id, self.mission['_id'], "mission",1)
        
        Job.create(const.JOB_WARN_USER_LIKED, {
            "target_id":self.mission['_id'],
            "target_type":"mission",
            "user_id":self.user1._id,
            "subject":like._id,
            "meaning":"like"
        })

        # for the job to be "in the past"
        time.sleep(.100)

        worker.check_jobs(self.db, self.conf)    
        
        # user liked is not an "action notif"
        expect(self.db.notifs.count({"read":False})).to.be.eq(0)



        # comment on mission 
        # check creator is warned 
        # 
        pass
