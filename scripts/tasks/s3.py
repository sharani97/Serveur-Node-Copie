import arrow
import boto3

from bson.objectid import ObjectId
from gcore import mongoapi, users, fbase, const, global_vars
from loc import _

from dataclass import File as File, Mission, Org, Entity
from unidecode import unidecode

class S3Sender():

    client = None

    @staticmethod
    def setup(profile=None):
        if S3Sender.client is None:
            if profile is None:
                profile = global_vars.conf["aws"]
            session = boto3.Session(profile_name=profile)
            S3Sender.client = session.client('s3')


    @staticmethod
    def checkAllTheFiles():

        ## get all the local mission files 
        # upload them 
        
        files = global_vars.db.files.find({
            "target_type" : "mission",
            "bucket" : "local"
        })

        for file in files:
            S3Sender.upload_file(file)



    @staticmethod
    def upload(local_file, remote_name, bucket_name):
        if S3Sender.client is None:
            S3Sender.setup()
        S3Sender.client.upload_file(local_file, bucket_name, remote_name)

    @staticmethod
    def sanitize(path):
        return unidecode(path.lower()).replace(" ","_").replace("?","").replace("!","")

    @staticmethod
    def upload_file(file, move=False):
        if isinstance(file, dict):
            _file = File(file)
        else:
            _file = file

        #print(file.filename, file.bucket, file.key)

        # 2. check if it is already uploaded (to the correct place)
        bucket = None
        if _file.filetype in global_vars.conf["files"]:
            fileconf = global_vars.conf["files"][_file.filetype]
            if "s3" in fileconf:
                bucket = fileconf["s3"]

        if bucket is None:
            global_vars.logger.warn("No target bucket found for filetype {}".format(_file.filetype))

        filename = _file.filename
        path_bits = [filename]
        path = filename

        if _file.target_type == "mission":
            mission = Mission.get(_file.target_id)

            if mission is None:
                return

            title = S3Sender.sanitize(mission.title)
            path_bits.append(title)

            org = Org.get(mission.org)
            if org is not None:
                orgname = S3Sender.sanitize(org.name)
                path_bits.append(orgname)

            entity = Entity.get(org.entity)
            if entity is not None:
                entityname = S3Sender.sanitize(entity.name)
                path_bits.append(entityname)
            
            path_bits.reverse()
            path = "/".join(path_bits)
            #path = filename
        else:
            # manage images too 
            return 

        if _file.bucket == bucket:
            # TODO check the path ?
            return _file

        if _file.bucket == 'local':
            S3Sender.upload(_file.key, path, bucket)
            _file.update(path, bucket)

        # if move then delete "local" file

        return _file
