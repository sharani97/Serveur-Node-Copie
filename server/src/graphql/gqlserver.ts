const { ApolloServer, gql, AuthenticationError, apolloUploadExpress } = require('apollo-server-express');

import Permits = require('../middleware/Permits');

import {mergeSchemas, makeExecutableSchema, addMockFunctionsToSchema} from "graphql-tools";
import { GraphQLSchema } from "graphql";
const modules = ['core', 'login', 'units', 'social', 'hs', 'utils', 'admin'] //, 'users'];

//const { profile } = require(`./profile/schema.graphql`)


import { TestItemResolver, schema as TestItemSchema } from '../app/resolvers/TestItemResolver';

const schemas:GraphQLSchema[] = [];
const logger = { log: e => console.log(e) }

interface SchemaMap { [key:string]:GraphQLSchema}

const schemaMap: SchemaMap = {}

export async function bootstrap(app, path) {

  console.log("in bootstrap for graphQL server")

  for (let dir of modules) {
    console.log(` gql dir ${dir}`);

    const { typeDefs } = require(`./${dir}/schema.graphql`)
    const { resolvers } = require(`./${dir}/resolvers`);
    console.log('making exec schema');
    const schema = makeExecutableSchema({
      resolvers,
      typeDefs,
      logger,
      allowUndefinedInResolve: true
    });
    schemaMap[dir] = schema;
    // addMockFunctionsToSchema({ schema })
    console.log('pushing schema');
    schemas.push(schema)
  }

  console.log("adding linkTypeDefs to schemas");

  const { linkTypeDefs } = require(`./profile/schema.graphql`)

  schemas.push(linkTypeDefs)

  const { resolverFactory } = require('./profile/resolvers')

  // expressServer.use(bodyParser.json({limit: '5mb'}));

  //schemas.push(profile);
  //schemas.push(await TestItemSchema());
  // schemas.push(resolvers)

  console.log("next, making gqlschema ");
  let gqlserver;
  try {
    gqlserver = new ApolloServer({
        schema: mergeSchemas(
          {
            schemas:schemas,
            resolvers:resolverFactory(schemaMap)
          }),
        playground: true, // process.env.NODE_ENV !== 'prod',
        formatError: error => {
          console.log(error);
          return error;
        },
        formatResponse: response => {
          return response;
        },
        logging: { level: 'DEBUG'   // Engine Proxy logging level. DEBUG, INFO, WARN or ERROR
      },
      context: async ({ req }) => {
        try {
          let user = await Permits.verifyToken$(req);

          if (!user) return {};
          return { user }
        } catch (err) {
          console.log(err)
          return {}
        }
      }
    });
  } catch(e) {
    console.log(e);
  }

  console.log("applying middle ware with app and path")
  //export { gqlserver };

  gqlserver.applyMiddleware({ app, path });
}


