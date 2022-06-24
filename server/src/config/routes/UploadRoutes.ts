/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/UploadController');
import Permits = require('./../../middleware/Permits');
import multer = require('multer');


class UploadRoutes {
    private _controller: Controller;
    protected _permits: Permits;
    protected _router:any;

    constructor () {
        this._controller = new Controller();
        this._permits = new Permits('upload');
        this._router = express.Router();
    }

    get routes () {

        // console.log("dirname ", __dirname, "public/uploads/");

        let root = global["appRoot"] || __dirname;
        // console.log("/!\\ **** root path **** ", root);
        let controller = this._controller;
        let acl = this._permits;
        this._router.use(acl.getUser);

        const uploading = multer({
            dest: root+'/../public/uploads/',
            limits: {fileSize: 10000000, files: 1}
        });

        console.log("MULTER DONE")

        const b64upload = multer({ storage: multer.memoryStorage({}) })

        // router.use(uploading);

        this._router.post('/csv/', this._permits.checkRole, uploading.single('file'),  controller.uploadForJob);
        this._router.post('/csv/:type/:id', this._permits.checkRole, uploading.single('file'),  controller.uploadForJob);
        this._router.post('/image/', uploading.single('file'), controller.uploadImage);
        this._router.post('/b64image/', b64upload.single('file'), controller.uploadb64Image);
        
        this._router.post('/signedurl/', this._permits.checkRole, controller.getSignedUploadURL);
        
        this._router.post('/', uploading.single('file'), controller.uploadContract);
        return this._router;
    }


}

Object.seal(UploadRoutes);
export = UploadRoutes;