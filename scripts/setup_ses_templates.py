
import sys
import json
import time
import os
import arrow
import random 
import logger
import boto3
import pytz
utc = pytz.utc
from datetime import datetime

from gcore import mongoapi, users
from tests import utils

from tasks import EmailSender

_utils = None 
logs = None

TIMEZONE = 'Europe/Paris'
tz = pytz.timezone(TIMEZONE)

client = boto3.client('ses')

def checkAWSTemplates(db, config, env, forceUp = False):

    existing = {}
    nextToken = True 
    sender = EmailSender()
    sender.setup()

    while(nextToken is not None):
        if isinstance(nextToken,bool):
            nextToken = None

        if nextToken is not None:
            ret = EmailSender.client.list_templates(NextToken = nextToken)
        else:
            ret = EmailSender.client.list_templates()

        if 'NextToken' in ret:
            nextToken = ret['NextToken']
            print('next token : ', nextToken)
        else:
            print('next token is none')
            nextToken =  None

        if 'TemplatesMetadata' in ret:
            for template in ret['TemplatesMetadata']:
                print("Template exists : [{}]".format(template['Name']))
                existing[template['Name']] = template['CreatedTimestamp']

    

    templates = sender.getTemplates()

    skip_templates = [
            'endmission_en', #'endmission_fr',
            'barebones_fr','barebones_en', 
            'simple_en', 'simple_fr'
            ]

    for template in templates:
        # make full id 
        template_id = template['id']
        if template_id in skip_templates:
            continue
        fullid = "{}_{}".format(env, template_id)
        exists = fullid in existing
        path = template['file']
        
        filetime = datetime.fromtimestamp(os.path.getmtime(path), tz)
        uptodate = False
        if exists:
            uptodate = (filetime> existing[fullid])
            
        if forceUp or exists == False or uptodate == False:
            # NB : can only send one per sec 
            print("updating template : {} with {}".format(fullid, template['file']))
            # 1. read html 

            with open(template['file']) as file:
                html = file.read()
                template = {
                    'TemplateName': fullid,
                    'SubjectPart': template['SubjectPart'],
                    'TextPart': template['SubjectPart'],
                    'HtmlPart': html
                }

                if exists:
                    EmailSender.client.update_template(Template=template)
                else:
                    EmailSender.client.create_template(Template=template)

                time.sleep(1.1)

    # now send test data ?
    test_emails = ['hockley@gamificationzone.com']
    data = { 
        "name":"David Hockley",
        "missiontitle":"\"Quel nom pour notre Mission ?\"",
        "preheader":"Une mission vient d'arriver à son terme, vos récompenses sont les suivantes...",
        "hero_img":"test_cover.jpg",
        "link":"dev.idea-heroes.com",
        "points":{ "ap":27, "ip":47, "kp":8, "total":82},
        "new_points":{ "ip":3, "kp":2, "total":5},
        "color" : "#03A9F4",
        "light_color" : "#BBDEFB",
        "call_to_action": "Ouvrir l'App"
    }
    #print(json.dumps(data).replace('"', '\\"'))
    #quit()
    sender.send_templated_email(test_emails,'{}_endmission_fr'.format(env), data)

    #data2 = { 
    #    "title":"Test Title",
    #    "body":"Test Body"
    #}
    

    # sender.send_templated_email(test_emails,'{}_barebones_fr'.format(env), data2)

    


templates = []

if __name__ == '__main__':
    logfile  = 'test.log'
    logs = logger.setupLogging(logfile)
    
    mongoapi.set_logger(logs)


    print("starting")
    args =  sys.argv

    if len(args) < 3:
        email = "david.hockley@gmail.com"
        env = "dev"
        
    else:
        email = args[1]
        env = args[2]
    
    DB, CONF = mongoapi.setup(env)

    checkAWSTemplates(DB, CONF, env, True)