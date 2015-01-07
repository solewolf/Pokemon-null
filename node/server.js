// Required modules/files
var app            = require('http').createServer(),
    settings       = require('../settings.json'),
    db             = require('./app/util/db'),
    io             = require('socket.io')(app),
    cookie         = require('cookie'),
    serverConsole  = require('./console/console'),
    colors         = require('colors'),

    echo           = serverConsole.echo;
    info           = serverConsole.info;
    //World   = require('./app/World');

// --------- Add session object to socket object for easy access -------- //
io.use(function(socket, next) {
    var data = socket.handshake || socket.request;
    socket.session_id = cookie.parse(data.headers.cookie)[settings.session.cookie.name];

    db.sessionDB.get(socket.session_id, function(err, session) {
        socket.session = session;
        socket.ip      = data.address;

        if(err) return next(err);

        if(!session) {
            info("user".grey, "Guest has connected from "+socket.ip);
            return next(new Error("No Session Found!"));
        }

        info("user".grey, socket.session.username+" has connected from "+socket.ip);
        next();
    });
});

io.use(function(socket, next) {
    io.sockets.sockets.forEach(function(sock) {
        if (sock.session.username == socket.session.username) {
            sock.emit('multiple logins', 'blah!');
            sock.disconnect(); // TODO use world.unloadPlayer(sock.session.username);
        }
    });
    next();
});

// --------- Add Player object to socket object for easy access -------- //
io.use(function(socket, next) {
    //World.loadPlayer(socket.session.username);   
    next();
});

// --------- Set up socket events here and pass them over to the engine -------- //
io.on('connection', function(socket) {
    socket.on('hey', function(data) {
        socket.emit('hey', socket.session.username);
    });

    socket.on('disconnect', function () {
        // Save modified session data back to server. Changes to the session object aren't automatically pushed to the db
        // This can be done with the following line:
        // db.sessionDB.set(socket.session_id, socket.session, function(err) {put error handling code here});
        info("user".grey, socket.session.username+" has disconnected from "+socket.ip);
    });
});

serverConsole.init({
    'io': io,
    'sockets': io.sockets.sockets
});
serverConsole.start();      // Console for the game server

app.listen(process.argv[2] || settings.game.port);
