from . import mongoapi
from bson.objectid import ObjectId
import bcrypt


fakedomains = ["fake", "test"]
logger = None


def set_logger(_logger):
    global logger
    logger = _logger

def get_from_email(email, db):
    return db.users.find_one({'email':email})

def set_password(email, password, db):
    usr = db.users.find_one({'email':email})
    hash = bcrypt.hashpw(password.encode('utf8'), bcrypt.gensalt())
    usr["token"] = hash
    mongoapi.update_object(db, 'users', usr)

def get_or_create(email, db, roles):

    usr = db.users.find_one({'email':email})
    if usr is not None:
        return usr

    usr_id = db.users.count() + 1
    usr = mongoapi.create_user('user_{}'.format(usr_id), email, roles, 'pending',False)
    return usr

'''

    let rewardee_id = mongoose.Types.ObjectId(rewardee)

    for(let d of [dom, subdom]) {
        if (d) {
            let id = mongoose.Types.ObjectId(d);
            await Points.update({user:rewardee_id, cat:type, dom:d},
                {
                    $inc: {amount: amount},
                    $setOnInsert: {user:rewardee_id, cat:type, dom:d}
                },
                { upsert: true }
            );
        }
    }

    await Points.update({user:rewardee_id, cat:type, dom:{$exists:false}}, {
    $inc: {amount: amount},
    $setOnInsert: {user:rewardee_id, cat:type }
    }, {upsert: true});
'''

def reward_user(db, user_id, reward, domain=None, subdomain=None, primary=False):
    
    domains = [domain, subdomain]
    for d in domains:
        if d is not None:
            mongoapi.reward_user(db, user_id, reward, d)

    if primary == False or (domain is None and subdomain is None):
        mongoapi.reward_user(db, user_id, reward)
    
    reward_list = reward.toList()




def is_fake_email(email):
    email = email.lower()
    # create random password 
    if "@" not in email:
        return True
    bits = email.split("@")
    _id = bits[0]
    domain = bits[1].split(".")[0]

    if domain in fakedomains:
        return True 

    if domain == "free" and _id[:2] == "jim":
        return True

    return False
