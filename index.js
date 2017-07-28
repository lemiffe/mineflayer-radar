module.exports = init;
const vec3 = require('vec3');

function init(mineflayer) {
    return inject;
}

function inject(bot, options) {
    options = options || {};
    var path = require('path'),
        express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        port = options.port || 0,
        host = options.host || '0.0.0.0';

    io.set('log level', 0);

    app.use(express.static(path.join(__dirname, 'public')));

    server.listen(port, function() {
        console.info("Listening at http://" + host + ":" + server.address().port);
    });

    io.sockets.on('connection', function (socket) {
        bot.on('move', function() {
            socket.emit('entity', bot.entity);
            socket.emit('blocks', ['green']);
            let underbot = vec3(bot.entity.position.x, bot.entity.position.y - 1, bot.entity.position.z);
            let block = bot.blockAt(underbot);
            if (block) {
                console.log(block.type, block.name);
            }
        });

        bot.on('entitySpawn', function(entity) {
            socket.emit('entitySpawn', entity);
        });

        bot.on('entityGone', function(entity) {
            socket.emit('entityGone', entity);
        });

        bot.on('entityMoved', function(entity) {
            socket.emit('entityMoved', entity);
        });

        socket.on('controlState', function(state) {
            bot.setControlState(state.name, state.value);
        });

        socket.on('look', function(look) {
            bot.look(look.yaw, look.pitch);
        });
    });
}
