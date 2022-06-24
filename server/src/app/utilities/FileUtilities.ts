import JwtUser = require('../model/interfaces/JwtUser');

import File = require('./../dataAccess/schemas/FileSchema');


import FileModel = require('./../model/interfaces/FileModel')


let config = require('config');

let aws_conf = config.get('aws');
let aws = require('aws-sdk');
let fileconfig = config.get('files');

aws.config.update({signatureVersion: 'v4', region:'eu-west-3'});
const bucket = fileconfig.image.s3;
const uploadBucket = fileconfig.image.uploadS3

// endpoint: 's3-eu-central-1.amazonaws.com',
// signatureVersion: 'v4',
// region: 'eu-central-1'
let S3 = new aws.S3(aws_conf);

interface SignedUploadResponse {
  url: string,
  file_id: string,
  final_url: string
}

export interface FileData {
  _id?: string,
  filename?: string,
  target_id: string,
  target_type: string,
}

export class FileUtilities {

    public static async updateFile(user_id: String, filedata: FileData):Promise<void> {

      let file = await File.findById(filedata._id);

      if (filedata.target_type) {
        file.target_type = filedata.target_type;
      }

      if (filedata.target_id) {
        file.target_id = filedata.target_id;
      }

      await file.save();

    }

    public static async getSignedFileUrl(user_id: String, filedata: FileData, imagetype:string = 'image', file_id:string = null):Promise<SignedUploadResponse> {

      let ext = FileUtilities.getExt(filedata.filename);

      let key = null;
      let final_url = null;

      if (file_id) {
        key = `${file_id}.${ext}`;
        final_url = `${fileconfig.image.url}/${key}`;

      } else {

        let target_id = null;
        let target_type = null;
        
        if (filedata.target_id) {
          target_id = filedata.target_id;
        }

        if (filedata.target_type) {
          target_type = filedata.target_type;
        }

        let file = new File({
          creator_id: user_id,
          ext: ext, // extension, 3 letters
          filetype: imagetype,
          bucket,
          target_id,
          target_type,
          status: 'pending'
        });

        file.key = `${file._id}.${ext}`;
        file.url = `${fileconfig.image.url}/${file.key}`
        final_url = file.url;

        key = file.key;
        file_id = file._id;

        await file.save();
      }

      let params = {
        Bucket: uploadBucket,
        Key: key,
        Expires: 300
      };

      let url = S3.getSignedUrl('putObject', params);

      return { url, file_id, final_url};

    }

    public static getExt(filename: string): string {
      return filename.split('.').pop();
    }


    public static async uploadBuffer(buf:Buffer, user_id: String, ext: String, _public=true, target_id:string = null, target_type:string = null):Promise<FileModel> {

        const bucket = fileconfig.image.s3;
        const url= fileconfig.image.url;
        // later : file.url = `${url}/${file.key}`

        console.log('uploading buffer, length is ', buf.length);

        let file = new File({
            creator_id: user_id,
            ext: ext, // extension, 3 letters
            filetype:'image',
            bucket,
            target_id,
            target_type
        });

        file.key = `${file._id}.${ext}`;

        let content_type = 'image/jpeg';
        if (ext != 'jpg') {
            content_type = `ìmage/${ext}`;
        }

        var data = {
            Key: file.key,
            Body: buf,
            // ContentEncoding: 'base64',
            ContentType: content_type,
            // StorageClass: new S3StorageClass("REDUCED_REDUNDANCY"),
            ACL: null
            // CannedACL: S3CannedACL.PublicRead
        };

        if (_public) {
            data.ACL = 'public-read'
        }

        console.log("upload to s3");

        const s3Bucket = new aws.S3({ params: {Bucket: bucket} } );
        const result = await s3Bucket.putObject(data).promise();


        console.log("save s3");

        file.url = `${url}/${file.key}`

        await file.save();

        /*
        let params = {
            Bucket: file.bucket,
            Key: file.key,
            Expires: 300
        };
        file.url = S3.getSignedUrl('getObject', params); //.replace(bad, good);
        */

        return file;

    }

    public static _addUrl(file:FileModel, ttl = 300):FileModel {

        if (file.bucket != 'local') {
            let params = {
                Bucket: file.bucket,
                Key: file.key,
                Expires: ttl
            };
            //S3.config.update({endpoint: `${file.bucket}.s3.amazonaws.com`});

            //let good = `http://${file.bucket}.s3.amazonaws.com`;
            //let bad = `https://s3.amazonaws.com/${file.bucket}`;
            file.url = S3.getSignedUrl('getObject', params); //.replace(bad, good);
        }
        return file;
    }

    public static async addUrl(file:FileModel, user:JwtUser):Promise<FileModel> {

        if (file.bucket == 'local') {
            // return FileUtilities._addUrl(file);
            return file;
        }
    }
}