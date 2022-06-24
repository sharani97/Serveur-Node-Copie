
import { IRegisterOnMutationArguments, ILoginOnMutationArguments } from './interfaces'
import { ResolverMap } from '../../types/graphql';
import LoginController = require('../../controllers/LoginController');
import { FileUtilities, FileData } from '../../app/utilities/FileUtilities';
import { UserContext } from '../shared/types';

interface FileRequestInput {
  input: FileData
}

interface FileIdInput {
  file_id: string
}

export const resolvers: ResolverMap = {
    Query: {
        hello: (_, {name}) => {
            // console.log('in hello resolver');
            return `Hello ${name || 'worldness'}!`;
        },
    },
    Mutation : {
        register: async ( _, {user} : IRegisterOnMutationArguments) => {
            let _controller = new LoginController();
            let _user = await _controller.core_register$(user);
            if (_user) {
                return _controller.makeJWT(_user);
            }
        },
        login: async ( _, {email, password}: ILoginOnMutationArguments) => {
            let _controller = new LoginController();
            let user = await _controller.core_login$(email, password);
            if (user) {
                return _controller.makeJWT(user);
            }
        },
        getSignedUrl: async (_, {input}:FileRequestInput, context:UserContext) => {
          if (context.user) {
            return await FileUtilities.getSignedFileUrl(context.user.id, input);
          }
        },
        fileUploadComplete: async (_, {input}:FileRequestInput, context:UserContext) => {
          if (context.user) {
            await FileUtilities.updateFile(context.user.id, input);
            // to do :
            // get file 
            // add jobs for check resize ?
            // or check syncronously ?
            return true
          }
        }
    }
}