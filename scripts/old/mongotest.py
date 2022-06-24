from pymongo import MongoClient



client = MongoClient("mongodb://localhost:27017")

db = client.testDB

jobs = db.jobs

cursor = jobs.find()

for job in cursor:
    print(job)



