import arrow
from . import Data
from gcore import const, mongoapi, global_vars

# this class encapsulates the logic for a mission
# it is initialized with a Mongo Object
dbtype = "files"
class File(Data):

    def __init__(self, obj):

        #creator_id: string;
        #ext: string; // extension, 3 letters
        #filetype:string; // image, report, contract
        #url: string;
        #key:string;  // encryption key ? or name in bucket
        #date:string; // as YYYYMMDD
        #bucket:string,
        #target_id:string,
        #target_type:string

        self.creator_id = None
        self.ext = ""
        self.url = ""
        self.state = ""
        self.filetype = ""
        self.bucket = ""
        self.key = ""
        self.target_id = ""
        self.date = "" # akshully a date. duh

        super(File, self).__init__(obj)
        self.dbtype = dbtype
        if 'date' in obj: # cron jobs don't have a 'created'
            self.date_arrow = arrow.get(obj["date"])

        self.date = self.date_arrow.format(const.DEFAULT_FMT)


    @staticmethod
    def create(path, ext, target_id, target_type , bucket = "local", filetype="report", creator_id=None):
        if creator_id is None:
            creator_id= mongoapi.tool_user['_id'],
        data = {
            "creator_id": creator_id,
            "ext": ext,
            "filetype":filetype,
            'key': path,
            'date':arrow.now().format("YYYYMMDD"),
            'bucket':"local",
            'target_id':target_id,
            'target_type': target_type
        }
        # make move to s3 job ?
        fileobj = mongoapi.make_object(global_vars.db, 'files',data)
        return File(fileobj)

    @property
    def filename(self):
        fname = self.key.split("/")[-1]
        if "." in fname:
            return fname
        else:
            return "{}.{}".format(fname, self.ext)

    def update(self, key=None, bucket = None, save=True):

        if bucket is not None:
            self.bucket = bucket
            self.data["bucket"] = bucket

        if key is not None:
            self.key = key
            self.data["key"] = key

        if save:
            self.save()



    @staticmethod
    def get(_id):
        '''gets mongo api object and creates the dataclass

        Arguments:
            _id {ObjectId} -- user _id
        '''
        _obj = global_vars.db.files.find_one({"_id":_id})
        if _obj is None:
            return None
        return File(_obj)
