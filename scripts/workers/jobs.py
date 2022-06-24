import csv 
import arrow
from pymongo import MongoClient
from bson.objectid import ObjectId

from gcore import users, mongoapi

import logger

from . import mission_reports as reports 
from . import emails, missions, friendsnotifs, notifs, s3worker
from tasks import set_tasks_logger

logger = None

def set_logger(_logger):
    global logger
    logger = _logger 
    users.set_logger(_logger)
    emails.set_logger(_logger)
    reports.set_logger(_logger)
    friendsnotifs.set_logger(_logger)
    notifs.set_logger(_logger)
    set_tasks_logger(_logger)


def do_cleanup(data, db, conf):

    collection = data['type']
    _id = data['_id']
    logger.info("removing {} from {}".format(_id, collection))
    db[collection].remove({"_id": ObjectId(_id)})
    return True, {}

def do_csv_invite(data, db, conf):

    #1. get user
    user = db.users.find_one({"_id": ObjectId(data["creator_id"])})
    if "admin" not in user["roles"] and "orgadmin" not in user["roles"] and 'tool' not in user['roles']:
        raise mongoapi.JobException(data, "error.user_not_admin")

    #2. get group
    group = db.groups.find_one({"_id":ObjectId(data["payload"]["group"])})

    if group is None:
        raise mongoapi.JobException(data, "error.no_such_group")
    #3. get org
    org = db.organizations.find_one({"_id": group["org"]})
    if "admin" not in user["roles"] and user["_id"] not in org["admins"]:
        raise mongoapi.JobException(data, "error.user_not_admin")

    with open('public/job/{}'.format(data["payload"]["file"]), 'r') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',', quotechar='"')
        for row in csv_reader:
            email = row[0]
            _user = users.get_or_create(email, db, ['user'])
            user_id = _user["_id"]

            if (user_id in group['members']):
                pass
            else:
                group['members'].append(user_id)

        db.groups.update_one({'_id':group['_id']}, {"$set": group}, upsert=False)
        logger.info('job {} completed'.format(data['task']))
        return True, {}


JOBDICT = {
    "CSV_JOB" : do_csv_invite,
    "db.remove_item":do_cleanup
}

for key in emails.tasks:
    JOBDICT[key] = emails.tasks[key]

for key in reports.tasks:
    JOBDICT[key] = reports.tasks[key]

for key in missions.tasks:
    JOBDICT[key] = missions.tasks[key]

for key in friendsnotifs.tasks:
    JOBDICT[key] = friendsnotifs.tasks[key]

for key in s3worker.tasks:
    JOBDICT[key] = s3worker.tasks[key]

if __name__ == '__main__':
    logfile  = 'jobs{}.log'.format('lib')
    logger = logger.setupLogging(logfile)
 
    
