class ChatPayload():

    def __init__(self, target=None,source=None, message=None):
        self.to = target
        self.source = source 
        self.msg = message

    @staticmethod
    def create_from_obj(self, obj):

        if 'to' not in obj:
            raise Exception('chat payload must have a to')
        if 'msg' not in obj:
            raise Exception('chat payload must have a msg')

        to = obj['to']
        msg = obj['msg']
        sender = None
        if 'from' in obj:
            sender = obj['from']
        return ChatPayload(to, sender, msg)


    @property
    def payload(self):
        ret = {
            'to':self.to,
            'msg':self.msg
        }
        # from is a reserved keyword
        if self.source is not None:
            ret['from'] = self.source
        return ret