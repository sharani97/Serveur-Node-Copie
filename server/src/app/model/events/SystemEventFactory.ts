import Event = require('../SystemEventModel');
import IEventModel = require('../interfaces/SystemEventModel');
// import OrgaItem = require('../interfaces/OrgaItemModel');

import mongoose = require('mongoose');

class SystemEventFactory<Doc extends mongoose.Document> {

    type:string;

    static eventList():Array<string> {
        return [];
    }

    constructor() {
    }

    init() {
        this.type = 'undefined';
    }

    initEvent(after:Doc):IEventModel {

        let e = <IEventModel> {
            id: this.type+":"+after.id+":", // hum ...
            creator_id: undefined,
            target:after.id,
            target_type: this.type,
            payload:{},
            type:'undefined',
            // org: after['organization']?after['organization']:undefined
            // id: ??
        };

        if (after['org']) {
            e.org = after['org'];
        }
        return e;
    }

    getEvent(field:string, after:Doc, before:Doc):IEventModel {

        let e = this.initEvent(after);

        let new_value = after[field];
        let prev_value = before[field];

        switch(field) {

            case 'id': // okay this should not really happen (but we might as well complain)
                e.type = `${this.type}_CHANGED_${field}`.toUpperCase();
                e.payload = {before: prev_value, after: new_value };
                return e;

            case 'state':
                let t = `${this.type}_${new_value}`.toUpperCase();
                e.type = (t.substr(t.length - 1) == 'E') ? t +'D': t +'ED';
                return e;

            default:
                return undefined;
        }

    }

    generateEvents(before:Doc, after:Doc):Array<IEventModel> {

        let events:Array<IEventModel>;
        events = []

        for (let field in after) {
            if (before[field] != after[field]) {
                let ret = this.getEvent(field, after, before);
                if (ret) {
                    events.push(ret);
                }
            }
        }
        return events;
    }

}

export = SystemEventFactory;