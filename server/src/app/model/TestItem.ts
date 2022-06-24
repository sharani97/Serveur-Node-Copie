import { Field, ObjectType, Int, Float, ID } from "type-graphql";

import { prop, getModelForClass } from '@typegoose/typegoose';

// import { Model, SchemaField, model} from '@decorators/mongoose';
// const mongoose = require('mongoose');

import { Document, Model as MModel } from 'mongoose';


import DataAccess = require('../dataAccess/DataAccess');

//import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;


@ObjectType({description : 'A test item'})
// @Model('TestItem')
export class TestItem {

    @Field(type => ID, { description: "The item id" })
    _id: string;

    @Field({ nullable: true, description: "The recipe description with preparation info" })
    @prop()
    name?: string;
}


/*
@ObjectType({description : 'A test item'})
@Model('TestItem')
export class TestItem {

    @Field(type => ID, { description: "The item id" })
    _id: string;

    @Field({ nullable: true, description: "The recipe description with preparation info" })
    @SchemaField(String)
    name?: string;
}
*/


export interface TestItem extends Document{}

type TestItemType = MModel<TestItem> & typeof TestItem;

// export const TestItemModel:TestItemType = model(TestItem);
export const TestItemModel:TestItemType = getModelForClass(TestItem, {
    existingConnection : DataAccess.mongooseConnection, 
    existingMongoose: DataAccess.mongooseInstance
});
