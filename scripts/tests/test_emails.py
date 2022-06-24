import os
import boto3
from botocore.exceptions import ClientError
from six.moves.email_mime_multipart import MIMEMultipart
from six.moves.email_mime_text import MIMEText

import sure  # noqa

#import moto
from moto import mock_ses

from botocore.stub import Stubber

#client = boto3.client('s3')
#stubber = Stubber(client)
#stubber.add_client_error('upload_part_copy')
#stubber.activate()
# Will raise a ClientError
#client.upload_part_copy()


from gcore import mongoapi
from workers import emails

import logger

import unittest
from robber import expect


current_dir = os.path.dirname(os.path.abspath(__file__))

@mock_ses
class EmailTest(unittest.TestCase):

     # executed prior to each test
    def setUp(self):

        open('{}/../tests/invites.csv'.format(current_dir), 'a').close()

        _log = logger.setupLogging('test_emails.log')
        emails.set_logger(_log)
        mongoapi.set_logger(_log)

        DB, CONF = mongoapi.setup('test')
        self.db = DB
        self.conf = CONF

        self.sender =  "{} <app@{}>".format(self.conf["appname"], self.conf["email-domain"])

        self.domain = self.conf["email-domain"]

        self.conn = boto3.client('ses', region_name='eu-west-1')
        self.stubber = Stubber(self.conn)

        emails.client = self.conn


    # executed after each test
    def tearDown(self):
        pass

    def test_missionlocked(self):
        pass
