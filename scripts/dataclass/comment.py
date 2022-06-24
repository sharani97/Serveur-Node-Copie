import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "comments"
class Comment(Data):

    def __init__(self, obj):
        
        # creator_id:  string;
        # target_id:   string;
        # target_type: string;
        # title:       string; 
        # description: string; 
        # suggest:     boolean; 

        self._id = None
        self.creator_id = None # for pylint
        self.target_id = None
        self.target_type = ""
        self.title = "none"
        self.suggest  = False # for pylint
        
        super(Comment, self).__init__(obj)
        self.dbtype = dbtype

        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @staticmethod
    def create(creator:str, target_id:str, target_type:str, title:str, suggest=False, arrow_date=None):

        if arrow_date is None:
            arrow_date = arrow.now()

        data  = {
            "creator_id":creator,
            "target_id":target_id,
            "target_type":target_type,
            "title":title,
            "suggest":suggest,
            "created":arrow_date.format(const.DB_DATE_FMT)
        }

        obj = mongoapi.make_object(global_vars.db, "comments", data)
        return Comment(obj)
