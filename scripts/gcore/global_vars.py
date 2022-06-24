# globals.py


db = None 
env = None
conf = None
logger = None 


def setup(_db, _conf, _env, _logger):
    global db, env, conf, logger 
    db = _db 
    conf = _conf
    env = _env 
    logger = _logger