import arrow
from . import Data
from gcore import const

# this class encapsulates the logic for a suggestion on a phase3 idea 
# it is initialized with a Mongo Object

class Suggestion(Data):

    def __init__(self, obj):

        self.likes_up    = 0 # for pylint
        self.likes_down  = 0 # for pylint
        self.nb_comments = 0
        self.comments = []

        self.target_id = ""
        self.creator_id = None
        self.author = None
        self.author_name = ""
        self.author_email = ""
        self.idea_title = ""
        self.updated = False 
        # self._id = None in parent
        
        super(Suggestion, self).__init__(obj)

        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DEFAULT_FMT)

        txt = ""
        desc = ""
        self.hasDescription = True

        if "description" in obj:
            desc = obj["description"]
            txt = "{} {}".format(obj["title"], desc)
        else:
            txt = obj["title"]
            self.hasDescription = False

        self.description = desc
        self.text = txt 

    def addIdea(self, idea):
        self.idea_title = idea.title

    def addAuthor(self, user):
        self.author = user 
        self.author_email = user.email 
        self.author_name = user.fullname


    def updateSelf(self, db):
        # get likes 
        if self.updated :
            return

        likes = db.likes.find({"target_id":self._id, "meaning":"like"})
        for obj in likes:
            if obj["nb"] > 0:
                self.likes_up += 1
            else:
                self.likes_down += 1

        comments = db.comments.find({"target_id":self._id}) 
        self.nb_comments = 0
        for obj in comments:
            self.comments.append(obj)
            self.nb_comments += 1
