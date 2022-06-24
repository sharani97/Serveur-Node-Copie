import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission
# it is initialized with a Mongo Object
dbtype = "posts"
class Post(Data):

    def __init__(self, obj):

        # creator_id
        # target_ids:[mongoose.Schema.Types.ObjectId], // to whom this is sent, in fine
        # target_type:
        #    default:"user",
        # image:mongoose.Schema.Types.ObjectId,
        # mission_id:mongoose.Schema.Types.ObjectId, // for when it gets transformed I guess
        # state: emum:["new", "cancelled", "selected", "expired"]
        # title: String
        # description: String,

        # self._id = None in parent
        self.creator_id = None # for pylint
        self.target_ids = []
        self.target_type = "user"
        self.title = ""
        self.description = ""

        super(Post, self).__init__(obj)
        self.dbtype = dbtype

        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    @property
    def uri(self):
        return "posts/{}".format(self._id)

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass

        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.posts.find_one({"_id":_id})
        if obj is None:
            return None
        return Post(obj)
