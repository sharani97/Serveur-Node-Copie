/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import express = require('express');
import LoginRoutes = require('../routes/LoginRoutes');
import ProfileRoutes = require('../routes/ProfileRoutes');
import UserRoutes = require('../routes/UserRoutes');
import CommentRoutes = require('../routes/CommentRoutes');
import LikeRoutes = require('../routes/LikeRoutes');

import ConversationRoutes = require('../routes/ConversationRoutes');
import MessagePageRoutes = require('../routes/MessagePageRoutes');

import OrganizationRoutes = require('../routes/OrganizationRoutes');
import EntityRoutes = require('../routes/EntityRoutes');
import JobRoutes = require('../routes/JobRoutes');
import ActionRoutes = require('../routes/ActionRoutes');
import SystemEventRoutes = require('./SystemEventRoutes');


import SeriesRoutes = require('./SeriesRoutes');
import EpisodeRoutes = require('./EpisodeRoutes');

import PostRoutes = require('../routes/PostRoutes');

import GroupRoutes = require('../routes/GroupRoutes');
import UploadRoutes = require('../routes/UploadRoutes');
import CheckRoutes = require('../routes/CheckRoutes');

import TestItemRoutes = require('../routes/TestItemRoutes');

import NotifRoutes = require('../routes/NotifRoutes');

import UrlRoutes = require('../routes/UrlRoutes');

import FileRoutes = require('../routes/FileRoutes');

const app = express();

class Routes {
    get routes() {
        app.use('/me',     new ProfileRoutes().routes);
        app.use('/users',     new UserRoutes().routes);
        app.use('/comments',  new CommentRoutes().routes);
        app.use('/likes',  new LikeRoutes().routes);

        app.use('/messages',  new MessagePageRoutes().routes);
        app.use('/conversations',  new ConversationRoutes().routes);
        app.use('/entities',    new EntityRoutes().routes);
        app.use('/orgs',    new OrganizationRoutes().routes);
        app.use('/actions',   new ActionRoutes().routes);


        app.use('/posts',     new PostRoutes().routes);

        app.use('/files',     new FileRoutes().routes);

        app.use('/jobs',     new JobRoutes().routes);
        app.use('/actions',   new ActionRoutes().routes);
        app.use('/groups',   new GroupRoutes().routes);
        app.use('/upload',   new UploadRoutes().routes);
        app.use('/check',   new CheckRoutes().routes);
        app.use('/notifs',   new NotifRoutes().routes);
        app.use('/urls',   new UrlRoutes().routes);
        app.use('/testitems',   new TestItemRoutes().routes);

        app.use('/eps',   new EpisodeRoutes().routes);
        app.use('/series',   new SeriesRoutes().routes);

        app.use('/', new LoginRoutes().routes);
        return app;
    }
}
export = Routes;
