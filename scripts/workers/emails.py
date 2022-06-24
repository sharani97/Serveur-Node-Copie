import boto3
#import firebase_admin
#from firebase_admin import credentials
#from firebase_admin import messaging
import random
from botocore.exceptions import ClientError
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from jinja2 import Template
import json

import jwt
import sys
import base64
import os
import arrow

from typing import Dict

from gcore import users, mongoapi, const, global_vars
from loc import _
from dataclass import User, Org, Entity, Friendship, Job, Mission, Idea, Like, Comment
from tasks import EmailSender
from statsclass import UserInteractions
#try:
#    cred = credentials.Certificate("serviceFireBaseAccountKey.json")
#    firebase_admin.initialize_app(cred)
#except:
#    pass

logger = None
# HUM
region = "eu-west-1"

session = None
client = None

dir_path = os.path.dirname(os.path.realpath(__file__))

def setSESClient(_conn):
    global client
    client = _conn

def create_connexion(config):
    global session, client
    session = boto3.Session(profile_name=config["aws"])
    client = session.client('ses',region_name=region)

def set_logger(_logger):
    global logger
    logger = _logger

def checkValidEmail(data, db, email, need_validated = True):

    if users.is_fake_email(email):
        return False, {}

    _user = users.get_from_email(email, db)
    if _user is None:
        logger.info("no such user : {}".format(email))
        raise mongoapi.JobException(data,"no such user : {}".format(email))

    user = User(_user)
    if need_validated and user.validated == False:
        return False, user

    return True, user


def validate_email(data, db = None, config = None):

    # 1. check the email
    email = data['payload']['email']

    if users.is_fake_email(email):
        logger.info("{} is fake, skipping".format(email))
        return True, {}

    server = "http://{}:{}".format(config["domain"],config["port"])

    user = users.get_from_email(email, db)

    if user is None:
        logger.info("no such user : {}".format(email))
        raise mongoapi.JobException(data,"no such user : {}".format(email))

    if user["validated"]:
        return True, {}

    # 2. create the validation link (no need for expiry)
    claims = {
        "sub": str(user["_id"]),
        "iss": config["appname"],
        "email":email,
        "scope": ["validate_email"],
    }

    encoded_jwt = jwt.encode(claims, config["jwtSecret"], algorithm='HS256').decode("utf-8")
    link = "{}/api/validate/{}".format(server, encoded_jwt)

    _data = data['payload']
    _data['link'] = link

    done = EmailSender.send_email_type([user], const.EMAIL_VALIDATE_EMAIL, _data)

    return done, None

