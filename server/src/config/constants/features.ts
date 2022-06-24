

let config = require('config');
//...
let feats = config.get('features');

class AppFeatures {
    static missions:boolean = feats.missions;
}


Object.seal(AppFeatures);
export = AppFeatures;