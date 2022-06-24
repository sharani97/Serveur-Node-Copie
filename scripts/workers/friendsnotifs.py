import statistics
import arrow
import random

from bson.objectid import ObjectId
from gcore import mongoapi, users, fbase, const, global_vars, pluralize

from dataclass import *

from . import notifs
from tasks import NotifSender, EmailSender

logger = None
from loc import _, _count
from typing import Dict, List


def set_logger(_logger):
    global logger
    logger = _logger
'''
local elements = {
    {key = "missions", loc = "mission_notifs"},
    {key = "ideas", loc = "ideas_notifs"},
    {key = "friends", loc = "friends_notifs"},
    {key = "chat", loc = "chat_notifs"}

}
'''


'''
    user_id:user,
    target_id:doc.target_id,
    target_type:doc.target_type,
    title: doc.title,
'''
plurals = {
    "entity":"entities"
}



def like_warn(data, db, config):

    # print(" user id = ", data['payload']['user_id'])

    ## meaning !!
    meaning = data["payload"]['meaning'] # karma or like
    like_id = None

    if "like_id" in data["payload"]:
        like_id = data["payload"]["like_id"]

    karma = (meaning == "karma")

    sender = db.users.find_one({'_id':ObjectId(data['payload']['user_id'])})
    _sender = User(sender)

    target_type = data['payload']['target_type']
    like_target_id = data['payload']['target_id']

    res = None
    res_id = None

    target_db = pluralize(target_type)

    _mission = get_parent_mission(like_target_id, target_type)

    target_object = db[target_db].find_one({'_id':  ObjectId(data['payload']['target_id'])})

    if target_object is None:
        print(" There is no {} in {} / {} ".format(data['payload']['target_id'], target_db, target_type))
        print(data)
        return True, {}

    if target_type == "likes" and target_object["meaning"] == "karma":
        return True, {}


    target = target_object

    lockey = data['task'].split('.')[1]
    amount = 1

    _title = "none"
    _secondary_title = "none"

    user_id = None

    uri = None

    # find target user
    if target_type == "user":

        _target = User(target_object)
        _creator = _target
        lockey = "{}_friend".format(meaning)
        uri = "users/{}".format(str(sender['_id']))
        res = "users"
        res_id = str(sender['_id'])
        # reward the user and notify him
    else:

        _creator = get_creator(target_object)
        _target = _creator

        if target is None:
            print(target_type)
            print(target_object)
            logger.info("no creator id nor user id in {} {} ??".format(target_type, target_object['_id']))
            return True, {}

        if "title" in target_object:
            _title = target_object["title"]

    # get mission for pseudo purposes
    _mission = get_parent_mission(like_target_id, target_type)

    user_id = _target._id

    # can't reward yourself, don't notify, etc.
    # might want to up existing notifs count though ?
    # actually no its simpler to recount them, simply
    if _target._id == _sender._id:
        return True, {}

    # if target_type == comment
    # => check if the user if the owner of the thing we're commenting on
    # why ?


    if target_type == "comment":
        ## comment is on ... ?
        #   target_type :["entity", "organization", "mission", "idea", "comment"]

        # was the comment a suggestion ??
        suggest = target_object["suggest"]
        if suggest:
            lockey = "{}_suggestion".format(meaning)
        else:
            lockey = "{}_comment".format(meaning)


        # DO WE REALLY NEED TO DO THIS ?
        # WE JUST WANT TO AVOID REWARDING THE SYSTEM, REALLY
        # => CREATE A SYSTEM USER ?

        comment_target_type = target_object['target_type']
        target_comment_db = pluralize(comment_target_type)
        comment_target = db[target_comment_db].find_one({'_id':  ObjectId(target_object['target_id'])})

        # ok now we got the target, so we can get the resource concerned
        if comment_target_type == "idea":
            res = "missions"
            res_id = str(comment_target['mission_id'])

        if comment_target_type == "mission":
            res = "mission"
            res_id = str(comment_target['_id'])

        # I create an idea
        # someone comments on it
        # I karma the comment
        # why should the comment creator not be rewarded ?, as long as he is not me ?
        # if comment_target_type in ["idea","comment","mission", "post"]:
        #     if str(comment_target["creator_id"]) == str(target['_id']):
        #         amount = 0 # the question is : is the sender the same ??


    # if target_type == idea
    #  => check if the user if the owner of the *mission*, i.e. the system
    # wait, but only in phase 2 & 3 !!!
    # (because why should likes & karma not work in brainstorm ??)

    if target_type == "idea":
        lockey = "{}_idea".format(meaning)

        if "mission_id" not in target:
            logger.error("Idea {} has no mission_id, removing job/idea".format(target["_id"]))
            mongoapi.make_job(db, "db.remove_item", {
                "type":"jobs",
                "_id":data["_id"]
            })
            mongoapi.make_job(db, "db.remove_item", {
                "type":"ideas",
                "_id":target_object["_id"]
            })
            return True, {}

        mission = db["missions"].find_one({'_id':  ObjectId(target['mission_id'])})
        _mission = Mission(mission)
        # ok now we got the target. Is the actor the same as the "thing" creator ?

        res = "missions"
        res_id = str(target['mission_id'])

        uri = "missions/{}/ideas/{}".format(str(mission["_id"]),str(target['_id']))

        if _mission.currentPhase.nb != 1 and _mission.creator_id == _sender._id:
            amount = 0

    if target_type == "post":
        lockey = "{}_post".format(meaning)
        uri = "posts/{}".format(str(target_object['_id']))

    # no notif, no reward
    if amount == 0:
        return True, {}

    if karma:
        users.reward_user(db, user_id, Reward(kp = amount))

    # now, we have the notif_type, but do such notifs already exist ??

    pseudos = False
    if _mission is not None:
        pseudos = _mission.pseudos

    locdata = {
        "sender":_sender.getName(pseudos), # yeah no, need to check confidentiality / anonymity
        "target":_target.getName(pseudos), # check confidentiality / anonymity ? => no
        "amount":amount,
        "title":_title,
        "type":_("objectTypes." + target_type, "friends")
    }

    # lockey = data['task'].split('.')[1]
    push_message = _(lockey+'.push','friends', locdata)
    message = _(lockey+'.message','friends', locdata)
    title = _(lockey+'.title','friends', locdata)

    # now the fun starts :
    #   - what is the pending count of likes or whatever ? if the count = 0 => probably no pending notif :P
    #   - else get corresponding notif ?
    # so, first, get the likes on the object

    # this already includes the subject matter of the notif
    extant_likes = db["likes"].count({"target_id":like_target_id, "meaning":meaning})

    _data = {
        "creator_id":data['payload']['user_id'],
        "type":lockey,
        "read":not(lockey in const.action_notifs),
        "text":message,
        "target":target["_id"],
        "subject":like_target_id,
        "payload":data['payload'],
        "uri":uri,
        # I can actually karma "all" those who liked ?
        # "subject":like_id  #??? used for karma ? what was that again ?
    }

    notif = mongoapi.make_object(db, "notifs", _data)

    push_payload = {
        "uri":uri,
        "type":str(lockey),
        "sender":str(sender['_id']), #ObjectIds don't translate well to payloads
        "notif_id":str(notif['_id']),
        "like_id":str(like_id),
        "res":res,
        "_id":str(res_id)
    }

    notifs.send_notif(db, _target, title, push_message, push_payload)
    return True, {}



