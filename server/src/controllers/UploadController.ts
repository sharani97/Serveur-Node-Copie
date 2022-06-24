
import express = require('express');


import Job = require('./../app/dataAccess/schemas/JobSchema');

import File = require('./../app/dataAccess/schemas/FileSchema');
import CoreController = require('./CoreController');

import randomstring = require('randomstring');

import UserReq = require('../middleware/UserReq');
import { FileUtilities, FileData } from '../app/utilities/FileUtilities';

const config = require('config');
const fileconfig = config.get('files');
const bucket = fileconfig.image.s3;

const fs = require('fs');
let aws_conf = config.get('aws');
let aws = require('aws-sdk');

aws.config.update({signatureVersion: 'v4', region:'eu-west-3'});

let S3 = new aws.S3(aws_conf);




interface MulterFile {
  key?: string; // Available using `S3`.
  path?: string; // Available using `DiskStorage`.
  mimetype: string;
  filename?: string;
  encoding?:string;
  originalname: string;
  size: number;
  buffer?: string | Buffer;
}


class UploadController extends CoreController {

    python_path:string;

    constructor () {
        super();
        this.uploadContract = this.uploadContract.bind(this);
        this.uploadForJob = this.uploadForJob.bind(this);
        this.doJob = this.doJob.bind(this);
        this.uploadb64Image = this.uploadb64Image.bind(this);
        this.uploadImage = this.uploadImage.bind(this);
        this.getSignedUploadURL = this.getSignedUploadURL.bind(this);

        let os = require('os');

        if (os.platform() === 'win32') {
            this.python_path = "python"
        } else {
            this.python_path = "python3"
        }

    }

    doJob(job, callback) {

        /*
        let PythonShell = require('python-shell');
        let options = {
          mode: 'text',
          pythonPath: this.python_path,
          pythonOptions: ['-u'],
          scriptPath: './scripts/',
          args: [JSON.stringify(job), Constants.ENV]
        };
        //console.log(options);

        PythonShell.run('dojob.py', options, function (err, results) {
          console.log(err, results);
          if (err) callback(err, null);
          // results is an array consisting of messages collected during execution
          console.log('results: %j', results);
          callback(null, results);
        });
        */

        /*
        let spawn = require('child_process').spawn;

        const process = spawn(config.python, ['./scripts/dojob.py', JSON.stringify(job)]);

        process.stdout.on('data', function (data){
            console.log('stdout: ' + data);
        });

        process.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        process.on('close', function (code) {
            console.log('child process exited with code ' + code);
            if (callback) {
                callback();
            }
        });*/

    }

    uploadForJob(req: UserReq.IUserRequest & { file: MulterFile}, res: express.Response): void {
        try {

            let user = req.user;
            let body = req.body;
            let body_payload:Object;

            if (body == undefined) {
                body_payload = {}
            } else {
                body_payload = body;



                /*
                :job_type/:id
                */

            }

            if (req.params.type) {
                body_payload['type'] = req.params.type;
            }

            if (req.params.id) {
                body_payload['group'] = req.params.id;
            }

            let g = randomstring.generate({
                length: 20,
                charset: 'alphabetic'
            });

            body_payload['file'] = g + '.csv'

            let orig = req.file.path;
            let root = global["appRoot"] || __dirname;
            let dest = root + '/../public/job/' + g + '.csv';

            fs.writeFile(dest, fs.readFileSync(orig),  function (err) {
                if (err) {
                    console.log(err);
                    this.requestError(res, err);
                }

                let job = {
                    creator_id:user.id,
                    task: "CSV_JOB",
                    payload: body_payload,
                    progress:0,
                    state:"new"
                };

                let newJob = new Job(job);

                newJob.save().then(()=>{
                    res.send(newJob);
                }).catch(function(err) {
                    console.log(err)
                    this.requestError(res, err);
                });

            });


        } catch (e)  {
            console.log(e)
            this.requestError(res, e);
        }
    }



    uploadb64Image(req: UserReq.IUserRequest & { file: MulterFile}, res: express.Response): void {
        try {


            var raw = new Buffer(req.file.buffer.toString(), 'base64')

            let orig = req.file.path;
            let name = req.file.originalname
            let ext = name.split('.').pop();

            FileUtilities.uploadBuffer(raw, req.user.id, ext, true).then((file) => {
                res.send(file);
            }).catch((err)=> {
                this.requestError(res, err);
            });

        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }


    getSignedUploadURL(req: UserReq.IUserRequest, res: express.Response): void {
      try {
          let user = req.user.id;
          let filedata = req.body as FileData;
          FileUtilities.getSignedFileUrl(user, filedata).then((ret) => {
            res.send(ret);
          }).catch((err) => {
            console.log(err);
            this.requestError(res, err);
          })
      } catch (e)  {
          console.log(e);
          res.send({'error': 'error in your request'});
      }
    }

    declareUploadedS3File(req: UserReq.IUserRequest, res: express.Response): void {
      try {
          let user = req.user.id;
          let filedata = req.body as FileData;
          FileUtilities.updateFile(user, filedata).then((ret) => {
            res.send({'status':'ok'});
          }).catch((err) => {
            console.log(err);
            this.requestError(res, err);
          })
      } catch (e)  {
          console.log(e);
          res.send({'error': 'error in your request'});
      }
    }


    uploadImage(req: UserReq.IUserRequest & { file: MulterFile}, res: express.Response): void {
        try {
            console.log("in upload image");
            let orig = req.file.path;
            let name = req.file.originalname
            let ext = name.split('.').pop();

            FileUtilities.uploadBuffer(fs.readFileSync(orig), req.user.id, ext, true).then((file) => {
                console.log('got file, sending');
                res.send(file);
            }).catch((err)=> {
                console.log(err);
                this.requestError(res, err);
            });

        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }


    uploadImageOld(req: UserReq.IUserRequest & { file: MulterFile}, res: express.Response): void {
        try {
            let orig = req.file.path;
            let name = req.file.originalname

            let ext = name.split('.').pop();
            let file = new File({
                creator_id: req.user.id,
                ext: ext, // extension, 3 letters
                filetype:'image',
            })
            let root = global["appRoot"] || __dirname;
            let newPath = root + `/../public/images/${file._id}.${ext}`;

            let cb = function (err) {
                if (!err) {
                    file.save().then(() => {
                        res.send(file);
                    }).catch((err)=> {
                        this.requestError(res, err);
                    })
                } else {
                    this.requestError(res, err);
                }
            };
            fs.writeFile(newPath, fs.readFileSync(orig), cb);
            // fs.writeFile(newPath, raw, cb);

        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }




    uploadContract(req: UserReq.IUserRequest & { file: MulterFile}, res: express.Response): void {
        try {
            let orig = req.file.path;
            let newPath = __dirname + '/../../../client/assets/contracts/' + req.file.originalname;
            fs.writeFile(newPath, fs.readFileSync(orig), function (err) {
                    if (!err) {
                        res.send({'status': 'ok'});
                    } else {
                        res.send({'error': err});
                    }
            });
        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }

}

export = UploadController;