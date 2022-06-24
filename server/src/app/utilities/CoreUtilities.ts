import mongoose = require('mongoose');

export class CoreUtilities {

    static objectIdToBase64(data: mongoose.Types.ObjectId) {
        console.log('_id in ', data)
        let buff = Buffer.from(data.toHexString());
        let out = buff.toString('base64');
        console.log('b64', out)
        return out
    }

    static base64ToObjectId (data: string) {
        console.log('b64 in ', data);
        let buff = new Buffer(data, 'base64');
        let text = buff.toString('ascii');
        console.log('text ', text);
        let obj = new mongoose.Types.ObjectId(text);
        console.log('object id out', obj);
        return obj;
    }
    
}