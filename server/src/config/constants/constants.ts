/**
 * Created by D. Hockley.
 */

// pretty sure this guarantees promise is set before mongoose connects :D

const mongoose = require('mongoose');
// mongoose.Promise = global.Promise;

let config = require('config');
//...
let dbConfig = config.get('dbConfig');

let MONGO_URI = process.env.MONGO_URI || dbConfig.host;

console.log(MONGO_URI,process.env.MONGO_URI, dbConfig.host, dbConfig.port, dbConfig.collection )

// console.log('MONGO_URI',MONGO_URI, config.util.getEnv('MONGO_URI'), process.env.MONGO_URI);

class Constants {

    static DB_CONNECTION_STRING: string = `mongodb://${MONGO_URI}:${dbConfig.port}/${dbConfig.collection}`;
    //process.env.NODE_ENV === 'production' ? process.env.dbURI : 'mongodb://localhost:27017/quickStart';
    static ENV:string = config.util.getEnv('NODE_ENV') || process.env.NODE_ENV || 'developement'; // process.env.NODE_ENV
    static APPNAME = config.get('appname');

}

Object.seal(Constants);
export = Constants;