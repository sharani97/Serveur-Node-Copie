
import PointsModel = require('./PointsModel');
import IPoints = require('./Points');

interface CoreUserData {
    _id : string,
    username : string,
    name: string,
    roles : string[],
    profileUrl:string,
    jwt?: string,
    short_jwt?:string,
    settings:Object
}

export = CoreUserData;