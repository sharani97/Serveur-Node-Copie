import random
from typing import List
from dataclass import User, Like, Comment

class UserInteractions():
    def __init__(self, user:User):

        self.likes:List[Like] = []
        self.comments:List[Comment] = []
        self.new_likes:List[Like] = []
        self.new_comments:List[Comment] = []

        self.user = user
        self.last_cnx_arrow = user.last_cnx_arrow

    def add_like(self, like:Like):
        if like.user_id == self.user._id:
            return
        self.likes.append(like)
        if like.date_arrow > self.last_cnx_arrow:
            self.new_likes.append(like)

    def add_comment(self, comment:Comment):
        if comment.creator_id == self.user._id:
            return
        self.comments.append(comment)
        if comment.date_arrow > self.last_cnx_arrow:
            self.new_comments.append(comment)

    @property
    def total_user_count(self):
        ret = []
        for like in self.likes:
            if like.user_id not in ret:
                ret.append(like.user_id)
        for comment in self.comments:
            if comment.creator_id not in ret:
                ret.append(comment.creator_id)
        return len(ret)

    @property
    def interaction_nb(self):
        return len(self.likes) + len(self.comments)

    @property
    def random_comment(self):
        ret = []
        if len(self.new_comments) > 0:
            return random.choice(self.new_comments)
        else:
            return random.choice(self.comments)

    @property
    def random_like(self):
        ret = []
        if len(self.new_likes) > 0:
            return random.choice(self.new_likes)
        else:
            return random.choice(self.likes)