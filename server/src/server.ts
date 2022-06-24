
import "reflect-metadata";

import express = require('express');

import BaseRoutes = require('./config/routes/Routes');
import bodyParser = require('body-parser');

import path = require('path');
const YAML = require('yamljs');

global['appRoot'] = path.resolve(__dirname);

// const swaggerUi = require('swagger-ui-express');

process.title = 'gcore';

//const swaggerDocument = require('./swagger/api.json');
//const swaggerDocument = YAML.load('./swagger/api.yaml');

let config = require('config');
let cors = require('cors');
let nunjucks = require('nunjucks');

let env:string = config.util.getEnv('NODE_ENV') || process.env.NODE_ENV || 'developement'; // process.env.NODE_ENV
let port: number = config.get('port') || process.env.PORT || 3000;

/*
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({ colorize: true })
  ]
});
logger.level = 'debug';
logger.info('Hello world');
logger.debug('Debugging info');*/

import { bootstrap } from './graphql/gqlserver';

let app = express();
//var expressWs = require('express-ws')(app);
//import { gqlserver } from './graphql/gqlserver';
//let bootstrap = require('./graphql/gqlserver';


let setup_done = false;

async function setup() {

    if (setup_done == false) {
        setup_done = true;
    } else {
        return;
    }

    await bootstrap(app, '/graphql');


    app.set('port', port);

    nunjucks.configure('views', {
        autoescape: true,
        express: app
    });
    app.engine( 'html', nunjucks.render);
    app.set( 'view engine', 'html' );
    //console.log("loaded nunjucks")
    //console.log(nunjucks.render('ok.html', {title: 'test'}));


    app.use('/libs', express.static(path.resolve(__dirname, '../client/libs')));

    // for system.js to work. Can be removed if bundling.
    // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    
    if(env == 'prod') {
        //use morgan to log at command line
        let morgan = require('morgan');
        let logger = morgan('combined');
        app.use(logger);
    }

    app.use('/api', cors(), new BaseRoutes().routes);

    if (env !== 'prod'){
        app.use(function(err, req: express.Request, res: express.Response, next: express.NextFunction) {
            res.status(err.status || 500);
            res.json({
                error: err,
                message: err.message
            });
        });
    }


    // catch 404 and forward to error handler
    app.use(function(req: express.Request, res: express.Response, next) {
        let err = new Error('Not Found');
        next(err);
    });

    app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        res.status(err.status || 500);
        res.json({
            error: {},
            message: err.message
        });
    });

}

// setup();

export { app, setup }
