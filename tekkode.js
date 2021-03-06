var pubnub = require("pubnub").init({
    publish_key   : "pub-c-8386988e-a104-47a3-9cab-8ffeb13cdda9",
    subscribe_key : "sub-c-43e681c0-8444-11e2-9881-12313f022c90"
});

var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var jump_speed = 50;
var prev = {};
var change = false;
var no_change = 0;
var port = process.env.PORT || 5000;
server.listen(port);

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var timeouts = {};

function player() {
	this.player_id = players.length + 1;
	this.nick = "default";
	this.p_left = 10;
	this.p_bottom = 2;
	this.dir = 1;
	this.hp = 100;
	this.punch=false;
	this.color = "blue";
}

var players = {};

io.sockets.on('connection', function (socket) {

	socket.emit('joined', players);
  
	socket.on('add_player', function(data){
		var new_player = new player();
		new_player.nick = data.nick;
		new_player.color = data.color;
		players[data.nick] = new_player;
		console.log("new player: "+data.nick);
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
			if (players[data.nick].dir == 1)
				clearTimeout(timeouts[data.nick]);
		} else if (data.key==65){
			if (players[data.nick].dir == -1)
				clearTimeout(timeouts[data.nick]);
		} else if (data.key==87){

		} else if (data.key==32){
			console.log(data.nick+' hit');
			players[data.nick].punch = true;
			change=true;
			for (var key in players){ 
				if (key != data.nick){
					if (players[data.nick].dir == 1){
						if (players[data.nick].p_left+3+7 > players[key].p_left 
							&& players[data.nick].p_left-2 < players[key].p_left){
							players[key].hp-=1;
						}
					} else {
						if (players[data.nick].p_left-3-3-7 < players[key].p_left
							&& players[data.nick].p_left+2 > players[key].p_left){
							players[key].hp-=1;
						}
					}
				}
			}
			
		}
	})

});

function move(dir, nick){
	// console.log("move: "+nick);
	// console.log(players[nick].p_left);
	clearTimeout(timeouts[nick]);
	players[nick].p_left+=dir;
	players[nick].dir=dir;
	// console.log(players[nick].p_left);
	// console.log(players);
	if (players[nick].p_left>1 && players[nick].p_left < 97){
		timeouts[nick] = setTimeout(function(){
			move(dir, nick);
		}, jump_speed);
	}
	change=true;
}

function jump_up(player){
	player.p_bottom+=3;
	if (player.p_bottom<60){
		setTimeout(function(){jump_up(player)},jump_speed);
	} else {
		setTimeout(function(){jump_down(player)},jump_speed);
	}
	change=true;
}
function jump_down(player){
	player.p_bottom-=3;
	if (player.p_bottom>3)
		setTimeout(function(){jump_down(player)},jump_speed);
	change=true;
}

setInterval(function(){
	if (change || no_change>100){
		console.log(players);
		pubnub.publish({
			channel: 'tekkode',
			message: players
		});
		for (var key in players){ 
			players[key].punch = false;
		}
		change=false;
		no_change = 0;
	} else {
		no_change++;
	}
},400);