import arrow
from . import Data
from gcore import const, mongoapi, global_vars
from loc import _

# this class encapsulates the logic for a mission
# it is initialized with a Mongo Object

class Phase(Data):

    def __init__(self, obj):

        self.active = False
        self.state = 'pending'
        self.nb = -1

        super(Phase, self).__init__(obj)
        self.startDate = arrow.get(obj["start"])
        self.endDate = arrow.get(obj["end"])

        _diff = self.endDate  - self.startDate
        self.length = _diff.total_seconds()
        self.days = (self.length)/(24 * 3600)

    @property
    def time_left(self):
        now = arrow.now()
        diff = self.endDate  - now
        return max(diff.total_seconds()/(24*3600),0)

    @property
    def isFinished(self):
        return self.state == 'finished'

    @property
    def isReady(self):
        return self.state == 'ready'

    @property
    def isOver(self):

        if self.isFinished:
            return True

        if self.state == 'ready' and self.endDate > arrow.now():
            return False

        return True


    @property
    def isActive(self):
        if self.active == False or self.state != 'ready':
            return False

        if self.startDate > arrow.now() or self.endDate < arrow.now():
            return False
        return True

    @property
    def loctype(self):
        return _("phases.phase{}".format(self.nb), "mission")

dbtype = "missions"

class Mission(Data):

    @staticmethod
    def get_orders_CURSOR(mission_id):
        ideas = Mission.get_ideas_CURSOR(mission_id)
        idea_ids = []
        for idea in ideas:
            idea_ids.append(idea['_id'])

        return global_vars.db.orders.find({
            'target_id':{'$in':idea_ids}
        })

    @staticmethod
    def get_votes_CURSOR(mission_id):

        ideas = Mission.get_ideas_CURSOR(mission_id)
        idea_ids = []
        for idea in ideas:
            idea_ids.append(idea['_id'])

        return global_vars.db.votes.find({
            'target_id':{'$in':idea_ids}
        })

    @staticmethod
    def get_ideas_CURSOR(mission_id):
        return global_vars.db.ideas.find({
            'mission_id':mission_id
        })

    @staticmethod
    def count_ideas(mission_id):
        return global_vars.db.ideas.count({
            'mission_id':mission_id
        })

    def __init__(self, obj):

        self.accepted = [] # for pylint
        self.members  = [] # for pylint
        self.stats = {}
        self.org = ""
        self.creator_id = None
        # self._id = None in parent
        self.title = None
        self.pseudos = False

        self.start_credits = -1
        self.sell_penalty = -1

        self.state = None

        super(Mission, self).__init__(obj)
        self.dbtype = dbtype

        self.phases = []

        self.phase1 = Phase(obj["phase1"])
        self.phase1.nb = 1
        self.phases.append(self.phase1)

        self.phase2 = Phase(obj["phase2"])
        self.phase2.nb = 2
        self.phases.append(self.phase2)


        self.phase3 = Phase(obj["phase3"])
        self.phase3.nb = 3
        self.phases.append(self.phase3)

        self.phase = self.currentPhase

        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DB_DATE_FMT)



    @property
    def isActive(self):
        for phaseNb in [0,1,2]:
            phase = self.phases[phaseNb]
            if phase.isActive:
                return True
        return False

    @property
    def isFinished(self):
        ## all phases are finished
        for phaseNb in [0,1,2]:
            phase = self.phases[phaseNb]
            if phase.isOver == False:
                return False
        return True 

    @property
    def currentPhase(self):
        latestPhase = None
        for phaseNb in [0,1,2]:
            phase = self.phases[phaseNb]
            if phase.isReady:
                return phase
            if phase.isFinished:
                latestPhase = phase
        # no active phase
        return latestPhase

    @property
    def loctype(self):
        return self.phase.loctype

    @property
    def time_left(self):
        return self.phase.time_left

    @property
    def start_date(self):
        return self.phase.startDate

    def addStatsLine(self, date, stats):
        self.stats[date] = stats

    def setStatsValue(self, date, key, value):
        self.stats[date][key] = value


    def save(self):
        print("calling Mission.save (but not doing anything)")

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass

        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.missions.find_one({"_id":_id})
        if obj is None:
            return None
        return Mission(obj)