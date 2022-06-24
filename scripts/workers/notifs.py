import arrow

from bson.objectid import ObjectId
from gcore import mongoapi, users, fbase
from tasks import NotifSender, notif_types
from dataclass import User
logger = None
from loc import _

def set_logger(_logger):
    global logger
    logger = _logger

def is_notif_selected(_user, notif_type):

    if notif_type not in notif_types:
        logger.warn("notif {} not in notif types".format(notif_type))
        return True

    cat = notif_types[notif_type]

    if isinstance(_user, dict):
        user = User(_user)
    else:
        user = _user

    if 'notifs' not in user.settings:
        return True

    if cat not in user.settings['notifs']:
        return True

    return user.settings['notifs'][cat]


def send_notif(db, target, title: str, msg: str, payload: dict):

    notif_type = payload['type']

    doSend = is_notif_selected(target, notif_type)

    if doSend == False:
        ## could only send data notif / needs check
        return

    badtokens = []
    goodtokens = []

    #logger.info("sending notif {}:{}".format(title, msg))
    #logger.info("payload : ", payload)

    if isinstance(target, dict):
        target = User(target)

    #if "notificationTokens" not in target:
    #    return

    badge_nb = target.getNbUnreadActionNotifs()


    for tokenData in target.notificationTokens:
        if "device" in tokenData:
            logger.info("try sending notif to {}:{}".format(target["_id"], tokenData["token"]))

            ## this needs to be mocked/patched in tests
            status = fbase.sendUserANotification(tokenData["token"], msg, title, payload, badge_nb)
            if status == "Requested entity was not found.":
                badtokens.append(tokenData)
            else:
                goodtokens.append(tokenData)

    if len(badtokens) > 0:
        target.data["notificationTokens"] = goodtokens
        target.save()

