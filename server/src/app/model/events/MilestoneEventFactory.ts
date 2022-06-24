
/*
import IModel = require('../interfaces/MilestoneModel');
import Event = require('../EventModel');
import IEventModel = require('../interfaces/EventModel');
import EventFactory = require('./EventFactory');


export class MilestoneEvents extends EventFactory<IModel> {

    static DELAYED:'MILESTONE_DELAYED';
    static CANCELLED:'MILESTONE_CANCELLED';
    static INVOICED:'MILESTONE_INVOICED';

    static eventList():Array<string> {
        return [
            MilestoneEvents.DELAYED,
            MilestoneEvents.CANCELLED,
            MilestoneEvents.INVOICED
        ]
    }

    getEvent(field:string, after:IModel, before:IModel):IEventModel {

        let e = this.initEvent(after);

        let new_value = after[field];
        let prev_value = before[field];

        switch(field) {
            // already managed in parent ?
            case 'date':
                if (new_value > prev_value) {
                    e.type = MilestoneEvents.DELAYED
                    return e;
                }

        }

        return super.getEvent(field, after, before);

    }


}*/