
import sys
import json
import time
import os
import arrow
import random 
import logger

from gcore import mongoapi, users
from tests import utils

from workers import jobs, mission_reports, emails, missions 

#from workers.mission_reports import create_mission_report, set_logger
#from workers.emails import send_mission_report,

    
phases = [1] ##,'phase2','phase3']


#phases = [1,2,3] ##,'phase2','phase3']


_utils = None 

def makeMission(db, config, phase, ongoing=True):
    global _utils
    phase_name = "phase{}".format(phase)
    
    print("making mission with ", phase_name)

    if _utils is None:
        _utils = utils.Util(db, config)

    orgadmin = _utils.createTestUser("orgadmin", ["orgadmin"])
    user1    = _utils.createTestUser("user1") 
    user2    = _utils.createTestUser("user2")  
    members  = [user1, user2]
    users    = [orgadmin, user1, user2]
    org      = _utils.createTestOrg([orgadmin], members)
    mission  = _utils.createTestMission(org, orgadmin, members, phase, ongoing=ongoing)
    mission_end = arrow.get(mission[phase_name]["end"])
    ideas    = _utils.makeRandomIdeas(mission, users, 5, phase)

    for idea in ideas:
        n = random.randint(0,10)
        _start = arrow.get(idea["created"])
        _utils.makeRandomComments(idea, "idea", users, _start, mission_end, n)

        if phase == 2:
            # make votes 
            skew = random.randint(-1,2)
            _utils.makeRandomIdeaVotes(mission, users, idea, skew, _start, mission_end)

    if phase == 3:
        # make investors / orders 
        _utils.makeRandomOrdersAndSuggestions(mission, users, ideas)

    for idea in ideas:
        if "dirty" in idea:
            mongoapi.update_object(db, "ideas",idea)
        

    return mission 
    

def sendTestMissionReports(email, db, config, env):
    global _utils
    # find first active mission of chosen types
    if _utils is None:
        _utils = utils.Util(db, config)


    for _phase in phases:
        phase = "phase{}".format(_phase)
        mission = db.missions.find_one(
            {   
                "{}.active".format(phase):True, 
                "{}.state".format(phase):"ready"
            })

        if mission is None:
            if env == 'test': 
                _utils.clearDb()

            logger.warning("There are no missions with active {}, making fake mission".format(phase))
            
            #mission = makeMission(db, config, _phase)
            mission = makeMission(db, config, _phase, True)
            
            print("now mission is ", mission)

        print("mission pre payload : ", mission)
            
        payload = {
            "mission_id" : mission["_id"],
            "email":email,
            #FIXME : when testing mission reports this generated phase2 mission report even when phase was specified to phase1
            #"phase":phase
            "phase":_phase
        }
        
        # create job 
        print("payload ", payload)
        #_job = mongoapi.make_job('report.mission', payload, mongoapi.tool_user['_id'])
        _job = mongoapi.make_job('mission.check_phase_end', payload, mongoapi.tool_user['_id'])
        
        # do it 
        #print(_job)
        if True:
            #ok, _job2 = mission_reports.create_mission_report(_job, db, config)
            ok, _job2 = missions.check_mission_phase_end(_job, db, config)

            #if env != 'test':
            #    emails.send_mission_report(_job2, db, config)

        else:
            db.jobs.insert_one(_job)

    # brew some coffee 
    pass


if __name__ == '__main__':
    logfile  = 'test.log'
    logger = logger.setupLogging(logfile)
    
    jobs.set_logger(logger)
    emails.set_logger(logger)
    mission_reports.set_logger(logger)
    mongoapi.set_logger(logger)


    print("starting")
    args =  sys.argv

    if len(args) < 3:
        email = "david.hockley@gmail.com"
        env = "test"
        
    else:
        email = args[1]
        env = args[2]
    
    DB, CONF = mongoapi.setup(env)
    sendTestMissionReports(email, DB, CONF, env)