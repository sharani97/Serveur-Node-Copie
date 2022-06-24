from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import boto.ses


AWS_ACCESS_KEY = 'HEREYOURACCESSKEY'
AWS_SECRET_KEY = 'HEREYOURSECRETKEY'

class Email(object):

    def __init__(self, to, subject):
        self.to = to
        self.subject = subject
        self.text = None
        self.attachment = None


    def text(self, text):
        self.text = text

    def add_attachment(self, attachment):
        self.attachment = attachment

    def send(self, from_addr=None, file_name = None):

        connection = boto.ses.connect_to_region(
            'us-east-1',
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY
        )
        msg = MIMEMultipart()
        msg['Subject'] = self.subject
        msg['From'] = from_addr
        msg['To'] = self.to

        part = MIMEApplication(self.attachment)
        part.add_header('Content-Disposition', 'attachment', filename=file_name)
        part.add_header('Content-Type', 'application/vnd.ms-excel; charset=UTF-8')

        msg.attach(part)

        # the message body
        part = MIMEText(self.text)
        msg.attach(part)

        return connection.send_raw_email(msg.as_string(),source=from_addr,destinations=self.to)

if __name__ == "__main__":
    email = Email(to='toMail@gmail.com', subject='Your subject!')
    email.text('This is a text body.')
    #you could use StringIO.StringIO() to get the file value
    email.add_attachment(yourFileValue)
    email.send(from_addr='from@mail.com',file_name="yourFile.txt")
