import sys
import json
import api
import time
import csv
from pymongo import MongoClient
from bson.objectid import ObjectId
import logger
import mongoapi


db = None
#logfile  = 'dojobs.log'
#logger = logger.setupLogging(logfile)


def llog(message):
    print(message)
    sys.stdout.flush()

def doJob(data, db):

    # 1. get user
    # logger.info('getting user')
    user = db.users.find_one({"_id": ObjectId(data["creator_id"])})

    if "admin" not in user["roles"] and "orgadmin" not in user["roles"]:
        raise Exception("error.user_not_admin")

    #2. get group
    group = db.groups.find_one({"_id":ObjectId(data["payload"]["body"]["group"])})

    #3. get org
    org = db.organizations.find_one({"_id": group["org"]})
    if "admin" not in user["roles"] and user["_id"] not in org["admins"]:
        #logger.info('user not orgadmin, exiting')
        raise Exception("error.user_not_admin_for_org")
    # print(org)

    # 4. get/open csv file
    logger.info(data)
    if data["task"] == "CSV_JOB":
        #print(data["payload"]["file"])
        with open('public/job/{}'.format(data["payload"]["file"]), 'r') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',', quotechar='"')
            emails = []
            for row in csv_reader:
                emails.append(row[0])

            #for email in emails:
            print(emails)

#start process
if __name__ == '__main__':

    args =  sys.argv
    env = args[2]
    db = mongoapi.setup(env)
    data = json.loads(args[1])
    doJob(data, db)