def comment_warn(data, db, config):

    # IS IT A SUGGESTION ??
    payload = data["payload"]
    _subject = None

    if 'user_id' not in payload:
        payload['user_id'] = data['creator_id']

    if 'title' not in payload: # erm ?
        payload['title'] = "<no comment>"

    if 'subject' not in payload: # erm ?
        #logger.error("no subject in comment warn ? BOUHOU : /")
        #print(data)
        pass
    else:
        subject_id = payload['subject']
        subject = global_vars.db.comments.find_one({"_id":ObjectId(subject_id)})
        _subject = Comment(subject)

    if 'target_id' not in payload:
        logger.error("no target id ? removing")
        mongoapi.make_job(db, "db.remove_item", {
            "type":"jobs",
            "_id":str(data["_id"])
        })
        return True, {}

    # is it a suggestion or a comment ?
    # is it the general case or the
    notif_type = const.NOTIF_USER_COMMENTED
    verb = "comment" # for loc
    suggest = False
    rooturi = None 
    

    if "suggest" in payload:
        suggest = payload["suggest"]

    if suggest:
        verb = "suggest"


    # get the sender
    sender = db.users.find_one({'_id':ObjectId(data['payload']['user_id'])})
    _sender = User(sender)

    # get the object
    target_type = data['payload']['target_type']
    target_db = pluralize(target_type)
    target_object_id = ObjectId(data['payload']['target_id'])

    target_object = db[target_db].find_one({'_id': target_object_id})
    
    if target_object is None:
        logger.error(" no such _id {} in {}".format(data['payload']['target_id'], target_db))
        return True, {}

    if target_type == "mission":
        _mission = Mission(target_object)
    else:
        _mission = get_parent_mission(target_object_id, target_type)


    creator = db.users.find_one({'_id':target_object['creator_id']})
    _creator = User(creator)

    warned = [_sender._id] # sender has already commented, don't want to warn him of his own actions
    to_warn = []
    if _creator._id != _sender._id:
        to_warn.append(_creator._id)

    # 1 : we check who else has commented and count the unique users
    comments = db.comments.find({
        "target_id":target_object_id,
        "suggest":suggest
    })
    for comment in comments:
        _comment = Comment(comment)
        if _comment.creator_id not in warned and _comment.creator_id not in to_warn:
            to_warn.append(_comment.creator_id)

    other_comment_count = max(len(to_warn) - 1,0)

    cnt = _count(other_comment_count)
    cnt_v = _count(max(len(to_warn),1))

    if _mission is None:
        actor = _sender.getName()
    else:
        actor = _sender.getName(_mission.pseudos)

    locdata = {
        "actor": actor,
        "title":data['payload']['title'],
        "object_title":target_object['title'],
        "adjuct": _('adjunct.{}'.format(cnt),'notifs', {"nb":other_comment_count}),
        "verb":_('verb_{}.{}'.format(verb, cnt_v),'notifs'),
        "object": _('object.{}'.format(target_type),'notifs')
    }

    loc_key = "user_commented"

    # if the target is a mission
    # TODO: or an idea in phase 3 ?

    if target_db == "missions":
        notif_type = const.NOTIF_USER_COMMENTED_MISSION
        uri = "missions/{}/comments".format(_mission._id)
        rooturi = "missions/{}".format(_mission._id)

    if target_db == "ideas":
        if suggest:
            notif_type = const.NOTIF_USER_SUGGESTED
            rooturi = "missions/{}".format(_mission._id)
            if _subject is not None:
                uri = "missions/{}/ideas/{}/suggestions/{}".format(_mission._id, target_object_id, _subject._id)
                rooturi = "missions/{}".format(_mission._id)
            else:
                uri = "missions/{}/ideas/{}".format(_mission._id, target_object_id)
                rooturi = "missions/{}".format(_mission._id)
        else:
            notif_type = const.NOTIF_USER_COMMENTED_IDEA
            uri = "missions/{}/ideas/{}/comments".format(_mission._id, target_object_id)
            rooturi = "missions/{}".format(_mission._id)

    if target_db == "posts":
        uri = "posts/{}/comments".format(target_object_id)
        rooturi = "posts/{}".format(target_object_id)

    if target_db == "comments":
        # i can only comment on comment if it is a suggestion, normally
        to = Comment(target_object)
        if to.suggest:
            notif_type = const.NOTIF_USER_COMMENTED_SUGGESTION
            uri = "missions/{}/ideas/{}/suggestions/{}".format(_mission._id,to.target_id, target_object_id)
            rooturi = "missions/{}".format(_mission._id)

    push_message = _(loc_key+'.push','notifs', locdata)
    push_title = _(loc_key+'.title','notifs', locdata)
    message = _(loc_key+'.message','notifs', locdata)

    mission_id = None
    if _mission is not None:
        mission_id = _mission._id

    push_payload = NotifSender.blank_push_payload(notif_type, target_db, target_object_id, uri)

    notif_list = {}
    old_notifs = db.notifs.find({"subject":target_object_id, "type": notif_type})

    for notif in old_notifs:
        _notif = Notif(notif)
        notif_list[_notif.target] = _notif

    # 2b. warn users & update previous notif
    for user_id in to_warn:
        _user = User.get(user_id)
        notif = None
        if user_id in notif_list:
            notif = notif_list[user_id]
            # set read and update sender
            # do we send a push notif ?
            send = True
            if notif.read == False and notif.text == message:
                send = False

            notif.update_fields({
                "creator_id":_sender._id,
                "read":False,
                "text":message
            })
            if send:
                NotifSender.send_notif(_user, notif_type, push_title, push_message, push_payload)
        else:
            notif = Notif.create(_sender._id, notif_type, message, user_id, target_object_id, uri, push_payload)
            NotifSender.send_notif(_user, notif_type, push_title, push_message, push_payload)

        warned.append(user_id)


    # 3: if the owner has not taken part we warn him too
    '''
    locdata = {
        "sender":_sender,
        "target":target["username"],
        "title":data['payload']['title']
    }

    lockey = data['task'].split('.')[1]

    push_message = _(lockey+'.push','friends', locdata)
    message = _(lockey+'.message','friends', locdata)
    title = _(lockey+'.title','friends', locdata)


    # needs proper payloa
    new_not = Notif.create(data['payload']['user_id'], notif_type, message, target["_id"],target_object["_id"],"", data['payload'])

    push_payload = {
        "type":str(lockey),
        "sender":str(sender['_id']),
        "notif_id":str(new_not._id),
        "res":"users",
        "uri":uri,
        "_id":str(sender['_id'])
    }

    notifs.send_notif(db, target, title, push_message, push_payload)
    '''

    return True, {}

