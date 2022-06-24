import api
api.setmode('dev')

#print(api.get("jobs"))

job = {
    'id':'fake',
    'type':'fake'
}

api.post("jobs", job)