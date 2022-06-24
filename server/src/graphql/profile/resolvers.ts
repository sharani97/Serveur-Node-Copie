// import { ResolverMap } from '../../types/graphql';
import { toGraph, toCursor, fromCursor, toObjectId } from '../shared/tools';

import User = require('../../app/dataAccess/schemas/UserSchema');


import Points = require('../../app/dataAccess/schemas/PointsSchema');
import Notif = require('../../app/dataAccess/schemas/NotifSchema');
import Friends = require('../../app/dataAccess/schemas/FriendshipSchema')

import { SchemaMap } from '../shared/tools'
import { FriendUtilities } from '../../app/utilities/FriendUtilities';
import { UserContext } from '../shared/types';
import mongoose = require('mongoose');

interface settingsItem {
  key: string,
  value: string
}

export function resolverFactory(map:SchemaMap) {

    const missionSchema = map['missions'];
    // const userSchema = map['users'];

    return {
        Mutation : {
            async updateSettings(obj, {input}, context:UserContext, info) {
                if (context.user) {
                    let _usr = await User.findById(context.user.id).exec();
                    _usr.settings = input;
                    await _usr.save();
                    return toGraph({me:_usr});
                }
            },
            async updateSettingsList(obj, {input}:{input:[settingsItem]}, context:UserContext, info) {
              if (context.user) {
                  let _usr = await User.findById(context.user.id).exec();
                  for(let item of input) {

                    if (item.value == 'true') {
                      _usr.settings[item.key] = true;
                      continue;
                    }

                    if (item.value == 'false') {
                      _usr.settings[item.key] = false;
                      continue;
                    }

                    let val = Number(item.value);
                    if (isNaN(val)) {
                      _usr.settings[item.key] = item.value;
                    } else {
                      _usr.settings[item.key] = val;
                    }
                  }
                  
                  await _usr.save();
                  return toGraph({me:_usr});
              }
          },
            async updateMe(obj, {user }, context:UserContext, info) {
                if (context.user) {
                    console.log(user);
                    let _usr = await User.findById(context.user.id).exec();
                    for(var key of Object.keys(user)) {
                        if (key != '_id') {
                            _usr[key] = user[key];
                            if (key == 'username') {
                                _usr['id'] = (user[key] as string).toLowerCase()
                            }
                        }
                    }
                    await _usr.save();
                    return toGraph({me:_usr});
                }
            },
            async deleteNotif(obj, {_id}:{_id:string}, context:UserContext, info) {
              if (context.user) {
                let ret = await Notif.remove({
                  _id:new mongoose.Types.ObjectId(_id),
                  target:new mongoose.Types.ObjectId(context.user.id)
                }).exec();
                return (ret.n == 1);
              }
            }
        },
        Query : {
            async me ( obj, args, context:any, info) {
                if (context.user) {
                    let _usr = toGraph(await User.findById(context.user.id).lean().exec());
                    return _usr;
                }
                return null
            },

            async user(obj, {id}, context:any, info) {
                if (context.user) {
                    let _usr = toGraph(await User.findById(id).lean().exec());
                    return _usr;
                }
                return null
            },
            async users(obj, {ids}:{ids:[string]}, context:any, info) {
                if (context.user) {

                    let _ids = [];
                    for (let user_id of ids) {
                        _ids.push(toObjectId(user_id));
                    }

                    let _usrs = toGraph(await User.find({_id:{$in:_ids}}).lean().exec());
                    return _usrs;
                }
                return null
            }


        },
        Friendship: {
            async user( obj, args, context:UserContext, info) {
                if (obj.other) {
                    let usr = await User.findById(obj.other).exec(); // needs clean !
                    return toGraph(usr);
                }
            },
    
        },
        Notif : {
            async date(obj, args, context:any, info) {
                return obj.date || obj.created; // logically if this gets called, date is missing
            }
        },

        User : {

            async notifs ( obj, args, context:any, info) {
                if (context.user) {
                    return toGraph(await Notif.find({'target':toObjectId(context.user.id)}).sort({updated:-1}).limit(20).lean().exec());
                }
                return null
            },

            async friend_count( obj, args, context:any, info) {
                if (obj._id) {
                    const uid = toObjectId(obj._id);

                    return await Friends.count({
                        '$or':[
                            {'to':uid, 'state':'ok'},
                            {'from':uid, 'state':'ok'}]
                    }).exec();
                }
            },

            settingList( obj, args, context:any, info) {
              let ret = [];
              let setting:{[key:string]:any} = obj.settings || {};
              for(let key in setting) {
                ret.push({
                  key,
                  value: String(setting[key])
                })
              }
              return ret;

            },

            async friends ( obj, args, context:any, info) {
                if (obj._id) {
                    let friends = await Friends.find({
                        '$or':[ 
                            {'to':toObjectId(obj._id)}, 
                            {'from':toObjectId(obj._id)}
                        ]
                    }).lean().exec();

                    for (let friend of friends) {
                        if (friend.from.toString() == obj._id.toString()) {
                            friend.other = friend.to;
                        } else {
                            friend.other = friend.from;
                        }
                    }

                    return toGraph(friends);
                }
                return null
            },

            async points( obj, args, context:any, info) {
                let _points = await Points.find({'dom':null, 'user': toObjectId(obj._id)}).lean().exec();
                return toGraph(_points);
            }
        }

    }
}