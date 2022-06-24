import api
import requests

api.setmode('dev')

#print(api.get("jobs"))

user = {
    'username':'d.hockley',
    'password':'test',
    'email':'david.hockley@gmail.com'
}

data = api.register(user)

print(data)

r = requests.post(api.resource("password"), json={
    'email':'david.hockley@gmail.com',
    'pass':'test'
})

print('response', r.text)
orgs = api.get('/me/adminorgs')
print('orgs', orgs)