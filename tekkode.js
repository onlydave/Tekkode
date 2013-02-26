var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var jump_speed = 50;
var moving = null;
var gdir = null;
var prev = {};
var change = false;

server.listen(8000);

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

function player() {
	this.player_id = players.length + 1;
	this.nick = "default";
	this.p_left = 5;
	this.p_bottom = 2;
}

var players = {};

io.sockets.on('connection', function (socket) {

	socket.emit('joined', players);
  
	socket.on('add_player', function(data){
		var new_player = new player();
		new_player.nick = data.nick;
		players[data.nick] = new_player;
		// console.log(players);
		change=true;
	})

	socket.on('keydown', function(data){
		// console.log(data);
		if (data.key==68){
			move(1, data.nick);
			// console.log('move 1 '+data.nick);
		} else if (data.key==65){
			move(-1, data.nick);
		}
		if (data.key==87){
			jump_up(players[data.nick]);
		} 
	})

	socket.on('keyup', function(data){
		if (data.key==68){
			if (gdir == 1)
				clearTimeout(moving);
		} else if (data.key==65){
			if (gdir == -1)
				clearTimeout(moving);
		} else if (data.key==87){
		}  
	})

});

function move(dir, nick){
	gdir = dir;
	// console.log("move: "+nick);
	// console.log(players[nick].p_left);
	clearTimeout(moving);
	players[nick].p_left+=dir;
	// console.log(players[nick].p_left);
	// console.log(players);
	moving = setTimeout(function(){
		move(dir, nick);
	}, jump_speed)
	change=true;
}

function jump_up(player){
	player.p_bottom+=2;
	if (player.p_bottom<30){
		setTimeout(function(){jump_up(player)},jump_speed);
	} else {
		setTimeout(function(){jump_down(player)},jump_speed);
	}
	change=true;
}
function jump_down(player){
	player.p_bottom-=2;
	if (player.p_bottom>2)
		setTimeout(function(){jump_down(player)},jump_speed);
	change=true;
}

setInterval(function(){
	if (change){
		io.sockets.emit('positions', players);
		change=false;
	}
},200);