var nodeExternals = require('webpack-node-externals');
var webpack = require('webpack');

/* helper function to get into build directory */

/*
var distPath = function (name) {
    if (undefined === name) {
        return path.join('dist');
    }
    return path.join('dist', name);
};
*/
// console.log(`compiling to ${distPath('server.js')}`)

var webpack_opts = {
    entry: {
        server: './server/src/index.ts',
        workers: './ts-workers/index.ts'
    },
    target: 'node',
    node: {
    __dirname: false,
    __filename: false,
    },
    output: {
        filename: '[name].js',
        libraryTarget: "commonjs2"
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [
            'node_modules',
            'src',
        ]
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                test: /\.(ts$)/,
                ts: {
                    compiler: 'typescript',
                    configFileName: 'tsconfig.json'
                },
                tslint: {
                    emitErrors: true,
                    failOnHint: true
                }
            }
        })
    ],
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: 'graphql-tag/loader'
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    },
    externals: [nodeExternals()]
};
module.exports = webpack_opts;
