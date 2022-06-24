import api
api.setmode('dev')

#print(api.get("jobs"))

m = api.get("missions")

print(m)

if len(m) == 0 :
    api.post('missions', {
            'title':'test',
            'description':'description'
        })


ms = api.get("missions")

m = m[0]
'''
api.post('ideas', {
        'title':'test',
        'description':'description',
        'mission_id':m['_id']
    })

ids = api.get("ideas")

print(ids)
'''
url = 'missions/{}/ideas'.format(m['_id'])
print(url)
ideas = api.get(url)
