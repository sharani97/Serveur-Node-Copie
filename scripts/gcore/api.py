#!/usr/bin/python3.4

import requests
import json
import urllib.parse
import time


#core_url = 'http://localhost:3000/api'

core_url = 'http://backoffice:3010/api'

jwt = None

tool_email = "david.hockley@gmail.com"

def setmode(mode):
    global core_url
    if mode == 'dev':
        core_url = 'http://localhost:3010/api'
    else:
        core_url = 'http://backoffice:3010/api'



def resource(name, params=None):

    if type(params) is str:
        paramList = [params]
    else:
        paramList = params

    if paramList is not None:
        l = [core_url, name] + paramList
    else:
        l = [core_url, name]

    ret = '/'.join(l)
    return ret


def register(userData):
    return requests.post(resource("register"), json=userData)

def get_jwt(email = tool_email, password = "test"):
    global jwt
    if jwt is not None:
        return jwt

    r = requests.post(resource("password"), json= {
        "pass": "test",
        "email": tool_email
    })

    try:
        jwt = r.json()["data"]["jwt"]
    except:
        raise Exception(r.json()["error"])
    return jwt

name_char_aliases = [
  {"k":"&","v": " and "},
  {"k": "+", "v": " plus"},
  {"k": "%", "v": " pct"},
  {"k": "*", "v": " "},
  {"k": "?", "v": ""},
  {"k":"'","v":"_"},
  {"k":",","v": ""},
  {"k": ",", "v": "_"},
  {"k": "-", "v": "_"},
  {"k":" ","v": "_"},
  {"k":"/","v": "_"},
  {"k": ")", "v": ""},
  {"k": "(", "v": "_"},
  {"k":"___","v": "_"},
  {"k":"__","v": "_"},

]


def sanitize_string(name):

    if '/' in name:
        idx = name.index('/')
        return name[:idx]
    return name

def sanitize_filename(name):
    ret = name.lower().strip()
    for alias in name_char_aliases:
        ret = ret.replace(alias["k"], alias["v"])
    return ret

def sanitize_name(name):
    ret = sanitize_filename(name)
    ret.replace(".","")
    return ret

def get_headers():
    return {'x-access-token': get_jwt()}


def set_password(password):
    url = '{}users/{}/password/{}'.format(core_url, tool_email, password)
    r = requests.put(url, headers=get_headers())
    print("response : {}".format(r.text))



def namefind(res, name):
    url = resource(res, ["find", name])
    return requests.get(url, headers=get_headers()).json()

def search(res, params = None):
    encode = urllib.parse.urlencode(params)
    url = resource(res, ["search?{}".format(encode)])
    return requests.get(url, headers=get_headers()).json()


def delete(res, params = None):
    url = resource(res, params)
    return requests.delete(url, headers=get_headers())

def get(res, params = None):
    url = resource(res, params)
    return requests.get(url, headers=get_headers()).json()

languages = {}

def get_language(language):

    if language in languages:
        return languages[language]

    ret = get("languages", ["names", language])

    if len(ret) == 0 or "error" in ret:
        raise AssertionError("Language {} not found in server".format(language))

    lang_data = ret[0]
    languages[language] = lang_data
    return lang_data


def get_users():
    return get("users")


def post(resources, item, params=None):

    done = False
    count = 0

    while(done == False):
        try:

            data = requests.post(resource(resources, params), json=item, headers=get_headers()).json()
            done = True
        except:
            time.sleep(count*2)
            count += 1
            print("post retry {}".format(count))
            if count > 5:
                raise Exception("Post failed for more than 5 retries")

    return data


def put(resources, id, item):

    cnx_failed = True
    count = 0
    callurl = resource(resources, id)

    while cnx_failed:
        try:
            return requests.put(callurl, json=item, headers=get_headers()).json()
        except:
            count += 1
            if count > 5:
                raise Exception("too many fails")
            print("PUT retry {}".format(count))
            time.sleep(count*2)

def deleteField(resources, id, field):
    return requests.delete(resource(resources, [id,field]), headers=get_headers()).json()


def check_id_if_item_exists(resources, item, key="id"):
    #print(item)
    id = item[key]
    url = resource(resources, [key, id])
    try:
        ret = requests.get(url, headers=get_headers()).json()[0]
        if ret:
            return ret["_id"]
        else:
            return None
    except (IndexError, KeyError) :
        return None


def try_post(resources, item, key="id"):
    _id = check_id_if_item_exists(resources, item, key)
    if _id is None:
        return post(resources, item)
    else:
        #print("item already found with {} : {} : skipping ".format(key, item[key]))
        pass


def post_or_put(resources, item, key="id"):
    _id = check_id_if_item_exists(resources, item, key)
    if _id is None:
        return post(resources, item)
    else:
        item["_id"] = _id
        return put(resources, _id, item)


def clean_char(resource="actions", field="email", char="'", replace=""):

  ret = get(resource,[field, "like", char])
  print("Found {} items in {} where {} contained {} ".format(len(ret), resource, field, char))

  for item in ret:
    item[field] = item[field].replace(char, replace)
    put(resource, item["_id"], item)

  print(" -> done")


def clean_field(resource="countries", field="region", value="Latin America", replace="LATAM"):

  ret = get(resource,[field, value])
  print("Found {} items in {} where {} was {} ".format(len(ret), resource, field, value))

  for item in ret:
    item[field] = item[field] = replace
    put(resource, item["_id"], item)

  print(" -> done")




def postfile(path, subpath):
    files = {'file': open(path, 'rb')}
    if subpath is None:
        url = resource('upload', 'contract');
    else:
        url = resource('upload', subpath);

    cnx_failed = True
    count = 0

    while cnx_failed:
        try:
            return requests.post(url, files=files, headers=get_headers()).json()
        except:
            count += 1
            if count > 5:
                raise Exception("too many fails")
            print("POST retry {}".format(count))
            time.sleep(count*2)

  



if __name__ == '__main__':
    pass # print(postfile('contacts.txt'))
