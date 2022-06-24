
import arrow

from bson.objectid import ObjectId
from gcore import mongoapi, users, fbase, const, global_vars
from loc import _


from dataclass import User, Notif, Post, Mission

badges = {
    "mission" : [const.NOTIF_MISSION_LOCKED, const.NOTIF_USER_COMMENTED_MISSION],
    "suggestion": [const.NOTIF_USER_POSTED],
    "friends": [const.NOTIF_FRIENDSHIP_REQUEST, const.NOTIF_USER_MESSAGED]
}

notif_types = {
    const.NOTIF_MISSION_LOCKED: "mission",
    const.NOTIF_MISSION_FINISHED: "mission",
    const.NOTIF_USER_MESSAGED: "chat",
    const.NOTIF_FRIENDSHIP_REQUEST:  "friends",
    const.NOTIF_FRIENDSHIP_ACCEPTED: "friends",
    const.NOTIF_USER_COMMENTED_MISSION: "mission",   ## yeah but is it ?
    const.NOTIF_USER_COMMENTED_IDEA: "mission",   ## yeah but is it ?
    const.NOTIF_USER_COMMENTED_SUGGESTION: "mission",   ## yeah but is it ?

    const.NOTIF_USER_COMMENTED: "ideas",             ## yeah but is it ?
    const.NOTIF_USER_SUGGESTED: "ideas",             ## yeah but is it ?

    "karma_friend": "friends",
    "karma_generic": "friends",
    "karma_comment": "idea",
    "karma_comments": "idea",
    "karma_idea": "idea",
    "karma_post": "mission",
    "user_liked": "friends",
    "like_generic": "friends",
    "like_comment": "idea",
    "like_idea": "idea",
    "like_post":"mission",
    "like_suggestion":"idea",
    const.NOTIF_USER_POSTED:"mission",
    const.NOTIF_MISSION1_THANKYOU:"mission",
    const.NOTIF_MISSION1_CALLING:"mission",
    const.NOTIF_MISSION2_THANKYOU:"mission",
    const.NOTIF_MISSION2_CALLING:"mission",
    const.NOTIF_MISSION3_THANKYOU:"mission",
    const.NOTIF_MISSION3_CALLING:"mission",
    const.NOTIF_MISSION_LOCKED_CALLING:"mission",


}

badge_notifs = const.action_notifs

config = None
db = None
logger = None

def setup(_config, _db, _logger):
    global config, db, logger
    config = _config
    db = _db
    logger = _logger

