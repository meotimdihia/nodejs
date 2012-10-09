var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	allowDomain = '*',
	qs = require('querystring'),
	maps = [];

exports.action = function(path, handler)
{
	maps[path] = handler;
}

http.createServer(function(req, res)
{
	var url_parts = url.parse(req.url);
	var paths = url_parts.pathname.split("/");

    res.simpleText = function(code, content)
    {
    	var content = new Buffer(content);
      	res.writeHead(code, { "Content-Type": "text/plain"
                          , "Content-Length": content.length
                          });
      	res.end(content);
    };

    res.simpleJSON = function(code, obj)
    {
		var body = new Buffer(JSON.stringify(obj));
		res.writeHead(code, { "Content-Type": "text/json"
                          , "Content-Length": body.length
                          });

		res.end(body);
    };

	var handler = maps[paths[1]] || function(){
		res.simpleText(404, 'Không tìm thấy');
	};

  	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	res.setHeader("Access-Control-Allow-Origin", allowDomain);

	handler(req, res);

}).listen(1337, '192.168.14.131');
