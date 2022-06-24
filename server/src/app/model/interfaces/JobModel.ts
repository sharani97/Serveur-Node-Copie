/**
 * Created by D. Hockley.
 */

import ItemModel = require('./OrgItemModel');

interface JobModel extends ItemModel {
    creator_id: string;
    exec_at:Date;
    task: string; // generate reports, send emails, etc.
    progress: number; // not sure this is useful
    state: string; // enum, : new, failed, started, finished_ok...
    exec_ts?: number; // execution timestamp
    payload: Object;
    output?: Object;
}

export = JobModel;
