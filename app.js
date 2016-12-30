var http = require('http');
var socket = require('socket.io');
var fs = require('fs');
var express = require('express');
var phaser = require('phaser');

var html = fs.readFileSync('app.html', 'utf-8');

var app = express();
var server = http.createServer(app);
var io = socket(server);

app.use( express.static('./static'));

app.get('/', function(req, res) {
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
});

server.listen( process.env.PORT || 3000 );


io.on('connection', function(socket) {
    console.log('client connected:' + socket.id);
    socket.on('chat message', function(data) {
        io.emit('chat message', data); // do wszystkich
        //socket.emit('chat message', data); tylko do połączonego
    })
});

setInterval( function() {
    var date = new Date().toString();
    io.emit( 'message', date.toString() );
}, 1000 );

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
}

function create() {
}

function update() {
}
game.add.sprite(0, 0, 'star');

console.log( 'server listens' );
