'''
import api
import time

api.setmode('dev')

api.register({
    'username':'David',
    'email':'david.hockley@gmail.com',
    'pass':'test'
})

print(api.get('users'))

print(api.postfile('../test/invites.csv', "csv"))
'''

