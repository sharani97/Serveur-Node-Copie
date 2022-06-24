/**
 * Created by D. Hockley.
 */

import mongoose = require('mongoose');
import Constants = require('./../../config/constants/constants');

// mongoose.plugin(schema => { schema.options.usePushEach = true });

// https://blog.cloudboost.io/i-wish-i-knew-how-to-use-mongodb-connection-in-aws-lambda-f91cd2694ae5

class DataAccess {
    static mongooseInstance: any;
    static mongooseConnection: mongoose.Connection;

    static connect (): mongoose.Connection {

        if (this.mongooseInstance) {
            return this.mongooseInstance;
        }

        console.log('(pre)Connecting to mongodb.', Constants.DB_CONNECTION_STRING);

        this.mongooseConnection = mongoose.createConnection(Constants.DB_CONNECTION_STRING);
        this.mongooseConnection.once('open', () => {
            console.log('Connected to mongodb.', Constants.DB_CONNECTION_STRING);
        });

        this.mongooseInstance = mongoose.connect(Constants.DB_CONNECTION_STRING);
        //mongoose.set('useCreateIndex', true);

        return this.mongooseInstance;
    }

    constructor () {
        DataAccess.connect();
    }
}

DataAccess.connect();
export = DataAccess;