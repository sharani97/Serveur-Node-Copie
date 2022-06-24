/**
 * Created by D. Hockley.
 */

import mongoose = require('mongoose');


interface EpisodeModel extends mongoose.Document {
    title:   string;
    description: string;
    id: string;
    url: string,
    nb: number;
    season: string;
    series_id: string;
}

export = EpisodeModel;
