
const { addMockFunctionsToSchema, gql, makeExecutableSchema } = require ("apollo-server-express");
import { GraphQLSchema } from "graphql";

const userSchema: GraphQLSchema = makeExecutableSchema({
    typeDefs: gql`

		type Query {
			allUsers: [User]
		}
		type Mutation {
			addUser(name: String!, surname: String!): User
			deleteUser(_id: String!): User
			updateUser(_id: String!, name: String, firstname: String): User
        }

        type Points {
            _id:    ID
            user:   String
            dom:    String
            cat:    String
            primary:Boolean
            amount: Int
            updated:String
            created:String
        }

        type Conversation {
            title:String
            dm: Boolean
            usr1: String
            usr2:String
            members:  [String] 
            current_page:Number
        }

        type Comment {
            creator_id: String
            target_id: String
            target_type: String
            title: String
            description:String
        }

        type Reward {
            points: [Points]
        }

        type NotificationToken {
			_id:    ID
			os:     String
            token:  String
            device: String
            updated:String
            created:String
        }

        enum Role {
            guest
            dev
            admin
            entadmin
            orgadmin
            tool
          }
          

		type User {
			_id:        ID
			name:       String
            firstname: String
            username: String
            roles:[Role],
            notificationTokens:[NotificationToken]
            status:      String
            profileUrl:  String
            settings:Object
            validated:Boolean
            points: [Points]
            updated:String
            created:String
		}
	`
});

addMockFunctionsToSchema({ schema: userSchema });

export default userSchema;
