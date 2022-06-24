#!/usr/bin/env python

# WS server example

import asyncio
import websockets
import jwt 


AUTH =      "auth"
ECHO =      "echo"
DATA =      "data"
MESSAGE =   "mesg"
HELLO =     "hiya"

async def hello(websocket, msg):
    greeting = f"Hello {msg}!"
    await websocket.send(greeting)

async def auth(websocket, msg:str):
    data = jwt.decode(msg, verify=False)
    print(data)
    usr = data["username"]
    greeting = f"auth|ok"
    await websocket.send(greeting)


actions = {
    MESSAGE:hello,
    HELLO:hello,
    AUTH:auth
    #""
}

async def consumer_handler(websocket, path):
    
    msg = await websocket.recv()
    code = "none"
    remainder = "none"

    if len(msg) > 4:
        code = msg[:4]
        remainder = msg[5:]

    print("code : ", code, " remainder ", remainder)
    if code in actions:
        await actions[code](websocket, remainder)
    else:
        print(f"< {msg}")
        greeting = f"Hello {msg}!"
        await websocket.send(greeting)
        print(f"> {greeting}")


start_server = websockets.serve(consumer_handler, 'localhost', 9797)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()