import arrow
from . import Data
from gcore import users, mongoapi, global_vars, const


class Friendship(Data):
    def __init__(self, obj):

        self.sender = obj["from"]
        self.to = obj["to"]
        self.state = obj["state"]
        self.data = obj
        self.dbtype = "friendships"

    @staticmethod
    def create(usr_id1: str, usr_id2: str, state="ok"):
        data = {
            "from": usr_id1,  # now
            "to": usr_id2,
            "state": "ok"
        }

        # duh: needs saving
        obj = mongoapi.make_object(global_vars.db, "friendships", data)

        return Friendship(obj)


dbtype = "users"


class User(Data):

    def __init__(self, obj):

        self.accepted = False
        self.firstname = obj["id"]
        self.lastname = ""
        self.activity = {}
        self.settings = {}
        self.priceDict = None
        self.validated = False
        self.email = None
        # self._id = None in parent
        self.username = None

        self.ap = 0
        self.ip = 0
        self.kp = 0
        self.new_ap = 0
        self.new_ip = 0
        self.new_kp = 0
        self.notificationTokens = []
        self.settings = {}
        self.anonymous = False

        self.last_connexion = None
        self.created_date = None
        self.updated_date = None

        self.last_connexion_arrow = None
        self.created_arrow = None
        self.updated_arrow = None


        super(User, self).__init__(obj)
        self.dbtype = dbtype

        if "anon" in self.settings:
            self.anonymous = self.settings["anon"]

        self.isFake = users.is_fake_email(obj['email'])

        if "first_name" in obj:
            self.firstname = obj["first_name"]

        self["firstname"] = self.firstname

        if "name" in obj:
            self.lastname = obj["name"]

        self["lastname"] = self.lastname

        if 'last_connexion' in obj:
            self.last_connexion_arrow = arrow.get(obj["last_connexion"])
            self.last_connexion = self.last_connexion_arrow.format(const.DEFAULT_FMT)

        if 'created' in obj:
            self.created_arrow = arrow.get(obj["created"])
            self.updated_date = self.created_arrow.format(const.DEFAULT_FMT)

        if 'updated' in obj:
            self.updated_arrow = arrow.get(obj["created"])
            self.created_date = self.updated_arrow.format(const.DEFAULT_FMT)

        self.fullname = "{} {}".format(self.firstname, self.lastname)

    def addActivity(self, atype, obj):
        if atype not in self.activity:
            self.activity[atype] = []
        self.activity[atype].append(obj)

    def getNbUnreadActionNotifs(self):

        notifs = global_vars.db.notifs.find({
            'read' : False,
            'type' :  {"$in":const.action_notifs}
        })

        done = []

        for notif in notifs:
            if "uri" in notif and "type" in notif:
                _id = '{}/{}'.format(notif["uri"], notif["type"])
                if _id not in done:
                    done.append(_id)

        return len(done)

    def get_activity_nb(self, typ):
        if typ not in self.activity:
            return 0
        return len(self.activity[typ])

    def save(self, db=None):
        if db is None:
            db = global_vars.db
        mongoapi.update_object(db, "users", self.data)

    def setNotificationTokens(self, values):
        self.data["notificationTokens"] = values

    def isNotifActive(self, cat):

        if 'notifs' not in self.settings or self.settings['notifs'] is None:
            return True

        if cat not in self.settings['notifs']:
            return True

        return self.settings['notifs'][cat]

    def get_available_credits(self, mission_id=None):

        total = 0
        pts = global_vars.db.points.find({
            'user':self._id,
            'type':'gp',
            'dom':mission_id
        })

        for pt in pts:
            total += pts['amount']

        return total




    def getName(self, forceAnon = False):
        if forceAnon:
            return self.username
        else:
            return self.fullname

    @property
    def last_cnx_arrow(self):

        if self.last_connexion_arrow is not None:
            return self.last_connexion_arrow

        if self.updated_arrow is not None:
            return self.updated_arrow

        # which might also be None
        return self.created_arrow

    def get_days_away(self, now_arrow = None):
        '''How long have we not seen this user ?

        Arguments:
            now_arrow {arrow} -- Now as an arrow format, defaults to arrow.now if not provided
        '''
        if now_arrow is None:
            now_arrow = arrow.now()

        diff = now_arrow - self.last_cnx_arrow
        return diff.days

    @property
    def days_away(self):
        return self.get_days_away()

    @property
    def points(self):
        return self.ap +  self.ip + self.kp

    @property
    def new_points(self):
        return self.new_ap +  self.new_ip + self.new_kp

    @property
    def nb_ideas(self):
        return self.get_activity_nb("ideas")

    @property
    def nb_votes(self):
        return self.get_activity_nb("votes")

    @property
    def nb_likes(self):
        return self.get_activity_nb("likes")

    @property
    def nb_suggestion_likes(self):
        return self.get_activity_nb("suggestion_likes")

    @property
    def nb_orders(self):
        return self.get_activity_nb("orders")

    @property
    def nb_comments(self):
        return self.get_activity_nb("comments")

    @property
    def nb_suggestions(self):
        return self.get_activity_nb("suggestions")

    @property
    def anoname(self):
        if self.anonymous:
            return self.username
        else:
            return self.fullname

    @property
    def investment(self):
        creds = 0
        if "orders" not in self.activity:
            return 0
        for order in self.activity["orders"]:
            creds += order["buy_nb"]
        return creds

    @property
    def uri(self):
        return "users/{}".format(self._id)

    @property
    def profit(self):

        if "orders" not in self.activity:
            return 0

        _profit = 0

        for order in self.activity["orders"]:
            _profit += order.profit

        return _profit
        ## alert / pybase / save ?

    @property
    def profit_pct(self):

        if self.investment == 0:
            return 0
        return self.profit/self.investment

    def reward(self, reward, new=False):
        self.ap += reward.ap
        self.ip += reward.ip
        self.kp += reward.kp

        if new:
            self.new_ap += reward.ap
            self.new_ip += reward.ip
            self.new_kp += reward.kp

    def get_friends(self, exclusion_list = []):

        friendships = global_vars.db.friendships.find({
            "$or":[{"to":self._id, "state":'ok'}, {"from":self._id, "state":'ok'}]
        })

        friend_ids = []
        for fs in friendships:
            friend = Friendship(fs)
            _id = None

            if friend.to == self._id:
                _id = friend.sender
            else:
                _id = friend.to

            if _id not in exclusion_list:
                friend_ids.append(_id)

        return User.gets(friend_ids)


    def isGoodEmail(self):

        email = self.email.lower()
        if "@" not in email:
            return False
        bits = email.split("@")
        _id = bits[0]
        domain = bits[1].split(".")[0]

        if domain in ['test', 'fake']:
            return False

        # merci jim...
        if domain == "free" and _id[:2] == "jim":
            return True

        return False

    def checkValidEmail(self, need_validated = True):

        if self.validated:
            return True

        if not self.isGoodEmail():
            return False

        if need_validated:
            return False

        return True

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass

        Arguments:
            _id {ObjectId} -- user _id
        '''
        _user = global_vars.db.users.find_one({"_id":_id})
        if _user is None:
            return None
        return User(_user)

    @staticmethod
    def gets(_idlist):
        '''gets mongo api object from list and creates the dataclass

        Arguments:
            _idlist:List of ObjectIds -- user _id list
        '''
        _users = global_vars.db.users.find({"_id":{'$in':_idlist}})
        user_list = []
        for user in _users:
            user_list.append(User(user))
        return user_list

    @staticmethod
    def create(first:str, last:str, username:str, email:str, roles=[], status="pending", settings={}):

        '''_id:         string;
        first_name:  string;
        name:        string;
        username:    string;
        email:       string;
        token:       string;
        gtoken:      string;
        auth_type:   string;
        google_id:   string;
        status:      string;
        profileUrl:  string;
        settings:Object;
        validated:boolean;
        notificationTokens :Array<TokenData>;
        roles: Array<string>;
        '''

        data = {
            "first_name":first,
            "name":last,
            "username":username,
            "id":username.lower(),
            "email":email,
            "roles":roles,
            "settings":settings,
            "status":"pending",
            "validated":False
        }

        obj = mongoapi.make_object(global_vars.db, "users", data)
        return User(obj)