class NotifSender():


    @staticmethod
    def is_notif_selected(_user, notif_type):

        if notif_type not in notif_types:
            logger.warn("notif {} not in notif types".format(notif_type))
            return True

        if isinstance(_user, dict):
            user = User(_user)
        else:
            user = _user

        cat = notif_types[notif_type]
        return user.isNotifActive(cat)

    @staticmethod
    def get_user_unread(user_id):
        return global_vars.db.notifs.count({
            "target":user_id,
            "read":False,
            "notif_type":{"$in":badge_notifs}
        })

    @staticmethod
    def blank_push_payload(notif_type, resource, target_id, uri=None, subject_id=None, subject_type=None ):
        if uri is None:
            uri = "{}/{}".format(resource, str(target_id))
        ret = {
            "type":notif_type,
            "_id":str(target_id),
            "uri": uri,
            "res":resource
        }
        if subject_id is not None:
            ret["subject"] = str(subject_id)
        if subject_type is not None:
            ret["subject_type"] = subject_type

        return ret


    @staticmethod
    def blank_notif(notif_type, sender_id, message, uri, payload, subject=None ):
        return {
            "creator_id":sender_id,
            "type":notif_type,
            "read":not(notif_type in const.action_notifs),
            "text":message,
            "uri": uri,
            "subject":subject,
            "payload":payload,
            "date":arrow.now().format(const.DB_DATE_FMT)
        }




    @staticmethod
    def send_notif(_user, notif_type, title, msg, payload):

        '''
        Params:
            user: The target user (a User)
        '''



        doSend = NotifSender.is_notif_selected(_user.data, notif_type)

        if doSend == False:
            ## could only send data notif / needs check
            return

        badtokens = []
        goodtokens = []

        badge_nb = _user.getNbUnreadActionNotifs()


        if _user.notificationTokens is None:
            return

        for tokenData in _user.notificationTokens:
            if "device" in tokenData:
                #logger.info("try sending notif to {}:{}".format(user._id, tokenData["token"]))

                ## this needs to be mocked/patched in tests
                status = fbase.sendUserANotification(tokenData["token"], msg, title, payload, badge_nb)
                if status == "Requested entity was not found.":
                    badtokens.append(tokenData)
                else:
                    goodtokens.append(tokenData)

        if len(badtokens) > 0:
            _user.setNotificationTokens(goodtokens)
            _user.save(db)

    @staticmethod
    def send_notif_type(_user, notif_type, payload, locdata, domain='friends'):
        title           = _(notif_type+'.title',domain, locdata)
        push_message    = _(notif_type+'.push',domain, locdata)
        NotifSender.send_notif(_user, notif_type, title, push_message, payload)

    @staticmethod
    def send_notif_object(notif, push_payload):
        NotifSender.send_notif(notif._user, notif.notif_type,
            notif.push_title, notif.push_message, push_payload)

    @staticmethod
    def get_loc(notif_type:str, locdata:dict, namespace='notifs'):
        title           = _(notif_type+'.title',namespace, locdata)
        push_message    = _(notif_type+'.push',namespace, locdata)
        message         = _(notif_type+'.message',namespace, locdata)
        return title, push_message, message

    @staticmethod
    def user_posted(users, post:Post, sender:User):
        '''
            Nouvelle mission !
            Vous êtes invités à rejoindre une mission {mission_type} : {mission_title}
            ingame: {inviter} vous a invité à une mission de type {mission_type} : {mission_title}

            Params:
                users: an array of User
                mission: a mission
                inviter: the inviting user

        '''
        notif_type = const.NOTIF_USER_POSTED
        locdata = {
            "actor":sender.anoname,
            "object_title":post.title,
        }

        title, push_message, message = NotifSender.get_loc(notif_type, locdata)

        # "uri":uri
        uri = post.uri

        payload = NotifSender.blank_push_payload(notif_type, "posts", post._id, post.uri)

        data = NotifSender.blank_notif(notif_type, sender._id, message, uri, payload)

        for user in users:

            if "_id" in data:
                del data["_id"]

            data["target"] = user["_id"]
            notif = Notif(mongoapi.make_object(db, "notifs", data))
            payload["notif_id"] = str(notif['_id'])
            NotifSender.send_notif(user, notif_type, title, push_message, payload)

    @staticmethod
    def mission_locked(users, mission, inviter):

        '''
            Nouvelle mission !
            Vous êtes invités à rejoindre une mission {mission_type} : {mission_title}
            ingame: {inviter} vous a invité à une mission de type {mission_type} : {mission_title}

            Params:
                users: an array of User
                mission: a mission
                inviter: the inviting user

        '''

        notif_type = const.NOTIF_MISSION_LOCKED
        ressource = "missions"

        locdata = {
            "inviter":inviter.anoname,
            "mission_type": mission.loctype,
            "mission_title":mission.title,
        }

        title           = _(notif_type+'.title','friends', locdata)
        push_message    = _(notif_type+'.push','friends', locdata)
        message         = _(notif_type+'.message','friends', locdata)

        # "uri":uri
        uri = "missions/{}/".format(str(mission._id))

        payload = {
            "mission_id":str(mission._id),
            "start_date":mission.start_date.datetime
        }

        data = NotifSender.blank_notif(notif_type, inviter._id, message, uri, payload)

        for user in users:

            if "_id" in data:
                del data["_id"]

            data["target"] = user["_id"]
            notif = mongoapi.make_object(db, "notifs", data)

            push_payload = NotifSender.blank_push_payload(notif_type, ressource, mission._id, uri )
            push_payload["notif_id"] = str(notif['_id'])

            NotifSender.send_notif(user, notif_type, title, push_message, push_payload)

    @staticmethod
    def mission3_active(_user:User, _mission:Mission, _points:int):

        notif_type = const.NOTIF_MISSION_FINISHED
        points = _user.points + _user.new_points
        if points == 0:
            return
        locdata = {
            "mission_type": _mission.loctype,
            "mission_title":_mission.title,
            "points" : points,
        }

        NotifSender.send_notif_type(_user, notif_type, {}, locdata)
        pass


    @staticmethod
    def mission_finished(_user, _mission):

        notif_type = const.NOTIF_MISSION_FINISHED
        points = _user.points + _user.new_points
        if points == 0:
            return
        locdata = {
            "mission_type": _mission.loctype,
            "mission_title":_mission.title,
            "points" : points,
        }

        NotifSender.send_notif_type(_user, notif_type, {}, locdata)
        pass