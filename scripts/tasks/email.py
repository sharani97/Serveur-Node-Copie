import boto3
import os
import json
import logging
import math

from botocore.exceptions import ClientError
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from jinja2 import Template

from loc import _

from dataclass import User, Post

from gcore import const, global_vars


logging.getLogger('boto3').setLevel(logging.WARNING)
logging.getLogger('botocore').setLevel(logging.WARNING)
#logging.getLogger('nose').setLevel(logging.WARNING)

dir_path = os.path.dirname(os.path.realpath(__file__))

json_file = '{}/emails.json'.format(dir_path)
json_template_file = '{}/../emails/email_templates.json'.format(dir_path)

config = None
db = None
logger = None




class EmailSender():

    region = "eu-west-1" ## ses => west 3 ?
    session = None
    client = None
    data = {}
    templates = {}

    @staticmethod
    def setup():
        global config
        if config is None:
            config = global_vars.conf

        if EmailSender.client is None:
            print("starting session with profile {}".format(config["aws"]))
            EmailSender.session = boto3.Session(profile_name=config["aws"])
            EmailSender.region = config['zone']
            EmailSender.client = EmailSender.session.client('ses',region_name=config['zone'])

        data = None
        with open(json_file) as f:
            data = json.load(f)
        EmailSender.data = data

        data2 = None
        with open(json_template_file) as f:
            data2 = json.load(f)
        EmailSender.templates = data2

    @staticmethod
    def getTemplates():
        templates = []

        for template_id in EmailSender.templates:
            template = EmailSender.templates[template_id]
            locs = template['locs']
            # template_id = template["template_id"]

            if 'path' in template:
                filepath_base = template['path']
            else:
                filepath_base = template_id
            for loc in locs:
                full_id = "{}_{}".format(template_id, loc)
                full_path = "{}/../emails/{}.{}.handlebars".format(dir_path, filepath_base, loc)
                templates.append({
                    "file":full_path,
                    'id': full_id,
                    'SubjectPart': template['subject'][loc],
                    'TextPart': template['body'][loc]
                })
        return templates


    @staticmethod
    def send_bulk_templated_email(dests, template_id, defaultData={}, sender=None):
        '''Send a bulk templated email via SES

        Arguments:
            dests {dict} -- a dict of destinations, in the shape dict[email] = locdata
            templated_id {string} -- the template to call

        Keyword Arguments:
            defaultData{dict} -- the default/fallback loc data
            sender {[type]} -- [description] (default: {None})
        '''
        SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
        if sender is None:
            sender = SENDER

        dest_list = []
        for email in dests:
            dest_data = dests[email]

            dest_list.append({
                'Destination': { 'ToAddresses':['hello@idea-heroes.com'], 'BccAddresses': [email]},
                'ReplacementTemplateData': json.dumps(dest_data)
                })
        if len(dest_list) == 0:
            logger.warn('no dest at all when sending {} templated email '.format(template_id))
            return

        response = EmailSender.client.send_bulk_templated_email(Source=sender,
            ConfigurationSetName='IDH',
            Template=template_id,
            DefaultTemplateData=json.dumps(defaultData),
            Destinations=dest_list
            )
        ## and log ?
        return response


    @staticmethod
    def send_templated_email(dest, template_id, data, sender=None):

        if len(dest) == 0:
            logger.warn('no dest at all when sending {} templated email '.format(template_id))
            return


        SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
        if sender is None:
            sender = SENDER

        response = EmailSender.client.send_templated_email(
            Source=sender,
            Destination={
                'ToAddresses': dest,
                #'CcAddresses': [        ],
                #'BccAddresses': []
            },
            #ReplyToAddresses=[],
            ConfigurationSetName='IDH',
            Template=template_id,
            TemplateData=json.dumps(data)
        )
        #print(response)
        return response

    @staticmethod
    def send_email(recipients, subject, body_text, body_html= None, attachement = None, sender=None):

        SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])

        if sender is None:
            sender = SENDER

        dest = []
        #logger.info('recipients ', recipients)
        for item in recipients:
            if isinstance(item, User):
                dest.append(item.email)
            if isinstance(item , str):
                dest.append(item)
            if isinstance(item , dict):
                dest.append(item["email"])

        if len(dest) == 0:
            logger.warn("Try to send email {} to 0 users ".format(subject))
            return

        CHARSET = "UTF-8"

        msg = MIMEMultipart() #'alternative')
        msg['Subject'] = subject
        msg['From'] = SENDER

        if len(dest) > 0:
            msg['To'] = "app@{}".format(config["email-domain"])
            msg['Cc'] = ",".join(dest)
        else:
            msg['To'] = dest[0]

        part1 = MIMEText(body_text, 'plain', CHARSET)
        msg.attach(part1)

        if body_html is not None:
            part2 = MIMEText(body_html, 'html', CHARSET)
            msg.attach(part2)

        if attachement is not None:

            filename = attachement.split('/')[-1]
            # logger.info("filename : {}".format(filename))
            part = MIMEApplication(open(attachement, 'rb').read())
            part.add_header('Content-Disposition', 'attachment', filename=filename)
            msg.attach(part)

        try:
            response = EmailSender.client.send_raw_email(
                RawMessage={
                    'Data': msg.as_string()
                },
                Source=msg['From'],
                Destinations=dest
            )

        except ClientError as e:
            logger.warn("error")
            logger.warn(e)
            logger.warn(e.response['Error']['Message'])
            # what should we do here ???
            # warn admin ?
            return False
        else:
            #logger.info("Email sent! Message ID: {}".format(response['ResponseMetadata']['RequestId']))
            return True

    @staticmethod
    def send_email_type(recipients, email_type, data = {}, file=None, locdata={}):

        # get from data
        # recipients = dataclass.User[] or [emails] ?
        if email_type not in EmailSender.data:
            EmailSender.data[email_type] = {}

        email_conf = EmailSender.data[email_type]

        for key in locdata:
            data[key] = locdata[key]

        if file is None and 'file' in data:
            file = data['file']

        lockey = email_type

        if 'lockey' in email_conf:
            lockey = email_conf['lockey']

        if 'loc_values' in email_conf:

            for item in email_conf['loc_values']:
                _data = data
                key = item['key']
                if 'obj' in item:
                    _data = data[item['obj']]

                if 'value' in item:
                    data[key] = _data[item['value']]

        _subject = _('{}.subject'.format(lockey), 'email', data)
        _text = _('{}.text'.format(lockey), 'email', data)

        _body_html = None

        if 'html' in email_conf:

            html_conf = email_conf['html']

            _data = {}
            for key in data:
                _data[key] = data[key]

            if 'data' in html_conf:
                for key in html_conf['data']:
                    _data[key] = html_conf['data'][key]

            if 'lockeys' in html_conf:
                for key in html_conf['lockeys']:
                    _data[key] = _('{}.{}'.format(lockey, key), 'email', data)

            tpt = "simple"
            if 'template' in html_conf:
                tpt = html_conf['template']

            filename = '{}/../../views/{}.html'.format(dir_path, tpt)
            template = Template(open(filename, 'r').read())
            _body_html = template.render(data)


        return EmailSender.send_email(recipients, _subject, _text, _body_html, file)

    @staticmethod
    def mission_locked(emails, mission_title, inviterName):
        '''
            Nouvelle Mission !
            Bonjour, vous avez été invité(e) à rejoindre la mission: \"{mission_title}\"
            proposée par {inviter}

        '''
        email_type = const.EMAIL_MISSION_STARTED
        locdata = {
            'mission_title':mission_title,
            'inviter':inviterName
        }
        EmailSender.send_email_type(emails, email_type, {}, None, locdata)

    @staticmethod
    def mid_mission_reminder(emails, mission_title, time_left):
        '''
            Mission en cours : \"{missionTitle}\"
            Plus que {daysRemaining} jours pour participer à la mission \"{missionTitle}\".
            Amenez votre pierre à l'édifice!"
        '''
        email_type = const.EMAIL_MISSION_REMINDER

        locdata = { "missionTitle": mission_title, "daysRemaining":math.floor(time_left)}
        EmailSender.send_email_type(emails, email_type, {}, None, locdata)

    @staticmethod
    def mid_mission_report(emails, mission, filename):
        email_type = const.EMAIL_MID_MISSION_REPORT
        locdata = { "missionTitle":mission["title"]}
        EmailSender.send_email_type(emails, email_type, {}, filename, locdata)

    @staticmethod
    def end_of_mission_report(emails, mission, filename):
        email_type = const.EMAIL_END_OF_MISSION_REPORT
        locdata = { "missionTitle":mission["title"]}
        EmailSender.send_email_type(emails, email_type, {}, filename, locdata)


    @staticmethod
    def user_posted(sender:User, org_targets, post:Post):
        email_type = const.EMAIL_USER_POSTED
        locdata = {"postTitle":post.title, "postDesc":post.description, "sender":sender.anoname }
        emails = []
        for user in org_targets:
            emails.append(user.email)

        EmailSender.send_email_type(emails, email_type, {}, None, locdata)

    @staticmethod
    def mission_finished(users, mission):
        '''Sends an end of mission to the users in the mission

        Arguments:
            users {[User]} -- a list of Users
            mission {[type]} -- a Mission
        '''

        #email_type = const.EMAIL_MISSION_FINISHED

        dest = {}

        common_data = {
            "preheader":"Une mission vient d'arriver à son terme, vos récompenses sont les suivantes...",
            "hero_img":"test_cover.jpg",
            "link":"app.idea-heroes.com",
            "missiontitle":mission["title"],
            "color" : "#03A9F4",
            "light_color" : "#BBDEFB",
            "call_to_action": "Ouvrir l'App"
        }

        for user in users:


            dest[user.email] = {
                "name":user.fullname,
                "points":{ "ap":user.ap, "ip":user.ip, "kp":user.kp, "total":user.points},
                "new_points":{ "ip":user.new_ip, "ap":user.new_ap, "kp":user.new_kp, "total":user.new_points}
            }
        #TODO languages
        EmailSender.send_bulk_templated_email(dest, '{}_endmission_fr'.format(global_vars.env), common_data)


def setup(_config, _db, _logger):
    global config, db, logger
    config = _config
    db = _db
    logger = _logger
    EmailSender.setup()
