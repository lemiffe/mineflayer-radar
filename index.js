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
        bot.on('move', function () {
            socket.emit('entity', bot.entity);
        });

        setTimeout(function () {
            setInterval(function () {
                if (bot && bot.entity && bot.entity.position) {
                    const botY = Math.round(bot.entity.position.y);
                    const botX = Math.round(bot.entity.position.x);
                    const botZ = Math.round(bot.entity.position.z);
                    let blocks = {
                        "-2": [],
                        "-1": [],
                        "0": [],
                        "1": [],
                    };
                    for (let y = botY - 2; y <= botY + 1; y++) {
                        for (let x = botX - 8; x <= botX + 8; x++) {
                            for (let z = botZ - 4; z <= botZ + 4; z++) {
                                let pos = vec3(x, y, z);
                                let block = bot.blockAt(pos);
                                if (block && block.position) {
                                    const key = (y - botY).toString();
                                    blocks[key].push({type: block.type, x: block.position.x, z: block.position.z});
                                }
                            }
                        }
                    }

                    socket.emit('blocks', blocks);
                }
            }, 400);
        }, 6000);

        bot.on('entitySpawn', function (entity) {
            socket.emit('entitySpawn', entity);
        });

        bot.on('entityGone', function (entity) {
            socket.emit('entityGone', entity);
        });

        bot.on('entityMoved', function (entity) {
            socket.emit('entityMoved', entity);
        });

        socket.on('controlState', function (state) {
            bot.setControlState(state.name, state.value);
        });

        socket.on('look', function (look) {
            bot.look(look.yaw, look.pitch);
        });

        socket.on('chat', function (obj) {
            bot.chat(obj.text);
        });

        bot.on('chat', (username, message) => {
            socket.emit('chatReceived', {user: username, message: message});
        });
    });
}
