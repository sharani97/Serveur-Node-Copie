const { gql } = require ("apollo-server-express");
export const typeDefs = gql`



input SeriesInput {
    title: String!
    id: String!
    description: String
}

type Series {
    _id: ID
    id: String
    title: String,
    description: String
    created:String
    episodes: [Episode]
}

input EpisodeInput {
    title: String!
    id: String
    description: String
}
type Episode {
    _id: ID
    title: String,
    description: String
    id: String
    url: String,
    nb: Int,
    season: String,
    series_id: String
    created:String
}

type Query {
    series: [Series]
    serie(_id:ID) : Series
    serieById(id:String): Series
}

type Mutation {
    createSeries(input: SeriesInput): Series
    createEpisode(input: EpisodeInput): Episode
}



`;
/*
            title:   {type: String, required: true, text: true},
            description: String,
            id: {type: String, unique : true, required:true, lowercase:true },
            url: String,
            nb: Number,
            season: String,
            series_id: { type:Schema.Types.ObjectId, ref:'Series'}
            created:String

*/