def chat_warn(data, db, config):

    if 'payload' not in data or 'to' not in data['payload']:
        logger.error(" no to in chat_warn, removing")
        return True, {}

    if 'msg' not in data['payload']:
        logger.error(" no msg in chat_warn, removing")
        return True, {}

    push = True
    if 'push' in data['payload']:
        push = data['payload']['push']

    job = Job(data)
    payload = job.payload
    notif_type = const.NOTIF_USER_MESSAGED

    sender = None
    if 'from' in payload:
        sender = User.get(ObjectId(payload['from']))

    if sender is None:
        sender = User.get(job.creator_id)

    if sender is None:
        logger.error(" chat_warn: unable to retrieve sender, removing")
        return True, {}


    target = User.get(ObjectId(payload['to']))

    user = target

    message = payload['msg']
    username = sender.anoname

    # target_object_id = conversation
    conversation = None

    if "conversation" in payload:
        conversation = Conversation.get(payload["conversation"])
    else:
        conversation = Conversation.get_from_users(sender._id, target._id)

    nb_unread = conversation.getUnread(target._id)

    uri = "{}/{}".format("conversations", sender._id)

    push_payload = NotifSender.blank_push_payload(
            notif_type,
            conversation.dbtype,
            conversation._id,
            uri)

    ## will need rework for multiuser conversations
    old_notif = db.notifs.find_one({
        "uri":uri,
        "type": notif_type,
        "target": target._id
    })

    locdata = {
        "sender":sender.anoname,
        "target":target.anoname,
        "nb":nb_unread
    }

    lockey = notif_type
    push_message = "{}: {}".format(username, message)

    message = push_message
    title = _(lockey+'.title','friends', locdata)

    if nb_unread == 1:
        notif_message = _('user_messaged.message','friends', locdata)
    else:
        notif_message = _('user_messaged_plural.message','friends', locdata)

    notif = None

    if old_notif is None:
        notif = Notif.create(sender._id, notif_type, notif_message, target._id, title, uri, push_payload)
    else:
        notif = Notif(old_notif)
        notif.update_fields({
            "text":notif_message,
            "read":False
        })

    # yeah send it anyway
    if push:
        notifs.send_notif(db, target, title, push_message, push_payload)
    return True, {}

