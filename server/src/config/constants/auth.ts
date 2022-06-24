
let config = require('config');

class Auth {
    static jwtSecret:string = config.get('jwtSecret');
    static googleClientId:string = config.get('googleClientId');
    static googleClientSecret:string = config.get('googleClientSecret');
}

export = Auth;