import arrow
import random 

from gcore import mongoapi
from dataclass import User, Org, Mission
from typing import List, Dict

ISO_DATE_FMT = "YYYY-MM-DD HH:mm:ss"


config = None 
db = None 
logger = None 

def setup(_config, _db, _logger):
    global config, db, logger
    config = _config 
    db = _db
    logger = _logger 


class Util():

    def __init__(self, _config, _db, _logger):
        setup(_config, _db, _logger)
        pass 

    @staticmethod
    def clearDb():
        db.jobs.delete_many({})
        db.points.delete_many({})
        db.organizations.delete_many({})
        db.ideas.delete_many({})
        db.votes.delete_many({})
        db.orders.delete_many({})
        db.likes.delete_many({})
        db.orgs.delete_many({})
        db.missions.delete_many({})
        db.comments.delete_many({})
        db.files.delete_many({})
        db.notifs.delete_many({})
        db.points.delete_many({})
        
        db.users.delete_many({
            'username':{'$ne':'JOBS_TOOL'}
        })
    
    @staticmethod
    def makeRandomDate(start, end):
        diff = (end - start).total_seconds()
        rand = random.randint(1,diff)
        return start.shift(seconds=rand)

    @staticmethod
    def makeDates(start, end, nb=1):
        diff = (end - start).total_seconds()
        dif2 = diff/(nb+1)
        ret = []
        for i in range(1, nb+1):
            ret.append(start.shift(seconds=i*dif2))

        return ret

    @staticmethod
    def createTestUser(id, roles = []):

        user = db.users.find_one({
            'id':id
        })

        if user is None:
            user =  mongoapi.create_user(id, "{}@test.org".format(id), roles, 'created', True)

        return user

    @staticmethod
    def createTestOrg(admins = [], other_users=[], settings = None, entity = None):
        
        org = db.orgs.find_one({
            'id':'test_org'
        })

        if not org is None:
            return org

        org_admins = []
        members = []

        if settings is None:
            settings = config['settings']

        for usr in admins:
            if usr['_id'] not in org_admins:
                org_admins.append(usr['_id'])
                members.append(usr['_id'])

        for usr in other_users:
            if usr['_id'] not in members:
                members.append(usr['_id'])


        org_data = {
            'name':'test org',
            'id':'test_org',
            'lowername':'test org',
            'admins':org_admins, 
            'members':members,
            'settings':settings
        }
        
        return mongoapi.make_object(db, "organizations", org_data)

    @staticmethod
    def createPhase(phaseNb, currentPhaseNb, active = True, phase_length=2):

        utc = arrow.utcnow() #.datetime

        #just finished or about 
        # [-1,1], [1,3] [3,5]
        # [-3,-1], [-1,1] [1,2]
        # [-5,-3], [-3,1-1] [-1,1]

        #just finished or about 
        # [-1,1], [1,3] [3,5]
        # [-3,-1], [-1,1] [1,2]
        # [-5,-3], [-3,1-1] [-1,1]

        phaseOffset = (phaseNb - currentPhaseNb)
        secondsOffset = 0 
        addedOffset = 0 
        if active:
            addedOffset = phase_length/2
        else:
            secondsOffset = -30

        # if phaseNb == currenPhaseNb 
        # phaseOffset = 0 
        # start = 2*(0 - 1) + 1 = - 1 
        # end = 0 + 1 = 1 

        # if phaseNb == currenPhaseNb - 1
        # phaseOffset = -1 
        # start = 2*(-1 - 1) + 1 = - 3 
        # end = 2*(-1)  + 1 = - 1 
        
        # if phaseNb == currenPhaseNb + 1
        # phaseOffset = +1 
        # start = 2*(+1 - 1) + 1 = 1 
        # end = 2*(+1)  + 1 = 3 
        
        start = utc.shift(days = (phaseOffset-1)*phase_length + addedOffset).naive
        end   = utc.shift(days = phaseOffset*phase_length + addedOffset).shift(seconds=secondsOffset).naive

        state = "ready" 

        if phaseOffset < 0:
            state = "finished"

        if phaseOffset > 0:
            state = "pending"

        return {
            'start': start,
            'end':end,
            'active':True, 
            'state':state                    
        }

    @staticmethod
    def createTestMission(
                        org:Org, orgadmin:User, members:List[str] = [],
                        phaseNb = 1, ongoing = True,
                        **kwargs
                        ):
        """Create a test mission.. for testing purposes
        
        Arguments:
            org {Org} -- The org the mission is created in
            orgadmin {User} -- the creating orgadmin
        
        Keyword Arguments:
            members {List[str]} -- a list of user ids (default: {[]})
            phaseNb {int} -- the mission current phase (default: {1})
            ongoing {bool} -- is the mission currenly ongoing ?(default: {True})
        
        Returns:
            {dict} -- the created mission
        """

        timeLeft=kwargs.get('timeLeft', 2*3600 + 30)
        phaseLength=kwargs.get('phaseLength', 2)
        phaseActive=kwargs.get('ongoing', ongoing)
        time_offset=kwargs.get('time_offset', 30)
        settings=kwargs.get('setting', {"sell_penalty":5, "start_credits":10000})

        utc = arrow.utcnow() #.datetime

        user_ids = list(map(lambda x: x['_id'], members))

        mission_data = {
            'org':org['_id'],
            'creator_id':orgadmin['_id'],
            'title':'test mission',
            'description':'test mission description',
            'start_credits':settings["start_credits"],
            'state':'locked',
            'sell_penalty':settings["sell_penalty"],
            'auto':False,
            'members':user_ids,
            "accepted":user_ids
            }
        
        phases = ["phase1", "phase2", "phase3"]
        for i in range(0,3):
            phase = i + 1
            mission_data[phases[i]] = Util.createPhase(phase,phaseNb, ongoing, phaseLength)
        
        return mongoapi.make_object(db, "missions", mission_data)

    @staticmethod
    def makeIdea(mission:dict, user:dict, created=None, nb=1, phase = 1):
        '''Make an idea in a mission
        
        Arguments:
            mission {dict} -- target mission
            user {dict} -- creating user
        
        Keyword Arguments:
            created {Date} -- [creation date] (default: {None})
            nb {int} -- [description] (default: {1})
            phase {int} -- [description] (default: {1})
        
        Returns:
            [type] -- [description]
        '''




        if created is None:
            created = arrow.now()

        data = {
            'mission_id':mission['_id'],
            'title':'idea {}'.format(nb),
            'description':'idea desc {}'.format(nb),
            'created':created.format(ISO_DATE_FMT),
            'phase':phase,
            'price':1,
            'creator_id':user['_id'],
            'active':True
        }
        return mongoapi.make_object(db, "ideas", data)


    @staticmethod
    def makeRandomIdeas(mission:dict, users, nb=1, phase=1):
        '''Create a set of random ideas
        
        Arguments:
            mission {dict} -- target mission 
            users {[type]} -- [description]
        
        Keyword Arguments:
            nb {int} -- [description] (default: {1})
            phase {int} -- [description] (default: {1})
        
        Returns:
            [type] -- [description]
        '''


        user_count = len(users)
        ideas = []

        phase_data = mission["phase{}".format(phase)]

        start = arrow.get(phase_data['start'])
        end = arrow.get(phase_data['end'])

        diff = end - start 
        hours = diff.total_seconds() // 3600

        random.seed(1)

        for i in range(nb):

            #utc.shift(days=offset
            created  = start.shift(hours = random.randint(1, hours))
            ideas.append(Util.makeIdea(mission, users[i % user_count],created, i, phase))
        return ideas

    @staticmethod
    def makeVote(idea, user, skew = 0, created=None, amount=None):

        if amount is None:
            _min = max(-1, -1 + skew)
            _max = min(2, 2 + skew)
            amount = random.randint(_min,_max)

        return mongoapi.make_object(db, "votes", {
            'target_id':idea['_id'],
            'voter_id':user['_id'],
            'created':created.format(ISO_DATE_FMT),
            'vote_nb':amount
        })

    @staticmethod
    def makeRandomIdeaVotes(mission, users, idea, skew = 0, start=None, end=None, nb=None):
        # the max number of votes possible if #users * #ideas 
        max_votes = len(users)
        if nb is None or nb > max_votes:
            nb = max_votes

        _diff = arrow.get(end) - arrow.get(start)    
        length = int(_diff.total_seconds())

        if nb == max_votes:
            voting_users = users
        else:
            voting_users = random.sample(users, nb)
        votes = []

        for user in voting_users:
            created = start.shift(seconds=random.randint(0,length))
            votes.append(Util.makeVote(idea, user, skew, created, None))

        return votes
    
    @staticmethod
    def makeOrder(_creds, user, idea, user_nb, total_credits, mission_id, created):
        # increase the price 
        # (later) save the idea 
        factor = 10

        if (user_nb < 20):
            factor = 5
        
        if (user_nb < 10):
            factor = 2


        nominal_price = 1
        price_change = factor*_creds/(total_credits*user_nb)

        price = idea["price"]

        # make order 


        idea["price"] += price_change
        idea["dirty"] = True

        return mongoapi.make_object(db, "orders", {
            "buyer_id" : user["_id"],
            "target_id" : idea["_id"], 
            "currency" : mission_id, # mission id
            "buy_nb": _creds,
            "price": price ,
            "created":created.format(ISO_DATE_FMT)
        })



    @staticmethod
    def makeRandomOrdersAndSuggestions(mission, users, ideas):
        
        # get mission credits 
        print(mission["start_credits"])
        total_credits = mission["start_credits"]
        _select = 3
        if len(ideas) < 4:
            _select = 1 

        mission_id = mission["_id"]

        def make(idea, user, buy_nb, suggest_nb_range):
            nb = random.randint(0,suggest_nb_range)
            _start = arrow.get(idea["created"])
            _end = arrow.get(mission["phase3"]["end"])
            orderDate = Util.makeDates(_start, _end, 1)

            Util.makeOrder(buy_nb, user, idea, len(users), total_credits, mission_id, orderDate[0])
            Util.makeRandomSuggestions(idea, "idea", user, _start, _end, nb)

        # for each user, split among ideas
        for user in users:
            
            # select one idea and invest half my credits on it, invest the rest on the rest
            _subideas = random.sample(ideas, _select)

            if _select == 1:
                # make an order on the one 
                make(_subideas[0], user, total_credits, 4)

            else:
                ## 1/2 + 1/3 = 3/6 + 2/6 = 5/6
                make(_subideas[0], user, total_credits/2, 4)
                make(_subideas[1], user, total_credits/3, 2)
                make(_subideas[2], user, total_credits/6, 1)

    @staticmethod
    def makeRandomVotes(mission, users, ideas, nb=None, start=None, last=None):
        # the max number of votes possible if #users * #ideas 
        max_votes = len(users) * len(ideas)
        #if nb is None or nb > max_votes: #let's manage this later ok ?
        nb = max_votes
        
        nb_per_idea = len(users)

        votes = []

        for idea in ideas:
            skew = random.randint(-1,2)
            votes += Util.makeRandomIdeaVotes(mission, users, idea, skew, start, last, None)

        return votes

    @staticmethod
    def makeTestOrder(mission, idea, user, nb, price):

        # create orders
        return mongoapi.make_object(db, "orders", {
            'target_id':idea['_id'],
            'buyer_id':user['_id'],
            'currency':mission['_id'],
            'price':price, 
            'buy_nb':nb
        })

    @staticmethod
    def makeRandomSuggestions(target, target_type, user, start, end, nb=1):

        dates = Util.makeDates(start, end, nb)
        ret = []
        for n in range(0,nb):
            ret.append(mongoapi.make_object(db, 'comments', {
                    'creator_id':  user["_id"],
                    'target_id':   target['_id'],
                    'target_type': target_type, 
                    'title':       "Suggestion {}".format(n), 
                    'suggest':     True,
                    'created':     dates[n].format(ISO_DATE_FMT)
                }))
        return ret

    @staticmethod
    def makeRandomComments(target, target_type, users, start, end, nb=1, suggest = False):

        ret = []
        
        dates = Util.makeDates(start, end, nb)

        if suggest is None:
            suggest = False

        if len(users) == 0:
            return ret

        for n in range(0,nb):
            user = random.sample(users,1)[0]
            if user is not None:
                # pylint: disable=E1136
                ret.append(mongoapi.make_object(db, 'comments', {
                    'creator_id':  user["_id"],
                    'target_id':   target['_id'],
                    'target_type': target_type, 
                    'title':       "comment {}".format(n), 
                    'suggest':     suggest,
                    'created':     dates[n].format(ISO_DATE_FMT)
                }))

        return ret




        
