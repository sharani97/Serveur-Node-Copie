import asyncio
import websockets

async def hello(uri):
    print("in hello")
    count = 0 
    async with websockets.connect(uri) as websocket:


        while websocket:
            stime = count*30+1
            print("in WITH, count ", count, ", next sleep in ", stime)

            await websocket.send("Hello world!")
            msg = await websocket.recv()
            print(msg)
            await asyncio.sleep(count*30+1)
            count = count + 1

asyncio.get_event_loop().run_until_complete(
    hello('ws://prod.idea-heroes.com:3010/'))