def mid_week_invites(data, db, config):

    # get all active brainstorm missions
    # and get all posts from last 2 weeks

    # job = Job(data)

    now = arrow.utcnow().format(const.DB_DATE_FMT)

    # for each idea, get the creator's last connexion data (or the user created date, if nil)
    userDict:Dict[str, User] = {}
    missionDict:Dict[str, Mission] = {}
    ideaDict:Dict[str,Idea] = {}

    #active_bs_missions = db.missions.find({
    #    'phase1.start':{'$lt':now},
    #    'phase1.end':{'$gt':now}
    #})

    active_bs_missions = db.missions.find({
        'phase1.state':'ready',
    })

    # for each mission, get the ideas
    mission_ids:Dict[str, Mission] = []

    for mission_obj in active_bs_missions:
        mission = Mission(mission_obj)
        mission_ids.append(mission._id)
        missionDict[mission._id] = mission

    if len(mission_ids) == 0:
        logger.warn('in mid_week_invites, there were no active brainstorm missions')
        return True, {}

    current_ideas = db.ideas.find({
        'mission_id':{'$in':mission_ids}
    })

    creator_ids = []
    creator_to_idea_dict = {}

    # for each idea get their creators
    for idea_obj in current_ideas:
        idea = Idea(idea_obj)
        
        ideaDict[idea._id] = idea
        if idea.creator_id not in creator_ids:
            creator_ids.append(idea.creator_id)
        if idea.creator_id not in creator_to_idea_dict:
            creator_to_idea_dict[idea.creator_id] = []
        # store creator to idea relationship for future reference
        creator_to_idea_dict[idea.creator_id].append(idea._id)

    if len(creator_ids) == 0:
        logger.warn('in mid_week_invites, there were no ideas/creators')
        return True, {}

    inactive_validated_user_ids = []

    creators = db.users.find({
        '_id':{'$in':creator_ids}
    })

    # at least 3 days ago
    before = arrow.now().shift(days = -3)

    target_idea_ids = []

    stats_per_user:Dict[str:UserInteractions] = {}

    for user_obj in creators:
        user = User(user_obj)
        userDict[user._id] = user
        # is it a valid user ?

        if user.validated and (user.last_cnx_arrow < before):
            inactive_validated_user_ids.append(user._id)
            target_idea_ids += creator_to_idea_dict[user._id]
            stats_per_user[user._id] = UserInteractions(user)

    if len(inactive_validated_user_ids) == 0:
        logger.warn('in mid_week_invites, there were no inactive validated creators')
        return True, {}

    # ok, now get the corresponding ideas ids likes and comments
    likes = db.likes.find({
        'target_id':{'$in':target_idea_ids}
    })



    for like_obj in likes:
        like = Like(like_obj)
        user:User = userDict[idea.creator_id]
        stats_per_user[user._id].add_like(like)

    comments = db.comments.find({
        'target_id':{'$in':target_idea_ids}
    })

    for comment_obj in comments:
        comment = Comment(comment_obj)
        user:User = userDict[idea.creator_id]
        stats_per_user[user._id].add_comment(comment)

    dest = {}

    for user_id in stats_per_user:

        user = userDict[user_id]
        stats:UserInteractions = stats_per_user[user._id]

        if stats.interaction_nb == 0:
            continue

        sender:User = None
        sender_name = None
        sender_id = None
        idea_id = None

        # get random action 
        random_comment:Comment = stats.random_comment
        if random_comment is not None:
            sender_id = random_comment.creator_id
            idea_id = comment.target_id
        else:
            random_like = stats.random_like
            sender_id = like.user_id
            idea_id = like.target_id

        # get action context
        idea = ideaDict[idea_id]
        mission:Mission = missionDict[idea.mission_id]

        # get user 
        if sender_id in userDict:
            sender = userDict[sender_id]
        else:
            sender = User.get(sender_id)
            userDict[sender_id] = sender
        sender_name = sender.getName(mission.pseudos)

        # nb need anoname, so need the mission, but we have it in the inital dict 
        dest[user.email] = {
            'name':user.anoname,
            "sender":sender_name,
            "others_nb":max(stats.total_user_count-1,0),
            "new_likes":len(stats.new_likes),
            "new_comments":len(stats.new_likes),
        }

    EmailSender.send_bulk_templated_email(dest, '{}_midweek_invite_fr'.format(global_vars.env))
    return True, {}

def come_and_post(data, db, config):

    # get old-ish validated users 
    users = db.users.find({
        'validated':True,
        '$or': [
            {'last_connexion': {'$lt': arrow.now().shift(days=-5).format(const.DB_DATE_FMT) }},
            {'last_connexion': {'$exists':False}}
        ]
    })

    dest = {}
    for user in users:
        usr = User(user)
        dest[usr.email] = {
            'name':usr.anoname
        }

    EmailSender.send_bulk_templated_email(dest, '{}_come_and_post_fr'.format(global_vars.env))
    return True, {}


def mid_month_invites(data, db, config):

    job = Job(data)
    # get all users with a validated email
    users = db.users.find({
        'validated':True,
        '$or': [
            {'last_connexion': {'$lt': arrow.now().shift(days=-5).format(const.DB_DATE_FMT) }},
            {'last_connexion': {'$exists':False}}
        ]
    })

    # not sure there are any but.. if they have pending requests...

    users_to_warn_ids = []
    userDict = {}
    userReqs = {}
    for obj in users:
        user = User(obj)
        userDict[user._id] = user
        users_to_warn_ids.append(user._id)
        userReqs[user._id] = []

    if len(users_to_warn_ids) == 0:
        logger.warn('No user matches selection criteria in mid_month_invites')
        return True, {}

    # get
    pending_requests = db.friendships.find({
        'state':'req',
        'to':{'$in':users_to_warn_ids}
    })

    for req in pending_requests:
        fs = Friendship(req)
        userReqs[fs.to].append(fs)

    userInfos = {}

    for _id in userReqs:

        target = userDict[_id]
        nb_reqs = len(userReqs[_id])
        if nb_reqs == 0:
            continue

        # last user is probably most recent
        others_nb = nb_reqs -1
        lastreq = userReqs[-1]
        last_user = User.get(lastreq.sender)
        userInfos[target.email] = {
            'sender' :last_user.anoname,
            'name' :target.anoname,
            'others_nb': others_nb
        }

    EmailSender.send_bulk_templated_email(userInfos, '{}_pendinginvites_fr'.format(global_vars.env))
    return True, {}



