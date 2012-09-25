var http = require('http'),
    url = require('url'),
    fs = require('fs');

var messages = ["testing"];
var clients = [];

http.createServer(function (req, res) {
	res.writeHead(200, {
  		"Access-Control-Allow-Headers" : "X-Requested-With",
  		"Access-Control-Allow-Origin" : "http://localhost"});
	var url_parts = url.parse(req.url);
	console.log(url_parts);
	if(url_parts.pathname.substr(0, 5) == '/poll') {
		var count = url_parts.pathname.replace(/[^0-9]*/, '');
		console.log(count);
		if(messages.length > count) {
			res.end(JSON.stringify( {
				count: messages.length,
				append: messages.slice(count).join("\n")+"\n"
			}));
		} else {
			clients.push(res);
		}
  	} else if(url_parts.pathname.substr(0, 5) == '/msg/') {
  // message receiving
  var msg = unescape(url_parts.pathname.substr(5));
  messages.push(msg);
  while(clients.length > 0) {
    var client = clients.pop();
    client.end(JSON.stringify( {
      count: messages.length,
      append: msg+"\n"
    }));
  }
  res.end();
}

}).listen(1337, 'localhost');
console.log('Server running.');