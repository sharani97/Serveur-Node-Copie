import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "likes"
class Like(Data):

    def __init__(self, obj):

        # user_id: string;
        # target_id: string;
        # target_type: string; 
        # meaning: string; // like or karma 
        # nb: number; // up or down like 

        self.user_id = None # for pylint
        self.target_id = None
        self.target_type = ""
        self.meaning = "none"
        self.nb  = 0 # for pylint
        
        super(Like, self).__init__(obj)
        self.dbtype = dbtype
        
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @staticmethod
    def create(user_id, target_id, target_type, nb=1, meaning="like"):

        data = {
            "user_id": user_id,
            "target_id": target_id,
            "target_type": target_type,
            "meaning": meaning, 
            "nb": nb 
        }

        obj = mongoapi.make_object(global_vars.db, "likes", data)
        return Like(obj)

