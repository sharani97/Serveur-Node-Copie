import arrow
from . import Data
from gcore import const

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 

REWARD_TYPES = ['ap', 'ip', 'kp']

dbtype = "rewards"
class Reward(Data):

    def __init__(self, _type = None, conf = None, **kwargs): # _type = None, conf = None, values=None):
        
        # could be automated with types but pylint looses track 
        self.ap = kwargs.get('ap', 0)
        self.ip = kwargs.get('ip', 0)
        self.kp = kwargs.get('kp', 0)

        self.config = kwargs.get('config', conf)
        self.type = kwargs.get('type', _type)
        values = kwargs.get('values', None)
        
        _reward = {}
        if self.type is not None and self.config is not None:
            _reward = self.config["rewards"][self.type]
        else:
            if values is not None:
                _reward = values

        for rt in REWARD_TYPES:
            if rt in _reward:
                setattr(self, rt, _reward[rt])


    def toDict(self):

        ret = {}
        for rt in REWARD_TYPES:
            ret[rt] = self.__getattribute__(rt)
        return ret 

    def toList(self):
        ret = []
        for cat in REWARD_TYPES:
            amount = self.__getattribute__(cat)
            if amount != 0:
                ret.append({"cat":cat, "nb":amount})
    
        return ret

    def clone(self, factor=1):
        return Reward(values=self.toDict())

    def scale(self, factor=1):
        for rt in REWARD_TYPES:
            self.__setattr__(rt, round(getattr(self, rt)*factor, 1))



    


    