
import json
import arrow
import os

from pymongo import MongoClient
from bson.objectid import ObjectId
import collections

from dataclass import Reward

db = None
env = None
config = None
logger = None 
tool_user = None 

dir_path = os.path.dirname(os.path.realpath(__file__))

class JobException(Exception):
    """Raised when an operation attempts a state transition that's not
    allowed.

    Attributes:
        job -- the job
        message -- explanation 
    """

    def __init__(self, job, message):
        self.job = job
        self.message = message

JOB_TYPES = {
}


def get_tool_user():
    global tool_user
    if tool_user is not None:
        return tool_user

    tool_user = db.users.find_one({'roles':'tool'})

    domain = config['email-domain']

    if tool_user == None:
        logger.info('Creating tool user')
        tool_user = create_user('JOBS_TOOL', 'tool@{}'.format(domain), ['tool'], 'created', True)

    return tool_user

def get_naive_now():
    return arrow.utcnow().naive


def set_logger(_logger):
    global logger
    logger = _logger



def create_job(_type, _payload):
    return {
        'task':_type,
        'payload':_payload,
        'state': 'new'
    }

#def make_job(db, _type, _payload):
#    _job = create_job(_type, _payload)
#    result = db.jobs.insert_one(_job)
#    _job['_id'] = result.inserted_id
#    return _job

def update(d, u):
    for k, v in u.items():
        if isinstance(v, collections.Mapping):
            d[k] = update(d.get(k, {}), v)
        else:
            d[k] = v
    return d


def setupConf(_env):

    global config
    global env
    env = _env

    with open('{}/../../config/default.json'.format(dir_path), 'r') as json_file:
        config = json.load(json_file)

    with open('{}/../../config/{}.json'.format(dir_path, env), 'r') as json_file2:
        upd = json.load(json_file2)
        config = update(config, upd)

    return config


def update_object(db, obj_type, data, _id=None):
    if _id is None:
        _id = data['_id']
 
    data['updated'] = get_naive_now() 

    result = db[obj_type].update({'_id':_id}, {'$set':data}, upsert=False)
    return result 


def make_object(db, obj_type, data):

    if data is None:
        raise Exception('trying to make a None object')

    if 'created' not in data:
        data['created'] = get_naive_now() 

    if 'updated' not in data:
        data['updated'] = get_naive_now() 

    result = db[obj_type].insert_one(data)

    data['_id'] = result.inserted_id
    return data


def __reward_user(db, user_id, category, amount, dom=None, primary=False):

    rewardee_id = ObjectId(user_id)

    if dom is None:
        dom = {'$exists':False}
        ret = db.points.update(
            { 'user':rewardee_id, 'cat':category, 'dom':dom },
            {
                '$inc': {'amount': amount},
                '$setOnInsert': {'user':rewardee_id, 'cat':category, 'primary':primary }
            },
            upsert=True)

    else:
        dom = ObjectId(dom)
        ret = db.points.update(
            { 'user':rewardee_id, 'cat':category, 'dom':dom },
            {
                '$inc': {'amount': amount},
                '$setOnInsert': {'user':rewardee_id, 'cat':category, 'dom':dom, 'primary':primary }
            },
            upsert=True)

def reward_user(db, user_id, reward, dom=None, primary=False):
    reward_list = reward.toList()
    for reward in reward_list:
        __reward_user(db, user_id, reward["cat"], reward["nb"], dom, primary)





def make_job(task, payload, creator = None, state = "new", exec_at = None, _id = None):
    global tool_user
    if creator is None:
        creator = tool_user['_id']

    if exec_at is None:
        exec_at = get_naive_now()

    _job = {
        "id": _id,
        "state":state,
        "task":task,
        "payload":payload,
        "exec_at":exec_at,
        "creator":creator
    }
    return _job

def save_job(db, task, payload, creator = None, state = "new", exec_at = None, _id = None):
    _job = make_job(task, payload, creator, state, exec_at, _id)
    return make_object(db, 'jobs', _job)


def create_user(name, email, roles, status = 'pending', validated = False):

    data = {
        'email': email,
        'username':name,
        'id':name.lower(),
        'roles': roles,
        'validated':validated,
        'status': status,
    }

    user = make_object(db, 'users', data)
    user_id = str(user['_id'])
    
    # nah : give the points on register 
    #create_reward = Reward('account_created', config)
    #reward_user(db, user_id, create_reward, None, True)
    return user

def setup(_env):

    global db, config, tool_user

    config = setupConf(_env)
    dbConfig = config["dbConfig"]
    domain = config['email-domain']
    client = MongoClient("mongodb://{}:{}".format(dbConfig["host"], dbConfig["port"]))
    db = client[dbConfig["collection"]]

    # get or create tool user

    tool_user = get_tool_user()

    ## could set them to global_vars here 

    return db, config

