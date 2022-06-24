import { TestItem, TestItemModel } from '../model/TestItem';
import { Resolver, Query, FieldResolver, Field, Arg, Ctx, Root, Mutation, Float, Int, InputType, buildSchema, Authorized } from "type-graphql";
import { plainToClass } from "class-transformer";
import * as path from "path";
import { GraphQLSchema } from 'graphql';
import JwtUser = require('../model/interfaces/JwtUser');

@InputType()
class NewItemInput {
  @Field()
  name: string;
}

/*
@ArgsType()
class RecipesArgs {
  @Field(type => Int, { nullable: true })
  @Min(0)
  skip: number = 0;

  @Field(type => Int, { nullable: true })
  @Min(1) @Max(50)
  take: number = 25;
}*/


@Resolver(of => TestItem)
export class TestItemResolver {

    @Query(returns => TestItem, {nullable:true})
    async testitem(@Arg("_id") _id:string): Promise<TestItem | undefined> {
        console.log("finding one test item");
        let item = await TestItemModel.findById(_id).exec();
        console.log("found it, returning it")
        return item;
    }

    @Query(returns => [TestItem], {nullable:true})
    async testitems(): Promise<Array<TestItem>> {
        console.log("finding all test items");
        let items:Array<TestItem>;
        try {
            items = await TestItemModel.find({}).exec();
        } catch(err) {
            console.log(err);
        }
        console.log("found them, there are ", items.length);
        return items;
    }

 
    @Mutation(returns => TestItem)
    //@Authorized('admin')
    async createTestItem(
            @Arg("item") item:NewItemInput, 
            //@Ctx("user") user: JwtUser
            ):Promise<TestItem> {
        let itm = new TestItemModel(item);
        await itm.save();
        return itm;
    }

}

export async function schema():Promise<GraphQLSchema> {
    return await buildSchema({
        resolvers:[TestItemResolver],
        emitSchemaFile: path.resolve(__dirname, 'schema.gql')
    })

}