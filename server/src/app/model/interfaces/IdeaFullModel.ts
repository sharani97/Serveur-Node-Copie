/**
 * Created by D. Hockley.
 */


import IdeaModel = require('./IdeaModel');
import UserModel = require('./UserModel');
import Url = require('./Url');

interface IdeaFullModel {
    idea:IdeaModel;
    creator:UserModel;
    likes:{[key:number]:number};
    votes:{[key:number]:number};
    investors:{[key:number]:number};
    comments:number;
    suggestions:number;
}

export =  IdeaFullModel;