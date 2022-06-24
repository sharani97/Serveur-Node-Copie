from .data import Data

from .comment import Comment
from .job import Job
from .like import Like
from .vote import Vote
from .notifs import Notif
from .order import Order
from .reward import Reward
from .suggestion import Suggestion
from gcore import global_vars, pluralize
from .messagepage import MessagePage, Conversation
from .org import Org
from .entity import Entity
from .post import Post

from .idea import Idea
from .mission import Phase, Mission
from .user import User, Friendship
from .file import File


from bson import ObjectId

def get_parent_mission(object_id, object_type):

    # object type can be : 
    # a mission, an idea, a post, a suggestion, a comment, a like  

    if object_type in ["post", "organisation", "entity", "user"]:
        return None

    obj_db = pluralize(object_type)

    # needs pluralize
    obj = global_vars.db[obj_db].find_one({'_id':ObjectId(object_id)})

    # like, duh 
    if object_type == "mission":
        return Mission(obj)

    # e.g. a like on a comment or vice versa => we can recurse 
    if obj_db == "comments":
        comment = Comment(obj)
        return get_parent_mission(comment.target_id, comment.target_type)

    if obj_db == "likes":
        like = Like(obj)
        return get_parent_mission(like.target_id, like.target_type)

    if obj_db == "ideas":
        idea = Idea(obj)
        return Mission.get(idea.mission_id)


    return None 

def get_creator(obj):

    creator_id = None
    if 'creator_id' in obj:
        creator_id = obj['creator_id']
    else: 
        if 'user_id' in obj: #likes have a user ID
            creator_id = obj['user_id']
    
    return User.get(creator_id)


