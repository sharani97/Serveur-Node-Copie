/**
 * Created by D. Hockley on 15-06-2017.
 */

import express = require('express');
import Controller = require('./../../controllers/ProfileController');
import Permits = require('./../../middleware/Permits');

let router = express.Router();

class ProfileRoutes {
    private _controller: Controller;
    protected _permits: Permits;
    protected router: any;
    constructor () {
        this._controller = new Controller();
        this._permits = new Permits('profile');
        this.router = router;
    }

    get routes () {
        let acl = this._permits;
        this.router.use(acl.getUser);
        const controller = this._controller;
        this.router.put('/', this._permits.checkRole, this._controller.updateUser);
        this.router.put('/password', this._permits.checkRole, this._controller.updatePassword);
        this.router.get('/settings', this._permits.checkRole, this._controller.getSettings);

        this.router.put('/delete', this._permits.checkRole, this._controller.requestDelete);

        this.router.get('/conversations', this._permits.checkRole, this._controller.getConversations);
        this.router.get('/conversations/:user_id', this._permits.checkRole, this._controller.getConversation);
        
        this.router.get('/messages', this._permits.checkRole, this._controller.getCurrentMessages);
        this.router.post('/messages', this._permits.checkRole, this._controller.sendMessageToUser);
        this.router.get('/messages/:user_id', this._permits.checkRole, this._controller.getOrCreateConversation);
        this.router.get('/messages/:user_id/', this._permits.checkRole, this._controller.getOrCreateConversation);
        
        this.router.put('/messages/:user_id/read/:message_id', this._permits.checkRole, this._controller.setReadMessage);


        this.router.get('/users/:id', this._permits.checkRole, this._controller.getUser);
        this.router.get('/users/', this._permits.checkRole, this._controller.getUsers);

        /*
        this.router.get('/likes/:id', this._permits.checkRole, this._controller.getNotifs);
        this.router.put('/likes', this._permits.checkRole, this._controller.getNotifs);

        this.router.get('/comments/:id', this._permits.checkRole, this._controller.getNotifs);
        this.router.put('/comments', this._permits.checkRole, this._controller.getNotifs);
        */
        
        this.router.get('/notifs', this._permits.checkRole, this._controller.getNotifs);
        this.router.get('/notifs/:id/', this._permits.checkRole, this._controller.getNotif);
        this.router.delete('/notifs/:id', this._permits.checkRole, this._controller.deleteNotif);
        this.router.put('/notifs/read', this._permits.checkRole, this._controller.setRead);
        this.router.put('/notifs/:_id/read', this._permits.checkRole, this._controller.setRead);
        this.router.put('/notifs/:_id/flag', this._permits.checkRole, this._controller.checkNotif);
        

        this.router.put('/token', this._permits.checkRole, this._controller.updatePushToken);
        this.router.delete('/token/:tok', this._permits.checkRole, this._controller.removeToken);

        this.router.get('/points', this._permits.checkRole, this._controller.getPoints);
        
        this.router.put('/settings', this._permits.checkRole, this._controller.updateSettings);
        this.router.get('/adminorgs', this._permits.checkRole, this._controller.getAdminOrgs);

       
        this.router.get('/posts/', this._permits.checkRole, this._controller.getPosts);

        this.router.get('/friends', this._permits.checkRole, this._controller.getFriends);
        // this.router.get('/users', this._permits.checkRole, this._controller.getFriends);

        this.router.put('/friends/:id', this._permits.checkRole, this._controller.addFriend);
        this.router.delete('/friends/:id', this._permits.checkRole, this._controller.removeFriend);
        
        this.router.get('/finduser/:_name',  acl.checkRole, controller.findUser);

        return router;
    }


}

Object.seal(ProfileRoutes);
export = ProfileRoutes;