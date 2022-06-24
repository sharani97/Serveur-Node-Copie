import boto3
from botocore.exceptions import ClientError

from jinja2 import Template
import json
import jwt
import sys
import base64

from gcore import mongoapi, users


def sendResetEmail(email, server = None, db = None, config = None):

    if users.is_fake_email(email):
        return

    user = users.get_from_email(email, db)

    if user is None:
        print("no such user")
        return

    claims = {
        "sub": str(user["_id"]),
        "iss": config["appname"],
        "email":email,
        "scope": ["reset_password"],
    }

    if server is None:
        server = "http://{}:3010".format(config["domain"])

    secret = user["token"]

    encoded_jwt = jwt.encode(claims, secret, algorithm='HS256').decode("utf-8")

    logo_path = "scripts/emails/logo.png"

    link = "{}/api/resetpassword/{}".format(server, encoded_jwt)

    SENDER = "{} <app@{}>".format(config["appname"], config["email-domain"])
    RECIPIENTS = [email]
    AWS_REGION = "eu-west-1"

    SUBJECT = "Mot de passe oublie"
    BODY_TEXT = '''
    Bonjour, la reinitialisation de votre mot de passe a ete demandee. Si cette demande ne provient pas de vous, vous pouvez l'ignorer. 
    Pour  {}'''.format(link)
    BODY = "Bonjour, vous avez demande la reinitionalisation de votre mot de passe."
    preheader = "Votre demande de reinitialisation de mot de passe."
    color = "#03A9F4"
    light_color = "#BBDEFB"
    filename = 'emails/simple.html'
    txt = open(filename, 'r').read()
    template = Template(txt)
    data = {
        #"logo":"./emails/logo.png",
        "title":SUBJECT,
        "maintext":BODY,
        "link":link,
        "color":color,
        "light_color":light_color,
        "call_to_action":"Reinitialiser",
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
    session = boto3.Session(profile_name=config["aws"])
    client = session.client('ses',region_name=AWS_REGION)

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

    print("starting")
    args =  sys.argv
    email = args[1]
    env = args[2]
    DB, CONF = mongoapi.setup(env)
    print(DB)
    sendResetEmail(email, None, DB, CONF)