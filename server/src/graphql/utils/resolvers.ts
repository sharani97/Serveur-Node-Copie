import { ResolverMap } from '../../types/graphql';
import { toGraph, toCursor, fromCursor, toObjectId } from '../shared/tools';
import { UserContext } from '../shared/types';
import { FileUtilities } from '../../app/utilities/FileUtilities';
import { UserUtilities } from '../../app/utilities/UserUtilities';

import * as roles from '../../config/constants/roles'; //config/constants/jobtypes';

const metascraper = require('metascraper')([
    require('metascraper-author')(),
    require('metascraper-description')(),
    require('metascraper-image')(),
    require('metascraper-publisher')(),
    require('metascraper-title')(),
    require('metascraper-url')()
  ])

const requestImageSize = require('request-image-size');

const got = require('got')

interface UrlInput {
    targetUrl: string
}

interface ImageInput {
    input:{
        buffer: string,
        path: string,
        originalname: string
    }
}

interface CheckInput {
    field: string,
    value: string
}



export const resolvers: ResolverMap = {

    Mutation : {
        async uploadBase64Image( obj, { input }:ImageInput, context:UserContext, info) {
            if (!context.user) {
                return null;
            }

            var raw = new Buffer(input.buffer.toString(), 'base64');
            let name = input.originalname;
            let ext = name.split('.').pop();
            return await FileUtilities.uploadBuffer(raw, context.user.id, ext, true);
        }
    },

    Query : {

        async available(obj, {field, value}:CheckInput, context, info) {
            return await UserUtilities.checkAvailability(field, value);
        },

        async scrape ( obj, {targetUrl}:UrlInput, context:UserContext, info) {

            if (!context.user) {
                return null;
            }

            let size:{[key:string]:string} = {}
            const { body: html, url } = await got(targetUrl);
            const metadata = await metascraper({ html, url });

            if (metadata.publisher) {
                metadata.site = metadata.publisher;
            }

            if (metadata.description) {
                metadata.desc = metadata.description;
            }

            if (metadata.url) {
                metadata.link = metadata.url;
            }
            if (metadata.image) {
                let img = metadata.image;
                size = await requestImageSize(img);
                if (size) {
                    metadata.img_width = Number(size.width);
                    metadata.img_height = Number(size.height);
                    metadata.img_type = size.type;
                }
            }

            return metadata;
        }

    }

}