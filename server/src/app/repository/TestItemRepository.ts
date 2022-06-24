/**
 * Created by DH
 */

import { TestItemModel as Schema, TestItem as IModel} from '../model/TestItem';

import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;
