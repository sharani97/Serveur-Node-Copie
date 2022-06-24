#!/usr/bin/python3.4

import datetime as dt
import time
import json
import logging, logging.handlers
import arrow

def setupLogging(_logfile):

    logfile = "logs/{}".format(_logfile)

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    handler = logging.handlers.TimedRotatingFileHandler(
                logfile,
                when="midnight",
                backupCount =5)

   
    handler.setLevel(logging.INFO)

    # create a logging format
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    # add the handlers to the logger
    logger.addHandler(handler)

    return logger 