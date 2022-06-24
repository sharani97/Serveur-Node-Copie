import {
    DirectiveLocation,
    GraphQLDirective,
} from "graphql";

import { SchemaDirectiveVisitor } from "graphql-tools";

class AuthDirective extends SchemaDirectiveVisitor {
    static getDirectiveDeclaration(directiveName, schema) {
        return new GraphQLDirective({
        name: directiveName,
        locations: [
            DirectiveLocation.OBJECT,
            DirectiveLocation.FIELD_DEFINITION,
        ],
        args: {
            requires: {
            // Having the schema available here is important for
            // obtaining references to existing type objects, such
            // as the Role enum.
            type: schema.getType('Role'),
            defaultValue: 'ADMIN',
            }
        }
        });
    }
}