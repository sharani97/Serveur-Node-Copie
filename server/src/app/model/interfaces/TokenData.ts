

import mongoose = require('mongoose');


interface TokenData {
    os: string, // eg. xp etc.
    token:string, // can refer to other objects 
    updated:Date, // mission, xp, etc.
    device:String
}

export = TokenData;