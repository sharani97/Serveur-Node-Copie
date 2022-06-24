/**
 * Created by D. Hockley.
 */

import Repository = require('./../repository/JobRepository');
import IBusiness = require('./common/BaseBusiness');
import IModel = require('./../model/interfaces/JobModel');
import BaseBusiness = require('./BaseBusiness');
import SystemEventFactory = require ('./../model/events/SystemEventFactory');

class Business extends BaseBusiness<IModel, Repository, SystemEventFactory<IModel>> implements IBusiness<IModel> {

    init(): Repository {
        this._type = 'jobs';
        this._factory = new SystemEventFactory<IModel>();
        return new Repository();
    }

   create (item: IModel, callback: (error: any, result: any) => void) {
        this._repository.create(item, callback);
        // then tell python to get it's freaky on ! :D
        console.log(__dirname);

        let spawn = require('child_process').spawn;

        const process = spawn('python3', ['./scripts/checkjobs.py']);

        process.stdout.on('data', function (data){
            console.log('stdout: ' + data);
        });

        process.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        process.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });
    }
}


Object.seal(Business);
export = Business;
