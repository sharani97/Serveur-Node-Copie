import arrow
from . import Data, Like, Comment, Suggestion, Order, Vote
from gcore import const, global_vars

from typing import List

dbtype = "ideas"


class Idea(Data):

    def __init__(self, obj):

        # for pylint
        '''
            mission_id:string;
            original:string;
            original_creator:string;
            phase:number;
            price:number;
            active:Boolean;
            image:string;
        '''

        self.creator_id = None
        self.original_creator = None
        # self._id = None  in parent
        self.price = 1
        self.votes: List[Vote] = []
        self.comments: List[Comment] = []

        self.new_comments: List[Comment] = []
        self.new_likes: List[Like] = []

        self.orders: List[Order] = []
        self.likes: List[Like] = []
        self.suggestions = []
        self.voters = []
        self.investors = []
        self.credits = 0
        self.author = None
        self.likes_up = 0
        self.likes_down = 0
        self.vote_total = 0
        self.vote_data = {}
        self.mission_id = None

        super(Idea, self).__init__(obj)
        self.dbtype = dbtype

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

        idea_date = arrow.get(obj["created"])
        idea_date_fmt = idea_date.format(const.DEFAULT_FMT)

        self.date = idea_date_fmt
        self.data_arrow = idea_date

    @property
    def like_score(self):
        if self.likes_down == 0 and self.likes_up == 0:
            return 0
        return (self.likes_up/(self.likes_up + self.likes_down))

    def setAuthor(self, user):
        self.author = user

    def getLine(self, phaseName, link):

        ret0 = [self.text, self.date]
        ret1 = []
        ret2 = [len(self.comments), self.author.fullname, self.author.email]

        if phaseName == "phase1":
            ret1 = [
                self.likes_up,
                self.likes_down
            ]
        if phaseName == "phase2":
            if len(self.votes) == 0:
                ret1 = [0, 0]
            else:
                ret1 = [
                    self.vote_total/len(self.votes), len(self.votes)
                ]

        if phaseName == "phase3":
            ret1 = [
                self.credits,
                len(self.investors),
                len(self.suggestions)
            ]

        return ret0 + ret1 + ret2 + [link]

    def add_vote(self, obj):
        # do some stats
        vote: Vote
        if isinstance(obj, dict):
            vote = Vote(obj)
        else:
            vote = obj

        self.votes.append(obj)
        vote_type = vote.vote_nb
        if self.creator_id not in self.voters:
            self.voters.append(self.creator_id)

        self.vote_total += vote_type
        v = 'vote_{}'.format(vote_type)
        if v not in self.vote_data:
            self.vote_data[v] = 1
        else:
            self.vote_data[v] += 1

    def add_order(self, obj):
        # do some stats
        self.orders.append(obj)
        if obj["buyer_id"] not in self.investors:
            self.investors.append(obj["buyer_id"])
        self.credits += obj["buy_nb"]

    def add_like(self, obj: Like, is_new=False):

        if isinstance(obj, dict):
            obj = Like(obj)

        if obj.nb > 0:
            self.likes_up += 1
        else:
            self.likes_down += 1
        self.likes.append(obj)
        if is_new:
            self.new_likes.append(obj)

    def add_comment(self, obj, is_new=False):
        # if suggest then ?

        suggest = obj["suggest"]

        if isinstance(obj, dict):
            if suggest:
                obj = Suggestion(obj)
            else:
                obj = Comment(obj)

        if suggest:
            self.suggestions.append(obj)

        else:
            self.comments.append(obj)
            if is_new:
                self.new_comments.append(obj)

    def add(self, typ, obj):
        if typ == "likes":
            self.add_like(obj)
        if typ == "votes":
            self.add_vote(obj)
        if typ == "comments":
            self.add_comment(obj)
        if typ == "orders":
            self.add_order(obj)

    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass 

        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.ideas.find_one({"_id": _id})
        return Idea(obj)
