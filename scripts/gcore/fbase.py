import firebase_admin
from firebase_admin import credentials
from firebase_admin import messaging
import sys

cred = credentials.Certificate("serviceFireBaseAccountKey.json")
firebase_admin.initialize_app(cred)


def sendUserANotification(registration_token, ntext, ntitle, data = {}, badge = None):

    if data is not None:
        # then data is a dict
        for key in data:
            value = data[key]
            if not isinstance(value, str):
                data[key] = str(value)

    if registration_token == "unknown":
        return "no token"

    try:


        '''
        message = messaging.Message(
            apns=messaging.APNSConfig(
                headers={'apns-priority': '10'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title='$GOOG up 1.43% on the day',
                            body='$GOOG gained 11.80 points to close at 835.67, up 1.43% on the day.',
                        ),
                        badge=42,
                    ),
                ),
            ),
            topic='industry-tech',
        )


        '''


        # See documentation on defining a message payload.
        message = messaging.Message(
            notification=messaging.Notification(
                title= ntitle,
                body= ntext,
            ),
            data=data,
            apns = messaging.APNSConfig(
                payload = messaging.APNSPayload(
                    aps = messaging.Aps( badge = badge )
                )
            ),

            token=registration_token,
        )

        # Send a message to the device corresponding to the provided
        # registration token.
        response = messaging.send(message)
        # Response is a message ID string.
        print('Successfully sent message:', response)
        return "ok"

    except messaging.ApiCallError as err:
        print("in ApiCallError")
        print(err)
        print(type(err))
        # Requested entity was not found.
        try:
            print(err.detail)
        except:
            print("no err details")
        print("error "+str(err))
        return str(err)

    #except: => let it bubble up and be sent by email
    #    print("in notif except for {}".format(ntitle))
    #    print (sys.exc_info())
    #    return "error"