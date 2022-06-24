#!/usr/bin/env python

# WS client example

import aiohttp
import logging
import json 
import getpass

logger = logging.getLogger('websockets')
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())


import asyncio
import websockets

rest_url = "http://prod.idea-heroes.com:3010/api/password"

async def get_jwt(email, password):
    async with aiohttp.ClientSession() as session:
        async with session.post(rest_url, json={'email': email, 'password':password}) as response:
            return json.loads(await response.text())
    
   

async def hello():
    async with websockets.connect('ws://localhost:8787/') as websocket:
        
        name = "David"
        email = "david.hockley@gmail.com"
        password = getpass.getpass("What's your password? ")


        data = await get_jwt(email, password)
        jwt = data["data"]["short_jwt"]
        print(jwt)
        await websocket.send("auth:{}".format(jwt))

        await websocket.send("hiya:{}".format(name))
        print(f"> {name}")
        greeting = await websocket.recv()
        print(f"< {greeting}")

asyncio.get_event_loop().run_until_complete(hello())