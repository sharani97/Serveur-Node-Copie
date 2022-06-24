
let server = require('../server/src/server').app;
import bcrypt = require('bcrypt-nodejs');
import User   = require('../server/src/app/dataAccess/schemas/UserSchema');



let myArgs = process.argv.slice(2);

let email = myArgs[0];

let password = ''

if (myArgs.length > 1) {
    password = myArgs[1];
}

console.log(password)

if (!bcrypt.compareSync(password, "$2a$10$jtR05kCSpB/3an1nswM0Xe1i7v/UQGVa8m1nWoWLpGHiAHr/ZSvx2")) {
    console.log('please enter a valid password !')
    process.exit();
}

User.findOne({ 'email' : email}, (err, user) => {
    console.log('user : ', user);
    if (err || (user == null)) {
        console.log('no such user');
        process.exit();
    } else {
        User.remove({_id: user._id}).then(() => {
            console.log('user removed');
            process.exit();
        }).catch((e) => {
            console.log(e);
        });
    }
});

// send email




