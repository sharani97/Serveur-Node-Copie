import { ResolverMap } from "../../types/graphql";
import { toGraph, toBuffer, fromCursor, toObjectId } from "../shared/tools";
import User = require("../../app/dataAccess/schemas/UserSchema");
import Points = require("../../app/dataAccess/schemas/PointsSchema");
import Friends = require("../../app/dataAccess/schemas/FriendshipSchema");
import Post = require("../../app/dataAccess/schemas/PostSchema");
import Like = require("../../app/dataAccess/schemas/LikeSchema");
import Comment = require("../../app/dataAccess/schemas/CommentSchema");

import MessagePage = require("../../app/dataAccess/schemas/MessagePageSchema");

import { FriendUtilities } from "../../app/utilities/FriendUtilities";
import { UserContext } from "../shared/types";
import { PostUtilities } from "../../app/utilities/PostUtilities";
import { LikeUtilities } from "../../app/utilities/LikeUtilities";
import LikeModel = require("../../app/model/interfaces/LikeModel");
import { ChatUtilities } from "../../app/utilities/ChatUtilities";
import Conversation = require("../../app/model/interfaces/ConversationModel");

import { PostInput, PostFilter, PostFilterInput, LikeInput, IdInput } from "./types";
import PostModel = require("../../app/model/interfaces/PostModel");
import { FileUtilities } from "../../app/utilities/FileUtilities";

import * as roles from "../../config/constants/roles"; //config/constants/jobtypes';
import { UserUtilities } from "../../app/utilities/UserUtilities";
import JwtUser = require("../../app/model/interfaces/JwtUser");
import { post } from "@typegoose/typegoose";

async function getPosts(user: JwtUser, input: PostFilter) {
  if (input && input.filter == "FRIENDS") {
    return await PostUtilities.getPosts(user);
  } else {

    let query = {};
    let limit = 0;

    if (input && input.limit) {
      limit = input.limit;
    }

    if (input && input.cursor) {
      try { 
        let cursor = toObjectId(input.cursor);
        if (limit == 0) { 
          limit = 20;
        }
        query = {
          _id: {$lt: cursor}
        }
      } catch(e) {
        // ignore
      }
    }


    return await Post.find(query).sort({_id: -1}).limit(limit).exec();
  }
}