def promote_entadmin(data, db, config):

    payload = data["payload"]
    email = data["payload"]["email"]

    # check server code

    if "ent" not in payload and "org" not in payload:
        return True, {}

    _id = None

    if "ent" in payload:
        _id = payload["ent"]
    else:
        _id = payload["org"] # manage bad copy paste on server

    entity = Entity.get(_id)
    if entity is None:
        return True, {}

    if "sender" not in payload and "creator_id" in data:
        sender = User.get(data["creator_id"])
        payload["sender"] = sender.anoname

    if "entityname" not in payload:
        payload["entityname"] = entity.name

    isValid, user = checkValidEmail(data, db, email, False)

    if isValid == False:
        return False, {}

    ok = EmailSender.send_email_type([user], const.EMAIL_PROMOTE_ENTADMIN, payload )
    return ok, {}

def promote_orgadmin(data, db, config):

    payload = data["payload"]
    email = data["payload"]["email"]

    if "org" not in payload:
        return True, {}

    org = Org.get(payload["org"])
    if org is None:
        return True, {}

    if "sender" not in payload and "creator_id" in data:
        sender = User.get(data["creator_id"])
        payload["sender"] = sender.anoname

    if "orgname" not in payload:
        payload["orgname"] = org.name

    if "entityname" not in payload:
        entity = Entity.get(org.entity)
        if entity is None:
            payload["entityname"] = "<NoEntity>"
        else:
            payload["entityname"] = entity.name


    isValid, user = checkValidEmail(data, db, email, False)

    if isValid == False:
        return False, {}

    ok = EmailSender.send_email_type([user], const.EMAIL_PROMOTE_ORGADMIN, payload )
    return ok, {}

def invite_orgadmin(data, db, config):
    payload = data["payload"]
    email = payload["email"]

    if "org" not in payload:
        return True, {}

    org = Org.get(payload["org"])
    if org is None:
        return True, {}

    if "sender" not in payload and "creator_id" in data:
        sender = User.get(data["creator_id"])
        payload["sender"] = sender.anoname

    if "orgname" not in payload:
        payload["orgname"] = org.name

    if "entityname" not in payload:
        entity = Entity.get(org.entity)
        if entity is None:
            payload["entityname"] = "<NoEntity>"
        else:
            payload["entityname"] = entity.name


    isValid, user = checkValidEmail(data, db, email, False)
    ok = EmailSender.send_email_type([user], const.EMAIL_INVITE_ORGADMIN, payload )

    return ok, {}

def send_mission_report(data, db, config):

    # get all admin users

    email = data['payload']['email']
    file = data['payload']['file']

    isValid, user = checkValidEmail(data, db, email, False)

    emails = [user]
    ok = EmailSender.send_email_type(emails, const.EMAIL_MISSION_REPORT, data['payload'])

    return ok, {}


def send_delete_email(data, db, config):

    user_id = data['payload']['_id']
    user = User.get(user_id);
    if user is None:
        return True, {}
    
    email = user.email

    if users.is_fake_email(email):
        return True, {}

    claims = {
        "sub": str(user["_id"]),
        "iss": config["appname"],
        "email":email,
        "scope": ["delete_user"],
    }

    server = "http://{}:3010".format(config["domain"])
    secret = user["token"]

    encoded_jwt = jwt.encode(claims, secret, algorithm='HS256').decode("utf-8")

    logo_path = "scripts/emails/logo.png"

    link = "{}/api/confirm_delete/{}".format(server, encoded_jwt)

    SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
    RECIPIENTS = [email]
    AWS_REGION = "eu-west-1"

    SUBJECT = "Mot de passe oublie"
    BODY_TEXT = '''
    Bonjour, la reinitialisation de votre mot de passe a ete demandee. Si cette demande ne provient pas de vous, vous pouvez l'ignorer.
    Pour  {}'''.format(link)
    BODY = "Bonjour, vous avez demandé la suppression de votre compte."
    preheader = "Votre demande de supression de compte."
    color = "#03A9F4"
    light_color = "#BBDEFB"
    filename = 'scripts/emails/simple.html'
    txt = open(filename, 'r').read()
    template = Template(txt)
    data = {
        #"logo":"./emails/logo.png",
        "title":SUBJECT,
        "maintext":BODY,
        "link":link,
        "color":color,
        "light_color":light_color,
        "call_to_action":"Reinitialiser",
        "preheader":preheader
    }

    BODY_HTML = template.render(data)
    '''
    with open("scripts/emails/test.html", "w") as text_file:
        text_file.write(BODY_HTML)
        text_file.close()
        quit()
    '''

    CHARSET = "UTF-8"
    session = boto3.Session(profile_name=config["aws"])
    client = session.client('ses',region_name=AWS_REGION)

    try:
        #Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': RECIPIENTS,
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': BODY_HTML,
                    },
                    'Text': {
                        'Charset': CHARSET,
                        'Data': BODY_TEXT,
                    },
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
            ConfigurationSetName="IDH"

        )


    except ClientError as e:
        print(e.response['Error']['Message'])
        raise
    else:
        print("Email sent! Message ID:"),
        print(response['ResponseMetadata']['RequestId'])

    return True, {}


