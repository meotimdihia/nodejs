var app = require('./app.js'),
	messages = [],
	clients = [],
	qs = require('querystring');

var LIMIT = 200;

app.action('add', function(req, res){
	if (req.method == 'POST'){

		var body = '';
		req.on('data', function(chunk){
			body += chunk;
			if (body.length > 1e6){
				req.connection.destroy();
			}
		});

		req.on('end', function (){
			var post = qs.parse(body);
			if (post.msg != undefined && post.username != undefined ){
				var msg = {msg: post.msg, username : post.username, created : new Date()};
				messages.push(msg);
		    	while(messages.length > LIMIT){
		      		messages.shift();
		  		}

				while(clients.length > 0){
					var client = clients.pop();
					client.simpleJSON(200, msg);
				}
			}
		});
		res.simpleText(200, 'OK');
	}else{
		res.simpleText(400, 'Yêu cầu không hợp lệ');
	}
});

app.action('poll', function(req, res){
	clients.push(res);
});

app.action('list', function(req, res){
	res.simpleJSON(200, messages.slice(messages.length - 6));
});