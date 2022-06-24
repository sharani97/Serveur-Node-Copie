from .mission_report import MissionReport, setup as missionSetup
from .report_styles import ReportStyles
from .s3 import S3Sender
from .email import EmailSender, setup as emailSetup
from .notif import NotifSender, setup as notifSetup, notif_types


def set_tasks_logger(_logger):
    EmailSender.logger = _logger

def setup(conf, db, logger):
    missionSetup(conf, db, logger)
    emailSetup(conf, db, logger)
    notifSetup(conf, db, logger)    