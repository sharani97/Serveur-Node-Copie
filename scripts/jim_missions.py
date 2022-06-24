import logger
from gcore import mongoapi, global_vars
from tests.utils import Util
from bson.objectid import ObjectId
from dataclass import *
import arrow


'''
Entity JMC-DAVID / 5bfae607ca41e72f97a9235a

Org 5bfae779ca41e72f97a9235e

Members :

ObjectId("5a86f9976b2c40273888cad7"),
ObjectId("5a9c1dbdd908e209f62af0f4")
'''

logfile = 'jimw_test.log'
logger = logger.setupLogging(logfile)

logger.info('starting up worker')
ENV = 'dev'

DB, CONF = mongoapi.setup(ENV)


global_vars.setup(DB, CONF, ENV, logger)

entity_id = '5bfae607ca41e72f97a9235a'
user_id   = '5a86f9976b2c40273888cad7'
user_id2  = '5a9c1dbdd908e209f62af0f4'


entity = DB.entities.find_one({'_id':ObjectId(entity_id)})

orgadmin  = User.get(ObjectId(user_id))
orgadmin2 = User.get(ObjectId(user_id))

org_id = '5bfae779ca41e72f97a9235e'
_org = DB.organizations.find_one({'_id':ObjectId(org_id)})
org = Org(_org)

Util(CONF, DB, logger)

mission = Util.createTestMission(org, orgadmin, [orgadmin2], 1, True)
Util.makeRandomIdeas(mission, [orgadmin, orgadmin2], 10, 1)

start = arrow.now().shift(days=-2)
end = arrow.now()
mission2 = Util.createTestMission(org, orgadmin, [orgadmin2], 2, True)
ideas = Util.makeRandomIdeas(mission2, [orgadmin, orgadmin2], 10, 2)
for idea in ideas:
    votes = Util.makeRandomIdeaVotes(mission2, [orgadmin, orgadmin2], idea, start, end)

mission2b = Util.createTestMission(org, orgadmin, [orgadmin2], 2, False)
ideas = Util.makeRandomIdeas(mission2b, [orgadmin, orgadmin2], 10, 2)
for idea in ideas:
    votes = Util.makeRandomIdeaVotes(mission2b, [orgadmin, orgadmin2], idea, start, end)


