
import UserModel = require('./UserModel');
import PointsModel = require('./PointsModel');

interface UserActionResponse {
    status: string;
    messages: [string];
    rewards?: PointsModel[];
    user: UserModel;
    data?: any;
}

export = UserActionResponse;