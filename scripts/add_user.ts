
let server = require('../server/src/server').app;
import randomstring = require('randomstring');
import bcrypt = require('bcrypt-nodejs');
import User   = require('../server/src/app/dataAccess/schemas/UserSchema');

let aws = require('aws-sdk');
aws.config.update({region:'eu-west-1'});
let ses = new aws.SES({apiVersion: '2010-12-01'});

let myArgs = process.argv.slice(2);

let email = myArgs[0];

let password = ''

if (myArgs.length > 1) {
    password = myArgs[1];
}


    

var to = [email]

// this must relate to a verified SES account
var from = 'david.hockley@gmail.com'


console.log(password)

if (!bcrypt.compareSync(password, "$2a$10$jtR05kCSpB/3an1nswM0Xe1i7v/UQGVa8m1nWoWLpGHiAHr/ZSvx2")) {
    console.log('please enter a valid password !')
    process.exit();
}



// generate password
let g:string; 

if (myArgs.length > 2) {
    g = myArgs[2];
} else {

    g = randomstring.generate({
        length: 12,
        charset: 'alphabetic'
    });

}

// save user
let userData = {

    token: bcrypt.hashSync(g),
    username: email.split('@')[0],
    name: email.split('@')[0],
    email: email,
    auth_type: 'email',
    roles: ['admin'],
    points:[
        {
            name: 'xp',
            amount:0
        }
    ]
};


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


User.findOne({ 'email' : email}, (err, user) => {
    if (err || (user == null)) {
        let newUser = new User(userData).save().then(() => {
            console.log('user was saved');
            console.log(newUser);
            sendEmail(email, g);
        }).catch(e => {
            console.log('unable to save');
            process.exit();
        });
    } else {
        console.log('that user already exixts sorry');
        process.exit();
    }
});

// send email




