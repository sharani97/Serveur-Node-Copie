import arrow
from . import Data
from gcore import const, global_vars


# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "organizations"
class Org(Data):

    def __init__(self, obj):

        self.name = None
        self.entity = None
        super(Org, self).__init__(obj)
        self.dbtype = dbtype
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass 
        
        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.organizations.find_one({"_id":_id})
        if obj is None:
            return None
        return Org(obj)