export const resolvers: ResolverMap = {
  // const missionSchema = map['missions'];
  // const userSchema = map['users'];
  //

  Conversation: {
    async target_id(obj: Conversation, args, context: UserContext, info) {
      if (context.user) {
        if (obj.usr1.toString() == context.user.id) {
          return obj.usr2.toString();
        } else {
          return obj.usr1.toString();
        }
      }
    },
    async messages(obj: Conversation, args, context: UserContext, info) {
      let page = await MessagePage.findOne({
        conversation: obj._id,
        nb: obj.current_page
      }).exec();

      if (page) {
        return page.messages || [];
      } else {
        return [];
      }
    },
    async unread(obj: Conversation, args, context: UserContext, info) {
      // getFullConversations
      return await ChatUtilities.getUnreadInConversation$(context.user, obj);
    }
  },
  Post: {
    async creator(obj, args, context: UserContext, info) {
      if (obj.creator_id) {
        let usr = await User.findById(obj.creator_id).exec(); // needs clean !
        return toGraph(usr);
      }
    },

    async comment_nb(obj, args, context, info) {
      return await Comment.count({
        target_id: toObjectId(obj._id)
      }).exec();
    },

    // likes_up likes_down comments liked
    async likes_up(obj, args, context, info) {
      return await Like.count({
        target_id: toObjectId(obj._id),
        meaning: "like",
        nb: 1
      }).exec();
    },
    async likes_down(obj, args, context, info) {
      return await Like.count({
        target_id: toObjectId(obj._id),
        meaning: "like",
        nb: -1
      }).exec();
    },

    async liked(obj, args, context: any, info) {
      const ulik = await Like.count({
        target_id: toObjectId(obj._id),
        meaning: "like",
        user_id: toObjectId(context.user.id)
      }).exec();
      return ulik > 0;
    }
  },

  Query: {
    async findUser(parent, { email }, context: UserContext, info) {
      if (context.user) {
        const user = await User.findOne({ email }).exec();
        return toGraph(user);
      }
    },

    async findUsers(parent, { input }, context: UserContext, info) {
      if (!context.user) {
        return;
      }
      return await UserUtilities.findUsers(input);
    },
    async conversation(parent, { user }, context: UserContext, info) {
      if (context.user) {
        return await ChatUtilities.getOrCreateConversation$(context.user, user);
      }
    },
    async conversations(parent, _, context: UserContext, info) {
      if (context.user) {
        return await ChatUtilities.getFullConversations$(context.user);
      }
    },
    async currentPosts(
      parent,
      { input }: PostFilterInput,
      context: UserContext,
      info
    ) {
      if (context.user) {
        let posts = await getPosts(context.user, input);
        return toGraph(posts);
      }
    },
    async currentPostPage(
      parent,
      { input }: PostFilterInput, 
      context: UserContext
    ) {
      if (context.user) {
        let posts = await getPosts(context.user, input);

        let startCursor = posts[1]._id;

        let endCursor = posts[post.length-1]._id;

        return { 
          posts, startCursor, endCursor
        }
      }
    }


  },

  Mutation: {
    async setReadMessage(obj, { input }, context:UserContext, info) {
      if (context.user) {
        let other_user = input.other_user_id;
        let message_id = input.message_id;
        return await ChatUtilities.setReadMessage$(context.user, other_user, message_id);
      }
    },
    async sendMessage(obj, { user, message }, context: UserContext, info) {
      if (context.user) {
        return await ChatUtilities.sendMessage$(context.user, user, message);
      }
    },

    async updatePost(parent, { input }: PostInput, context: UserContext, info) {
      if (context.user) {
      }
    },

    async deletePost(parent, { id }: IdInput, context: UserContext, info) {
      if (context.user) {
        if (
          context.user.roles.indexOf(roles.DEV) == -1 ||
          context.user.roles.indexOf(roles.ADMIN) == -1
        ) {
          let post = await Post.findById(id).exec();
          if (post.creator_id.toString() !== context.user.id.toString()) {
            throw new Error("error.user_no_admin_or_owner");
          }
        }

        // now we are ok
        let ret = await Post.deleteOne({ _id: toObjectId(id) }).exec();
        return true;
      }
    },

    async createPost(parent, { input }: PostInput, context: UserContext, info) {
      if (context.user) {
        let img = false;

        /*
              if (input.b64image && input.b64image.buffer) {
                  img = true;
              }*/

        let p = <PostModel>{
          creator_id: context.user.id,
          title: input.title,
          description: input.description
        };

        if (input.image_url) {
          p.image_url = input.image_url;
        }

        if (input.urldata && input.urldata.link) {
          p.urldata = input.urldata;
        }

        let post = await PostUtilities.create(context.user, p);

        return toGraph(post);
      }
    },
    async requestFriend(obj, { other_user }, context: any, info) {
      if (context.user) {
        let friend = await FriendUtilities.addFriend$(context.user, other_user);
        return toGraph(friend);
      }
    },
    async likeItem(obj, { input }: LikeInput, context: any, info) {
      if (context.user) {
        if (input.nb == undefined) {
          input.nb = 0;
        }

        const _like: LikeModel = <LikeModel>{
          target_id: input.target_id,
          nb: input.nb,
          user_id: context.user.id,
          meaning: input.meaning || "like",
          target_type: input.target_type || "item"
        };
        let { like, reward } = await LikeUtilities.like$(_like, context.user);
        return { like: toGraph(like), reward };
      }
    }
  }
};
