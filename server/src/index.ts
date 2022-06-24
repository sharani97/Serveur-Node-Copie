let app = require('./server').app;
let server_setup = require('./server').setup;
let path = require('path');
let http = require('http');
let ws_setup = require('./wsserver').ws_setup

let server = http.createServer(app);

global.lambda = !!process.env.LAMBDA_TASK_ROOT;
global.appRoot = path.resolve(__dirname);

server_setup().then(() => {

    if (!global.lambda) {
        ws_setup(server);
    }

    server.listen(app.get('port'), function(){
        // var host = server.address().address;
        var port = server.address().port;
        console.log('🚀 Server listening on port:' + port);
    });
});

module.exports = server; // for test suite