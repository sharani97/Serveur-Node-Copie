/**
 * Created by D. Hockley.
 */

import express = require('express');
interface WriteController {
    create: express.RequestHandler;
    update: express.RequestHandler;
    delete: express.RequestHandler;
    deleteField: express.RequestHandler;
    action: express.RequestHandler;
    setField: express.RequestHandler;
}

export = WriteController;