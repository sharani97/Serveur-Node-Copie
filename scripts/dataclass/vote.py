import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "votes"
class Vote(Data):

    def __init__(self, obj):

        #voter_id: string;
        #target_id: string;
        #vote_nb: number;

        self.voter_id = None # for pylint
        self.target_id = None
        self.vote_nb  = 0 # for pylint
        
        super(Vote, self).__init__(obj)
        self.dbtype = dbtype
        
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @staticmethod
    def create(voter_id, target_id, nb=1):

        data = {
            "voter_id": voter_id,
            "target_id": target_id,
            "vote_nb": nb
        }

        obj = mongoapi.make_object(global_vars.db, dbtype, data)
        return Vote(obj)

