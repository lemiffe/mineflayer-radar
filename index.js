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
            blocks = [];
            for (let x = bot.entity.position.x - 1; bot.entity.position.x + 1; x++) {
                for (let z = bot.entity.position.z - 1; bot.entity.position.z + 1; z++) {
                    let pos = vec3(x, bot.entity.position.y - 1, z);
                    let block = bot.blockAt(pos);
                    if (block) {
                        blocks.push({type: block.type, name: block.name, position: block.position});
                    }
                }
            }
            socket.emit('blocks', blocks);
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
