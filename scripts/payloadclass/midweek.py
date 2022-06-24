
from . import Payload
from dataclass import User, Idea

## not actually correct 
class MidWeekEmailPayload(Payload):

    def __init__(self, user:User, actor:User, idea:Idea, all_likes:int, all_comments:int, new_likes:int, new_comments:int):
        self.user = user 
        self.idea = idea 
        self.all_likes = all_likes
        self.all_comments = all_comments
        self.new_comments = new_comments
        self.new_likes = new_likes 

    @property
    def payload(self):
        return vars(self)

class MidWeekJobPayload(Payload):

    def __init__(self):
        pass

    @property
    def payload(self):
        return {}