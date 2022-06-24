#!/usr/bin/env python

# WS server example

import asyncio
import websockets


async def consumer_handler(websocket, path):
    
    msg = await websocket.recv()
    code = "none"
    remainder = "none"

    print(f"< {msg}")
    greeting = f"Hello {msg}!"
    await websocket.send(greeting)
    print(f"> {greeting}")


start_server = websockets.serve(consumer_handler, 'localhost', 9797)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()