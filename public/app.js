(function() {
    const io = window.io,
        socket = io.connect(),
        canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d'),
        drawInterval = setInterval(draw, 50);

    let botEntity = null,
        blocks = [],
        entities = {};

    // add tabindex property to canvas so that it can receive keyboard input
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', onKeyDown, false);
    canvas.addEventListener('keyup', onKeyUp, false);
    canvas.addEventListener('mousedown', onMouseDown, false);

    socket.on('entity', function (newEntity) {
        botEntity = newEntity;
    });

    socket.on('entitySpawn', function (newEntity) {
        entities[newEntity.id] = newEntity;
    });

    socket.on('entityMoved', function (newEntity) {
        entities[newEntity.id] = newEntity;
    });

    socket.on('entityGone', function(oldEntity) {
        delete entities[oldEntity.id];
    });

    socket.on('blocks', function (newBlocks) {
        if (newBlocks !== null && newBlocks !== 0 && Array.isArray(newBlocks) && newBlocks.length > 0) {
            blocks = newBlocks;
        }
    });

    let colours = {
        white: '#ffffff',
        black: '#000000',
        brown: '#9b7729',
        green: '#00cc00',
        stone: '#bbbbbb',
        red: '#ff0000',
    };

    let blockColours = {
        1: '#5D5D5D',
        2: '#77B350',
        3: '#A37450',
        4: '#606060',
        5: '#A88754',
        6: '#1F9010',
        7: '#666666',
        8: '#284292',
        9: '#284292',
        10: '#BC3904',
        11: '#BC3904',
        12: '#E0D6A6',
        13: '#786C6C',
        14: '#8C7958',
        15: '#837164',
        16: '#222222',
        17: '#463315',
        18: '#357B16',
    };

    let imgArrow = new Image(),
        imgBlueArrow = new Image(),
        imgRedArrow = new Image(),
        w = canvas.width,
        h = canvas.height,
        centerX = w / 2,
        centerZ = h / 2,
        xFromMc = w / 100,
        zFromMc = h / 100;

    imgArrow.src = '/arrow.png';
    imgBlueArrow.src = '/arrow-blue.png';
    imgRedArrow.src = '/arrow-red.png';

    function draw() {
        if (!botEntity) return;

        // Fill with black
        context.fillStyle = colours['black'];
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Ground
        if (blocks && Array.isArray(blocks) && blocks.length > 0) {
            blocks.forEach(function(block) {
                context.fillStyle = blockColours[block.type] || colours['red'];
                const x = centerX + xFromMc * (block.x - botEntity.position.x);
                const z = centerZ + zFromMc * (block.z - botEntity.position.z);
                context.fillRect(x - 5, z - 5, 10, 10);
            });
        }

        // Arrow in the middle that represents bot
        context.save();
        context.translate(centerX, centerZ);
        context.rotate(1.5 * Math.PI - botEntity.yaw);
        context.drawImage(imgArrow, 0, 0, 12, 12, -6, -6, 12, 12);
        context.restore();

        // Entities
        for (let entityId in entities) {
            const entity = entities[entityId];
            if (entity.username && entity.username === botEntity.username) continue;

            const x = centerX + xFromMc * (entity.position.x - botEntity.position.x);
            const z = centerZ + zFromMc * (entity.position.z - botEntity.position.z);
            context.save();
            context.translate(x, z);
            context.rotate(1.5 * Math.PI - entity.yaw);
            context.drawImage(imgBlueArrow, 0, 0, 12, 12, -6, -6, 12, 12);
            context.restore();

            context.fillStyle = colours['white'];
            context.textBaseline = 'center';
            context.fillText(entityText(entity), x, z - 20);
        }

        // Debug
        context.fillStyle = colours['white'];
        context.textBaseline = "top";
        context.fillText("yaw: " + botEntity.yaw, 0, 0);
    }

    function entityText(entity) {
        return entity.username || entity.mobType || entity.objectType || entity.type;
    }

    function onKeyDown(event) {
        return onKeyEvent(event, true);
    }

    function onKeyUp(event) {
        return onKeyEvent(event, false);
    }

    function onKeyEvent(event, value) {
        var key = event.which;
        if (key === 37 || key === 65) {
            socket.emit('controlState', { name: 'left', value: value });
        } else if (key === 38 || key === 87) {
            socket.emit('controlState', { name: 'forward', value: value });
        } else if (key === 39 || key === 68) {
            socket.emit('controlState', { name: 'right', value: value });
        } else if (key === 40 || key === 83) {
            socket.emit('controlState', { name: 'back', value: value });
        } else if (key === 32) {
            socket.emit('controlState', { name: 'jump', value: value });
        }
        event.preventDefault();
        return false;
    }

    function onMouseDown(event) {
        canvas.addEventListener('mouseup', onMouseUp, false);
        canvas.addEventListener('mousemove', onMouseMove, false);
        var startYaw = botEntity.yaw;
        var startPitch = botEntity.pitch;
        var startX = event.offsetX == null ?
            (event.pageX - event.target.offsetLeft) : event.offsetX;
        var startZ = event.offsetZ == null ?
            (event.pageZ - event.target.offsetTop) : event.offsetZ;

        function onMouseUp(event) {
            canvas.removeEventListener('mouseup', onMouseUp, false);
            canvas.removeEventListener('mousemove', onMouseMove, false);
        }

        function onMouseMove(event) {
            var x = event.offsetX == null ?
                (event.pageX - event.target.offsetLeft) : event.offsetX;
            var z = event.offsetZ == null ?
                (event.pageZ - event.target.offsetTop) : event.offsetZ;
            var deltaYaw = (x - startX) * Math.PI * 2 / w;
            var deltaPitch = (z - startZ) * Math.PI * 2 / h;
            socket.emit('look', {
                yaw: startYaw + deltaYaw,
                pitch: startPitch + deltaPitch,
            });
        }
    }

}());
