
import sys, json
import api
import time

api.setmode('dev')

def llog(message):
    print(message)
    sys.stdout.flush()

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    #Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():

    jobs = api.get("jobs")
    for job in jobs:
        id = job["id"]
        print(job["_id"])
        print(job["id"])
        if id == "fake":
            api.delete("jobs", job["_id"])

    get our data as an array from read_in()
    for i in range(1,100):
        llog(i)
        time.sleep(5)

    llog("done aok")

#start process
if __name__ == '__main__':
    main()
