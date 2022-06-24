logger = None 
import arrow 
from dataclass import Mission, Notif
from tasks import S3Sender

def set_logger(_logger):
    global logger
    logger = _logger

def check_duplicates(db, key):
    logger.info("checking duplicates in : {}".format(key))
    items = db[key].find()
    for item in items: 
        members = item['members']
        unique_members = set(members)
        nb_members = len(members)
        nb_unique = len(unique_members)
        if nb_members < nb_unique:
            logger.info('Cleaning group {} from {} to {}'.format(item['_id'], nb_members, nb_unique))
            item['members'] = list(unique_members)
            db[key].update_one({'_id':item['_id']}, {"$set": item}, upsert=False)


def clean_old_notifs(db, is_restart = False):

    ## get all finished missions 

    missions = db.missions.find({})
    for obj in missions:
        mission = Mission(obj)
        if mission.isFinished:
            Notif.clearOldNotifs(mission._id, 'missions')


def remove_deprecated_jobs(db, is_restart = False):

    renamed_jobs = {
        'warn.mission_phase_ended':'mission.check_phase_end'
    }

    for old_task in renamed_jobs:
        new_task = renamed_jobs[old_task]
        logger.info('renaming {} to {}'.format(old_task, new_task))
        ret = db.jobs.update_many({"task": old_task}, {'$set':{"task": new_task}})
        if ret.acknowledged == False:
            logger.warn("no operation")
        else:
            logger.info('found : {} updated : {}'.format(ret.matched_count, ret.modified_count))

    deprecated_jobs = ['warn.mission_phase_wip']
    logger.info("checking deprecated jobs")
    for job in deprecated_jobs:
        logger.info("deprecating {}".format(job))
        ret = db.jobs.update_many({"task": job, 'state':'new'}, {'$set':{"state": "deprecated"}})
        if ret.acknowledged == False:
            logger.warn("no operation")
        else:
            logger.info('found : {} updated : {}'.format(ret.matched_count, ret.modified_count))


def reset_old_accepted_jobs(db, is_restart = False):

    logger.info("check old jobs")
    nowish = arrow.utcnow().shift(hours=-1).naive
    items = db.jobs.find({"state": "accepted", "exec_at":{"$lt": nowish}})
    for item in items: 
        item["state"] = "new"
        db.jobs.update_one({'_id':item['_id']}, {"$set": item}, upsert=False)
    #items = db.jobs.update({"state": "accepted"}, {"state": "new"})

def remove_untasked_jobs(db, is_restart = False):
    db.jobs.remove({"task": {'$exists': False}})

def remove_wonky_ideas(db, is_restart = False):
    db.ideas.remove({"mission_id": {'$exists': False}})

sets = ["groups", "orgs", "missions"]

def go(db, config):
    for col in sets:
        check_duplicates(db, col)
    remove_untasked_jobs(db)
    reset_old_accepted_jobs(db)
    remove_wonky_ideas(db)
    remove_deprecated_jobs(db) # can be disabled after use but no need
    clean_old_notifs(db)
    S3Sender.checkAllTheFiles()
    # remove points from old users 
    # db.users.update({}, {'$unset': {'points':1}}, multi=True)

