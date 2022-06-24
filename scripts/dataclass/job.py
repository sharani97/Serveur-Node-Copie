import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission 
# it is initialized with a Mongo Object 
dbtype = "jobs"
class Job(Data):

    def __init__(self, obj):

        # creator_id: string;
        # exec_at:Date;
        # task: string; // generate reports, send emails, etc.
        # progress: number; // not sure this is useful
        # state: string; // enum, : new, failed, started, finished_ok...
        # exec_ts?: number; // execution timestamp
        # payload: Object;
        # output?: Object;

        self.creator_id = None
        self.task = "none"
        self.progress = -1
        self.state = "none"
        self.payload = {}

        super(Job, self).__init__(obj)
        self.dbtype = dbtype
        if 'created' in obj: # cron jobs don't have a 'created'
            self.date_arrow = arrow.get(obj["created"])
        else:
            self.date_arrow = arrow.now().shift(seconds=-60)

        self.date = self.date_arrow.format(const.DEFAULT_FMT)

    def set_payload_field(self, field, value, save = False):
        self.payload[field] = value
        self.data["payload"] = self.payload

        if save:
            self.save()

    @staticmethod
    def create(task, payload={}, naive_exec_at=None, creator_id = None):

        if creator_id is None:
            tool_user  = mongoapi.get_tool_user()
            if tool_user is None:
                raise Exception("Tool User should not be none")
            creator_id = tool_user['_id']

        if naive_exec_at is None:
            naive_exec_at = arrow.utcnow().naive

        if global_vars.db is None:
            raise Exception('global vars db not set')
        obj = mongoapi.save_job(global_vars.db, task, payload, creator_id)
        job = Job(obj)
        return job

