import arrow
from . import Data
from gcore import const, mongoapi, global_vars
from loc import _

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object

dbtype = "messagepages"
class MessagePage(Data):

    def __init__(self, obj):
        self.conversation = None
        self.messages = []
        self.nb = 0 
        self.open = True
        self.prev = "" 
        self.next =""

        super(MessagePage, self).__init__(obj)
        self.dbtype = dbtype
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DB_DATE_FMT)

    def message(self, usr_id, message):

        msg = {
            "from":usr_id, 
            "msg":message
        }

        self.messages.append(msg)
        if 'messages' not in self.data:
            self.data['messages'] = []
        self.data['messages'].append(msg)
        self.save()


    @staticmethod
    def get(conversation, nb=0):
        mp =  global_vars.db.messagepages.find_one({
            'conversation':conversation, 
            'nb':nb
        })
        return MessagePage(mp)

    @staticmethod
    def create(conversation, nb=0, _open=True, arrow_date=None):

        if arrow_date is None:
            arrow_date = arrow.now()

        data = {
            "conversation" : conversation,
            "nb" : nb,
            "open": _open,
            "created":arrow_date.format(const.DB_DATE_FMT)
        }
        obj = mongoapi.make_object(global_vars.db, "messagepages", data)
        return MessagePage(obj)


dbtype2 = "conversations"
class Conversation(Data):
    def __init__(self, obj):
        # self._id = None in parent
        self.title = None
        self.dm = True
        self.usr1 = None
        self.usr2 = None
        self.members = []
        self.current_page = 0
        self.pages = []
        self.read = {}
        self.message_page = None

        super(Conversation, self).__init__(obj)
        self.dbtype = dbtype
        self.date_arrow = arrow.get(obj["created"])
        self.date = self.date_arrow.format(const.DB_DATE_FMT)

    def message(self, usr_id, message):
        self.message_page.message(usr_id, message)

    def getUnread(self, user_id):
        #conversation.read = conversation.read || {};
        #let current_read = conversation.read[user.id.toString()];

        if self.message_page is None:
            self.message_page = MessagePage.get(self._id, self.current_page)
            if self.message_page is None:
                self.message_page = MessagePage.get(self._id, self.current_page - 1)

        read = None
        if user_id in self.read:
            read = self.read[str(user_id)]

        if read is None:
            # return nb pages x 100 + nb of messages in current conversation :D
            return (self.current_page)*100 + len(self.message_page.messages)
        else:

            read_msg_id = read["message"]
            read_page = read["page"]

            page_diff = (self.current_page - read_page)
            count = 0

            if page_diff == 0:
                for msg in self.message_page.messages:
                    if msg._id > read_msg_id:
                        count += 1
                return count
            else:
                return page_diff*100 + len(self.message_page.messages)

            # compare read to current 

    @staticmethod
    def create(usrA, usrB, arrow_date = None):

        data = {}

        if str(usrA) < str(usrB):
            data = {
                "usr1" : usrA,
                "usr2" : usrB,
                "dm": True
            }
        else:
            data = {
                "usr1" : usrB,
                "usr2" : usrA,
                "dm": True
            }


        if arrow_date is None:
            arrow_date = arrow.now()

        data['created'] = arrow_date.format(const.DB_DATE_FMT)
        obj = mongoapi.make_object(global_vars.db, "conversations", data)
        
        conversation = Conversation(obj)
        messagepage = MessagePage.create(conversation._id)
        
        conversation.current_page = messagepage.nb
        conversation.pages.append(messagepage)
        conversation.message_page = messagepage

        return conversation

    @staticmethod
    def get_from_users(usrA, usrB):
        usr1 = usrA
        usr2 = usrB
        if str(usrA) > str(usrB):
            usr1 = usrB
            usr2 = usrA

        conv = global_vars.db.conversations.find_one({
            "usr1":usr1,
            "usr2":usr2
        })
        if conv is None:
            return None

        return Conversation(conv)

    
    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass 
        
        Arguments:
            _id {ObjectId} -- user _id
        '''
        obj = global_vars.db.conversations.find_one({"_id":_id})
        if obj is None:
            return None
        return Conversation(obj)