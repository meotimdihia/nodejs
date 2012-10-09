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
				messages.push({msg: post.msg, username : post.username});
		    	while(messages.length > LIMIT){
		      		messages.shift();
		  		}

				while(clients.length > 0){
					var client = clients.pop();
					client.simpleJSON(200, post);
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