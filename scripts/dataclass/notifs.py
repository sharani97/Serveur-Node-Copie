import arrow
from . import Data
from gcore import const, mongoapi, global_vars
from bson.objectid import ObjectId


# this class encapsulates the logic for a mission
# it is initialized with a Mongo Object

dbtype = "notifs"
class Notif(Data):



    def __init__(self, obj):
        # date:   Date;
        # org:  string; ??
        # creator_id: string;
        # type:  string; // notif_type in client & server logic
        # state: string;
        # text: string;
        # read: boolean;   // is it read yet or not ?
        # payload: Object; // arbitrary data
        # target:  string; // _id of target user
        # subject:  string; // _id of target object (game object concerned by the notif, .e.g idea that has been liked)

        # self._id = None in parent

        self.payload = {} # for pylint
        self.text = ""
        self.target = ""
        self.subject = ""
        self.read = False
        self.nb  = 0 # for pylint
        self.res = None
        self.uri = ""
        self.rooturi = ""
        
        self.push_title = ""
        self.push_message = ""
        
        self.target_user = None
        self.creator_id = None

        super(Notif, self).__init__(obj)
        self.dbtype = dbtype

        # notif has a date that is not "created"
        if "date" not in obj:
            obj["date"] = arrow.now().format(const.DB_DATE_FMT)

        self.date_arrow = arrow.get(obj["date"])
        self.date = self.date_arrow.format(const.DB_DATE_FMT)

        self.updated_arrow = None
        self.updated = None
        if "updated" in obj:
            self.updated_arrow = arrow.get(obj["updated"])
            self.updated = self.updated_arrow.format(const.DB_DATE_FMT)


    @staticmethod
    def clearOldNotifs(_id, collection='missions'):
        # clearNotifs
        # 1. seach by payload/mission id 

        all_ids = [str(_id), ObjectId(_id)]

        all_uris = ["{}/{}".format(collection, _id), "{}/{}/".format(collection, _id)]

        if collection == 'missions':
            global_vars.db[dbtype].delete_many({
                'payload.mission_id':{'$in': all_ids}
            })

        global_vars.db[dbtype].delete_many({
            'rooturi':{'$in': all_uris}
        })

        global_vars.db[dbtype].delete_many({
            'uri':{'$in': all_uris}
        })



    @staticmethod
    def create(creator_id, notif_type, text, target, subject, uri, payload, nb=1):
        '''create generates a mongo api object from parameters then creates the dataclass

        Arguments:
            creator_id {ObjectId} -- who created the notif
            notif_type {string} -- like_warn, mission_locked etc.
            text {string} -- mission wording. Could be regenerated client side for loc reasons really
            target {ObjectId} -- which user is this for
            subject {ObjectId} -- what object is this notif talking about
            uri {string} -- path to the resource in the client
            payload {dict} -- useful arbitrary data
            nb {int} : Number of actions remaining
        '''


        # date:   Date;
        # org:  string; ??
        # creator_id: string;
        # type:  string; // notif_type in client & server logic
        # state: string; // ignore ?
        # text: string;
        # read: boolean;   // is it read yet or not ?
        # payload: Object; // arbitrary data
        # target:  string; // _id of target user
        # subject:  string; // _id of target object (game object concerned by the notif, .e.g idea that has been liked)

        # date is now

        bits = uri.split("/")
        rooturi = "{}/{}".format(bits[0], bits[1]) # for indexing purposes (delete all notifs on mission end)

        data = {
            "date":arrow.now().format(const.DB_DATE_FMT), ## now
            "creator_id":creator_id,
            "type":notif_type,
            "read": not(notif_type in const.action_notifs),
            "text":text,
            "target":target,
            "subject":subject,
            "payload":payload, ## validate payload
            "uri":uri,
            "nb":nb,
            "rooturi":rooturi
        }

        ## duh: needs saving
        obj = mongoapi.make_object(global_vars.db, "notifs", data)

        notif = Notif(obj)
        return notif

    def setRead(self, flag=True):
        self.update_field("read",flag)


    @staticmethod
    def mission_locked():
        pass