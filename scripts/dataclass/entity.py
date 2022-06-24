import arrow
from . import Data
from gcore import const, global_vars


# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "entities"
class Entity(Data):

    def __init__(self, obj):

        self.name = None

        super(Entity, self).__init__(obj)
        self.dbtype = dbtype
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass 
        
        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.entities.find_one({"_id":_id})
        if obj is None:
            return None
        return Entity(obj)