def forgotten_password(data, db, config):

    
    email = data['payload']['email']

    if users.is_fake_email(email):
        return True, {}

    user = users.get_from_email(email, db)

    if user is None:
        return True, {}

    claims = {
        "sub": str(user["_id"]),
        "iss": config["appname"],
        "email":email,
        "scope": ["reset_password"],
    }

    server = "http://{}:3010".format(config["domain"])
    secret = user["token"]

    encoded_jwt = jwt.encode(claims, secret, algorithm='HS256').decode("utf-8")

    logo_path = "scripts/emails/logo.png"

    link = "{}/api/resetpassword/{}".format(server, encoded_jwt)

    SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
    RECIPIENTS = [email]
    AWS_REGION = "eu-west-1"

    SUBJECT = "Mot de passe oublie"
    BODY_TEXT = '''
    Bonjour, la reinitialisation de votre mot de passe a ete demandee. Si cette demande ne provient pas de vous, vous pouvez l'ignorer.
    Pour  {}'''.format(link)
    BODY = "Bonjour, vous avez demande la reinitionalisation de votre mot de passe."
    preheader = "Votre demande de reinitialisation de mot de passe."
    color = "#03A9F4"
    light_color = "#BBDEFB"
    filename = 'scripts/emails/simple.html'
    txt = open(filename, 'r').read()
    template = Template(txt)
    data = {
        #"logo":"./emails/logo.png",
        "title":SUBJECT,
        "maintext":BODY,
        "link":link,
        "color":color,
        "light_color":light_color,
        "call_to_action":"Reinitialiser",
        "preheader":preheader

    }

    BODY_HTML = template.render(data)
    '''
    with open("scripts/emails/test.html", "w") as text_file:
        text_file.write(BODY_HTML)
        text_file.close()
        quit()
    '''

    CHARSET = "UTF-8"
    session = boto3.Session(profile_name=config["aws"])
    client = session.client('ses',region_name=AWS_REGION)

    try:
        #Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': RECIPIENTS,
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': BODY_HTML,
                    },
                    'Text': {
                        'Charset': CHARSET,
                        'Data': BODY_TEXT,
                    },
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
            ConfigurationSetName="IDH"

        )


    except ClientError as e:
        print(e.response['Error']['Message'])
        raise
    else:
        print("Email sent! Message ID:"),
        print(response['ResponseMetadata']['RequestId'])

    return True, {}




def send_admin_report(data, db, config):

    # get all admin users

    user_emails = []
    # get admin users
    USR_CURSOR = db.users.find({'roles':'admin'})

    for user in USR_CURSOR:
        if 'validated' in user and user['validated'] and (users.is_fake_email(user['email']) == False):
            user_emails.append(user['email'])

    # create email

    if len(user_emails) == 0:
        user_emails = ['david.hockley@gmail.com']

    ok = EmailSender.send_email_type(user_emails, const.EMAIL_ADMIN_REPORT, data["payload"])

    #,send_email(config, user_emails, _('new_admin_report.subject', 'email'), _('new_admin_report.text', 'email'),None, file)
    file = None
    if 'file' in data['payload']:
        file = data['payload']['file']

    if ok:
        try:
            os.remove(file)
        except OSError:
            pass

    return ok, {}

tasks = {
    const.JOB_VALIDATE_EMAIL:validate_email,
    const.JOB_SEND_DELETE_EMAIL : send_delete_email,
    const.JOB_WARN_USER_PROMOTED_ORGADMIN:promote_orgadmin,
    const.JOB_WARN_USER_PROMOTED_ENTADMIN:promote_entadmin,

    const.JOB_WARN_USER_INVITED_ORGADMIN:invite_orgadmin,
    const.JOB_FORGOTTEN_PASSWORD:forgotten_password,

    const.JOB_ADMIN_REPORT: send_admin_report,
    const.JOB_MISSION_REPORT: send_mission_report,
    const.JOB_CRON_MIDMONTH_INVITES:mid_month_invites, 
    const.JOB_CRON_MIDWEEK_INVITES:mid_week_invites,
    const.JOB_CRON_COME_AND_POST:come_and_post

}


if __name__ == '__main__':
    args =  sys.argv

    env = args[2]
    email = args[1]
    db, conf = mongoapi.setup(env)
    # conf = mongoapi.config

    if email == "all":
        users = db.users.find({})
        for user in users:
            if user["status"] == "created" and ("validated" not in user or user["validated"] != True):
                validate_email({'payload':user}, db, conf)
    else:
        validate_email({'payload':{'email':email}}, db, conf)