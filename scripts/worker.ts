
//let server = require('../server/src/server').app;
let config = require('config');
let env:string = config.util.getEnv('NODE_ENV') || process.env.NODE_ENV || 'developement'; // process.env.NODE_ENV

console.log(env)

process.title = 'ts-worker';

import randomstring = require('randomstring');
import bcrypt = require('bcrypt-nodejs');
import Job   = require('../server/src/app/dataAccess/schemas/JobSchema');

let aws = require('aws-sdk');
aws.config.update({region:'eu-west-1'});
let ses = new aws.SES({apiVersion: '2010-12-01'});

/*

async function SaveAndSend(email) {
}


function sendEmail(email, password) {


    console.log('sending email');
    // this sends the email
    // @todo - add HTML version
    ses.sendEmail({
       Source: from,
       Destination: { ToAddresses: to },
       Message: {
           Subject: {
              Data: 'Email'
           },
           Body: {
               Text: {
                   Data: `Your password : ${g}`,
               }
            }
       }
    }
    , function(err, data) {
        if(err) {
            console.log('error');
            console.log(err);
        } else {
            console.log('Email sent:');
            console.log(data);
        }
        process.exit();
     });
}

*/

console.log("in script");

function checkForJobs() {

    console.log("in check for jobs");

    let date = new Date();
    console.log(date);

    Job.find({'state': 'new', 'exec_at':{$lt:date}}, (err, job) => {
        console.log(job)
        process.exit();
    });


}



checkForJobs();

// send email




