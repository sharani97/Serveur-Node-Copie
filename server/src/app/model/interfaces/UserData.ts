
import PointsModel = require('./PointsModel');
import IPoints = require('./Points');
import CoreUserData = require('./CoreUserData')

interface UserData extends CoreUserData{
//    _id : string,
//    username : string,
//    name: string,
    first_name?:string,
//    roles : string[],
    orgs:string[],
    ents:string[],
    entorgs:string[],
    //ent_orgs:string[],
    // groups:groups,
    points:IPoints[],
    profileUrl:string,
//    jwt: string,
//    short_jwt:string,
    settings:Object
}

export = UserData;