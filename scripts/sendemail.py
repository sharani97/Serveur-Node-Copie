import boto3
from botocore.exceptions import ClientError

from jinja2 import Template
import json
from gcore import mongoapi, users
import jwt
import sys
import base64

_client = None 


def setSESClient(_conn):
    global _client
    _client = _conn

def sendConfirmationEmail(email, server = None, db = None, config = None):

    if users.isFakeEmail(email):
        return

    user = users.get_user_by_email(email, db)

    if user is None:
        print("no such user")
        return 

    claims = {
        "sub": str(user["_id"]),
        "iss": config["appname"],
        "email":email,
        "scope": ["validate_email"],
    }

    if server is None:
        server = "http://{}:3000".format(config["domain"])

    encoded_jwt = jwt.encode(claims, config["jwtSecret"], algorithm='HS256').decode("utf-8") 

    logo_path = "scripts/emails/logo.png" 

    '''
    with open("scripts/emails/logo.png", "rb") as image_file:
        logo_data = base64.b64encode(image_file.read()).decode("utf-8") 
    '''

    link = "{}/api/validate/{}".format(server, encoded_jwt)

    SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
    RECIPIENTS = [email]
    AWS_REGION = "eu-west-1"

    SUBJECT = "Confirmation d'email"
    BODY_TEXT = "Bonjour, merci de confirmer votre email en cliquant sur ce lien: {}".format(link)
    BODY = "Bonjour, nous vous remercions de confirmer votre email pour pouvoir pleinement profiter de l'application."
    preheader = "Vous y êtes presque, plus qu'un click pour valider votre email et pour pouvoir innover !"
    color = "#03A9F4"
    light_color = "#BBDEFB"
    filename = 'views/simple.html'
    txt = open(filename, 'r').read()
    template = Template(txt)
    data = {
        #"logo":"./emails/logo.png",
        "title":SUBJECT,
        "maintext":BODY,
        "link":link,
        "color":color,
        "light_color":light_color,
        "call_to_action":"Confirmer",
        "preheader":preheader

    }

    BODY_HTML = template.render(data)
    '''
    with open("scripts/emails/test.html", "w") as text_file:
        text_file.write(BODY_HTML)
        text_file.close()
        quit()
    '''
    
    CHARSET = "UTF-8"

    if _client is None:
        session = boto3.Session(profile_name=config["aws"])
        client = session.client('ses',region_name=AWS_REGION)
    else:
        client = _client 

    try:
        #Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': RECIPIENTS,
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': BODY_HTML,
                    },
                    'Text': {
                        'Charset': CHARSET,
                        'Data': BODY_TEXT,
                    },
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
        )


    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("Email sent! Message ID:"),
        print(response['ResponseMetadata']['RequestId'])


if __name__ == '__main__':
    args =  sys.argv

    env = args[2]
    email = args[1]
    db = mongoapi.setup(env)
    conf = mongoapi.config

    if email == "all":
        users = db.users.find({})
        for user in users:
            if user["status"] == "created" and ("validated" not in user or user["validated"] != True):
                print("sending email for ")
                sendConfirmationEmail(user["email"], None, db, conf)
    else:
        sendConfirmationEmail(email, None, db, conf)