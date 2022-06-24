const jwt = require('jsonwebtoken')

import configAuth = require('./config/constants/auth');
import mongoose = require('mongoose');

import * as WebSocket from 'ws';

import * as jobtypes from './config/constants/jobtypes';
import Url = require('./app/model/interfaces/Url');
import Message = require('./app/model/interfaces/Message');
import { ChatUtilities } from './app/utilities/ChatUtilities';
import { JobUtilities } from './app/utilities/JobUtilities';


const ERR = "err_";
const AUTH = "auth";
const ECHO = "echo";
const DATA = "data";
const MSG = "mesg";
const JMSG = "jmsg";
const PONG = "pong";
const PING = "ping";
const OK = "ok";
const JACT = "jact";

let activeClients = {}

class customWS extends WebSocket {
    id: string;
    _id:mongoose.Types.ObjectId;
    isAlive: boolean;
}

let debug = false;

function debug_log(message) {
    if (debug) {
        console.log(message);
    }
}



function verifyClient (info, cb) {
    var token = info.req.headers.token // no tokens in general case so fuggetaboutit
    if (!token)
        cb(false, 401, 'Unauthorized')
    else {
        jwt.verify(token, configAuth.jwtSecret, function (err, decoded) {
            if (err) {
                cb(false, 401, 'Unauthorized')
            } else {
                info.req.user = decoded
                cb(true)
            }
        })

    }
}

function auth(token, ws:customWS) {

    jwt.verify(token, configAuth.jwtSecret, (err, decoded) => {
        if (!err) {
            let userData = {
                id: decoded.sub,
                username: decoded.username,
                ws:ws
            }
            ws.id = decoded.sub;
            activeClients[decoded.sub] = userData
            console.log('sending auth ok');
            ws.send(`${AUTH}|ok`);
        } else {

            ws.send(`${ERR}|${err}`);
        }
    });
}

// setup common logic

function json_message(data, ws:customWS) {

    if (ws.id == undefined) {
        debug_log(' needs sign in');
        ws.send(ws.send(`${ERR}|sign_in`));
        return;
    }

    if (ws._id == undefined) {
        debug_log(` get id from ${ws.id}`);
        ws._id = new mongoose.Types.ObjectId(ws.id);
    }

    let from = ws._id;
    let payload = JSON.parse(data)
    // manage full message

}





function message(data:string, ws:customWS, is_json = false) {
    // is the user authenticated ?

    // debug_log(`got message : ${data}`)

    if (ws.id == undefined) {
        if (ws._id != undefined) {
            ws.id = ws._id.toHexString();
        } else {
            debug_log(' needs sign in');
            ws.send(`${ERR}|sign_in`)
            return;
        }
    }

    if (ws._id == undefined) {
        debug_log(` get id from ${ws.id}`);
        ws._id = new mongoose.Types.ObjectId(ws.id);
    }

    let from = ws._id;
    let msg:string;
    let target:string;
    let urldata:Url = null;
    let etag = null;

    if (is_json) {

        let msg_data:Message = <Message> JSON.parse(data);
        msg = msg_data.msg;
        urldata = msg_data.urldata;
        target = msg_data.to;
        etag = msg_data.etag;

    } else {

            // get id :
        let bits = data.split('|',2);

        if (bits.length < 2) {
            ws.send(`${ERR}|specify_to`)
            return;
        }
        target = bits[0];
        msg = bits[1];

    }


    // add conversation

    let user = activeClients[ws.id] // wait, why do I need this ? I have id and ws ...

    let push = (activeClients[target] == undefined);

    // we need to go through the controller to get the _id

    // skip push in controller, try locally
    ChatUtilities.sendMessage$(user, target, msg, false, urldata).then((ret)=> {
        debug_log(` controller back for message : ${msg}`);
        let obj = JSON.stringify({
            from:ws.id,
            _id:ret._id,
            to:target,
            msg:msg,
            urldata:urldata,
            etag:etag
        });

        let out = `${JMSG}|${obj}`;
        debug_log('sending message out back');
        ws.send(out)

        if (push ==false) {
            try {
                activeClients[target].ws.send(out, (error) => {
                    if (error) {
                        activeClients[target] = undefined
                        push = true
                    }
                });
            } catch (err) {
                activeClients[target] = undefined;
                push = true
            }
        }

        JobUtilities.addJob$(user,
            jobtypes.WARN_USER_MESSAGED, {
            from:ws.id,
            to:target,
            msg:msg,
            push: push,
            urdata: urldata
        }).then((done)=>{
            // nope
            //console.log("notif sent");
        }).catch((err) => {
            console.log(err)
        })

    })


}





function manage_message(stub, rest, ws) {

    console.log("managing message, ", stub);

    switch(stub) {
        case ECHO:
            ws.send(rest);
            break;
        case PING:
            ws.send(PONG);
            break;
        case DATA:
            ws.send(DATA);
            break;
        case AUTH:
            auth(rest, ws);
            break;
        case JMSG:
            message(rest, ws, true);
            break;
        case MSG:
            message(rest, ws);
            break;
        default:
            ws.send(OK);
    }
}

function ws_setup(server) {

    let wss:WebSocket.Server

    wss = new WebSocket.Server({
        server,
        //verifyClient:verifyClient
    });

    function noop() {}

    function heartbeat() {
        this.isAlive = true;
    }

    wss.on('connection', (_ws: WebSocket) => {
        let ws = _ws as customWS;
        ws.isAlive = true;

        ws.on('pong', heartbeat);

        /*
        const interval = setInterval(function ping() {
            console.log("checking all clients")
            wss.clients.forEach(function each(_ws) {

                let ws = _ws as customWS;
                if (ws.isAlive === false) {
                    console.log("terminating inactive client");
                    activeClients[ws.id] = undefined;
                    return ws.terminate();
                }
                // pinging client
                ws.isAlive = false;
                ws.ping(noop);
            });
        }, 30000);
        */


        //connection is up, let's add a simple simple event
        ws.on('message', (message: string) => {
            let stub = message.substring(0,4);
            let rest = message.substring(5);
            manage_message(stub, rest, ws);
        });
    });






    /*
    //send immediatly a feedback to the incoming connection
    ws.send('Hi there, I am a WebSocket server');

    wss.on('connection', (ws: WebSocket) => {

        console.log('on connexion');
        //connection is up, let's add a simple simple event
        ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);

            const broadcastRegex = /^broadcast\:/;
            if (broadcastRegex.test(message)) {
                message = message.replace(broadcastRegex, '');

                //send back the message to the other clients
                wss.clients
                    .forEach(client => {
                        if (client != ws) {
                            client.send(`Hello, broadcast message -> ${message}`);
                        }
                    });

            } else {
                ws.send(`Hello, you sent -> ${message}`);
            }
    });
        //send immediatly a feedback to the incoming connection
        ws.send('Hi there, I am a WebSocket server');
    });
    */

    return wss;
}






export { ws_setup };