def post_warn(data, db, config):

    job = Job(data)

    sender = None

    if "sender" not in job.payload:
        sender = User.get(job.creator_id)
    else:
        sender = User.get(job.payload["sender"])
    str_targets = job.payload["target_ids"]

    if "subject" not in job.payload: # not hope of recovery
        global_vars.logger.warn("no subject in job post warn, {}, skipping ".format(job._id))
        global_vars.logger.warn(job.payload)
        return True, {}

    post = Post.get(job.payload["subject"])
    targets = []
    for id in str_targets:
        targets.append(ObjectId(id))

    org_targets = db.users.find({
        '_id':{'$in': targets}
    })

    email_recipients = []
    org_ids = []
    for orgadmin in org_targets:
        org_admin = User(orgadmin)
        email_recipients.append(org_admin)
        org_ids.append(org_admin._id)

    EmailSender.user_posted(sender, email_recipients, post)
    # send
    friend_targets = sender.get_friends(org_ids) + email_recipients

    NotifSender.user_posted(friend_targets, post, sender)
    return True, {}


def friendship_warn(data, db, config):

    # move details to NotifSender
    _sender = db.users.find_one({'_id':ObjectId(data['payload']['from'])})
    _target = db.users.find_one({'_id':  ObjectId(data['payload']['to'])})

    sender = User(_sender)
    target = User(_target)

    locdata = {
        "sender":sender.anoname,
        "target":target.anoname
    }

    notif_type = data['task'].split('.')[1]

    push_message = _(notif_type+'.push','friends', locdata)
    message = _(notif_type+'.message','friends', locdata)
    title = _(notif_type+'.title','friends', locdata)

    _data = {
        "creator_id":data['payload']['from'],
        "type":notif_type,
        "read":not(notif_type in const.action_notifs),
        "text":message,
        "target":target["_id"],
        "payload":data['payload']
    }



    notif = Notif.create(sender._id, notif_type, message, target._id, sender._id, sender.uri, data["payload"])

    push_payload = NotifSender.blank_push_payload(notif, "users",sender._id, sender.uri)

    push_payload = {
        "type":str(notif_type),
        "sender":str(sender['_id']),
        "notif_id":str(notif['_id']),
        "res":"users",
        "_id":str(sender['_id'])
    }

    notifs.send_notif(db, target, title, push_message, push_payload)
    return True, {}


tasks = {
    const.JOB_WARN_FRIEND_REQUEST:friendship_warn,
    const.JOB_WARN_FRIEND_ACCEPTED: friendship_warn,
    const.JOB_WARN_USER_COMMENTED: comment_warn,
    const.JOB_WARN_USER_LIKED: like_warn,
    const.JOB_WARN_USER_MESSAGED:chat_warn,
    const.JOB_WARN_USER_POSTED:post_warn
}