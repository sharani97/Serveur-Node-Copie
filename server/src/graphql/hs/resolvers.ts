import { ResolverMap } from '../../types/graphql';
import { toGraph, toObjectId } from '../shared/tools';
import Friends = require('../../app/dataAccess/schemas/FriendshipSchema')

import Episode = require ('../../app/dataAccess/schemas/EpisodeSchema');
import Series = require('../../app/dataAccess/schemas/SeriesSchema');
import SeriesModel = require('../../app/model/interfaces/SeriesModel');
import EpisodeModel = require('../../app/model/interfaces/EpisodeModel');


export const resolvers: ResolverMap = {
    Query: {

      async series( obj, args, context:any, info) {
        let _series = await Series.find({}).lean().exec();
        return toGraph(_series);
      },
      async serie( obj, {_id}, context:any, info) { // not sure about _id in args, could be { }
          let _serie = await Series.findById(_id).lean().exec();
          return toGraph(_serie);
      },
      async serieById( obj, {id}, context:any, info) { // not sure about _id in args, could be { }
        let _serie = await Series.find({id}).lean().exec();
        return toGraph(_serie);
      }
    },
    Mutation: {
      async createSeries( obj, {input }, context:any, info) { // not sure about _id in args, could be { }
        let _series = <SeriesModel> input;
        let series = new Series(_series);
        await series.save();
        return toGraph(series);
      },
      async createEpisode( obj, {input }, context:any, info) { // not sure about _id in args, could be { }
        let _episode = <EpisodeModel> input;
        let episode = new Episode(_episode);
        await episode.save();
        return toGraph(episode);
      }

    },

    Series: {

      async episodes ( obj, args, context:any, info)  {
        if (obj._id) {
            return toGraph(await Episode.find({'series_id':toObjectId(obj._id)}).lean().exec());
        }
        return null
      }
    }
}