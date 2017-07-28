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
            let blocks = [];
            const y = bot.entity.position.y - 1;
            for (let x = Math.round(bot.entity.position.x) - 1; Math.round(bot.entity.position.x) + 1; x++) {
                for (let z = Math.round(bot.entity.position.z) - 1; Math.round(bot.entity.position.z) + 1; z++) {
                    const x = bot.entity.position.x;
                    const z = bot.entity.position.z;
                    let pos = vec3(x, y, z);
                    let block = bot.blockAt(pos);
                    if (block && block.position) {
                        blocks.push({type: block.type, name: block.name, x: block.position.x, z: block.position.z});
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
