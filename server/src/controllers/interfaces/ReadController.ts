/**
 * Created by D. Hockley.
 */

import express = require('express');
interface ReadController {
    retrieve: express.RequestHandler;
    findById: express.RequestHandler;
retrievePage: express.RequestHandler;
       count: express.RequestHandler;
   findQuery: express.RequestHandler;
    findLike: express.RequestHandler;
    findTopLike: express.RequestHandler;
      search: express.RequestHandler;
  searchText: express.RequestHandler;
    findName: express.RequestHandler;
    findRange: express.RequestHandler;
}
export = ReadController;