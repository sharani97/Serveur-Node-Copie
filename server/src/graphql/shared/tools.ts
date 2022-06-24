
import { GraphQLSchema } from "graphql";

import mongoose = require('mongoose');

export interface SchemaMap { [key:string]:GraphQLSchema}

export const toGraph = function(obj) {
    return JSON.parse(JSON.stringify(obj))
}

export const toCursor = function( str:string) {
    let buff = new Buffer(str);
    return buff.toString('base64');
}


export const toBuffer = function( str:string) {
    return new Buffer(str, 'base64');
}

export const fromCursor = function( str:string) {
    let buff = new Buffer(str, 'base64');
    return buff.toString('ascii');
}

export const toObjectId = function (str:string) {
    return new mongoose.Types.ObjectId(str)
}

/*
toCursor, fromCursor


*/
