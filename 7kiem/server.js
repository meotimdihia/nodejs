HOST = "127.0.0.1"; // localhost
PORT = 1107;
/*
HOST = "192.168.3.161"; // localhost
PORT = 8001;
*/
// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.

setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);


var fu = require("./fu"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring"),
    crypto = require('crypto');
	fs = require("fs");
var MESSAGE_BACKLOG = 50,
    SESSION_TIMEOUT = 60 * 1000,PATH_BASE = "/var/www/apps/7kiem/";
//	SESSION_TIMEOUT = 60 * 1000,PATH_BASE = "/var/www/apps/node3/";
var lockBox = false;
var channel = new function () {
  var messages = [],
      callbacks = [];

  this.appendMessage = function (nick, type, text,check) {
    var m = { nick: nick
            , type: type // "msg", "join", "part"
            , text: text
            , timestamp: (new Date()).getTime()
            };

    switch (type) {
      case "msg":
        //sys.puts("<" + nick + "> " + text);
		if(check!=true){
			if(nick && text.length > 0){
                var temp = nick+ "|" + type+ "|"+text+ "|" + (new Date()).getTime()+"\n";
                fs.open(PATH_BASE+'message.txt', 'a', 666, function( e, id ) {
                  fs.write( id, temp, null, 'utf8', function(){
                    fs.close(id, function(){
                    });
                  });
                });
            }
		}
        break;
      case "join":
       // sys.puts(nick + " join");
        break;
      case "part":
        //sys.puts(nick + " part");
        break;
    }
	messages.push( m );
	
    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }

    while (messages.length > MESSAGE_BACKLOG)
      messages.shift();
  };

  this.query = function (since, callback) {
    var matching = [];
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.timestamp > since)
        matching.push(message)
    }

    if (matching.length != 0) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // clear old callbacks
  // they can hang around for at most 30 seconds.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);
};

var sessions = {};
function createSession (nick) {
  if (nick.length > 50) return null;
  //if (/[^\w_\-^!]/.exec(nick)) return null;

  for (var i in sessions) {
    var session = sessions[i];
    if (session && session.nick === nick){
      delete sessions[session.id];
      //return null;
    } 
  }

  var session = { 
    nick: nick, 
    id: Math.floor(Math.random()*99999999999).toString(),
    timestamp: new Date(),

    poke: function () {
      session.timestamp = new Date();
    },

    destroy: function () {
      //channel.appendMessage(session.nick, "part");
      delete sessions[session.id];
    }
  };

  sessions[session.id] = session;
  return session;
}

// interval to kill off old sessions
setInterval(function () {
  var now = new Date();
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];

    if (now - session.timestamp > SESSION_TIMEOUT) {
      session.destroy();
    }
  }
}, 1000);

fu.listen(Number(process.env.PORT || PORT), HOST);

setInterval(function () {
	//sys.puts("File-Message");
	var LINE_BACKLOG = 100;
	fs.readFile(PATH_BASE+'message.txt', function (err, data) {
	  if (err) {
		//sys.puts("Error readFile");
	  } else {
		var text = data.toString().split('\n');
		var lth = text.length;
		//sys.puts("File-Message1:" + lth);
		if(lth > LINE_BACKLOG)
			var limit = lth - LINE_BACKLOG;
		else
			var limit = 0;
		if(lth > LINE_BACKLOG){
			var line ="";
			for(var i=limit;i < lth;i++){
				if(text[i] != '\n' || text[i] != ''){
					if(i == lth-1){
						line = line+ text[i];
					}else{
						line = line+ text[i]+'\n';
					}
				}
			}
			if(line.length > 0){
				fs.writeFile(PATH_BASE+'message.txt', line , function( e, id ) {
					if (err) {
						//sys.puts("Error writeFile");
					}
				});
			}
		}	
	  }
	});
	
}, 60000*5);//5 phut se reset lai file text


fs.readFile(PATH_BASE+'message.txt', function (err, data) {
  if (err) {
	//sys.puts("Error readFile");
  } else {
	var limit = 0;
	var text = data.toString().split('\n');
	for(var i=limit;i<text.length;i++){
		var line = text[i].split('|');
		channel.appendMessage(line[0], line[1], line[2],true);
	}
  }
}); 


fu.get("/", fu.staticHandler(PATH_BASE+"index.html"));
fu.get("/style.css", fu.staticHandler(PATH_BASE+"style.css"));
fu.get("/client.js", fu.staticHandler(PATH_BASE+"client.js"));
fu.get("/jquery.min.js", fu.staticHandler(PATH_BASE+"jquery.min.js"));



fu.get("/who", function (req, res) {
  var nicks = [];
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var 
    session = sessions[id];
    nicks.push(session.nick);
  }
  res.simpleJSON(200, { nicks: nicks});
});

fu.get("/join", function (req, res) {
  var SECURE_AUTH_KEY = "JYVa8M4QAleGIrv|F<+17HL4Cn`<@9c?lw#)En<SPD),$2?j-rngq&wP-k1<V`;2";
  var nick = qs.parse(url.parse(req.url).query).nick;
  var user_id = qs.parse(url.parse(req.url).query).user_id;
  var user_email = qs.parse(url.parse(req.url).query).user_email;
  var checksum = qs.parse(url.parse(req.url).query).checksum;
  var status = qs.parse(url.parse(req.url).query).status;
  var md5checksum = crypto.createHash('md5').update(user_id+status+nick+user_email+SECURE_AUTH_KEY).digest("hex");
  var temp = nick.split('@');
  if (temp.length > 1) {
    res.simpleJSON(200, {error: "badnickemail"});
    return;
  }
  if (nick == null || nick.length == 0) {
    res.simpleJSON(200, {error: "nicknull"});
    return;
  }
  if (checksum != md5checksum) {
    res.simpleJSON(200, {error: "badnick"});
    return;
  }
  if (status <= 0) {
    res.simpleJSON(200, {error: "notactive"});
    return;
  }
  var session = createSession(nick);
  if (session == null) {
    res.simpleJSON(200, {error: "sessionnull"});
    return;
  }
  
  //channel.appendMessage(session.nick, "join");
  res.simpleJSON(200, { id: session.id
                      , nick: session.nick
                      , starttime: starttime
                      });
});


fu.get("/part", function (req, res) {
  var id = qs.parse(url.parse(req.url).query).id;
  var session;
  if (id && sessions[id]) {
    session = sessions[id];
    session.destroy();
  }
  res.simpleJSON(200, {});
});

fu.get("/recv", function (req, res) {
    if(lockBox){
        res.simpleJSON(400, { error: "LOCK_BOX" });
        return;
    }
    if (!qs.parse(url.parse(req.url).query).since) {
        res.simpleJSON(400, { error: "Must supply since parameter" });
        return;
      }
      var id = qs.parse(url.parse(req.url).query).id;
      var session;
      if (id && sessions[id]) {
        session = sessions[id];
        session.poke();
      }

      var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);

      channel.query(since, function (messages) {
        if (session) session.poke();
        res.simpleJSON(200, { messages: messages});
      });

});

fu.get("/checkLock", function (req, res) {
	var id = qs.parse(url.parse(req.url).query).id;
    if (id == null) {
		res.simpleJSON(200, { error: "ERROR_UNKNOW"});
        return;
    }
	var session = sessions[id];
    var now = new Date();
	if (session == null) {
        res.simpleJSON(200, { error: "LOCKED"});
        return;
	}
    if (now - session.timestamp > SESSION_TIMEOUT) {
      res.simpleJSON(200, { error: "ERROR_UNKNOW"});
      return;
    }
    //check nick lock
    var http = require("http");
    var options = {
      host: 'soap.soha.vn',
      port: 80,
      path: '/apps/tools/LockChatByGame?game=7kiem&username='+ session.nick,
      method: 'GET'
    };
    var req1 = http.request(options, function(res1) {
      res1.setEncoding('utf8');
      res1.on('data', function (chunk) {
        if(chunk == "LOCK"){
            session.destroy();
        }
      });
    });
    req1.end();
    res.simpleJSON(200, { error: "DONE"});
    return;
});


fu.get("/send", function (req, res) {
    if(lockBox){
        res.simpleJSON(200, { error: "LOCK_BOX" });
        return;
    }else{
        var id = qs.parse(url.parse(req.url).query).id;
        var text = qs.parse(url.parse(req.url).query).text;
        var session = sessions[id];
        if (!session || !text) {
            res.simpleJSON(400, { error: "No such session id" });
            return;
        }
        
        text = shortText(text);
        session.poke();
        channel.appendMessage(session.nick, "msg", text);
        res.simpleJSON(200, {});
    }
});


function shortText(sText) {
	var temp12 = sText.split('__');
	if(temp12.length == 3){
		return sText;
	}
	var temp = sText.split(' ');
	var text1 = "";
	for(var i= 0; i< temp.length;i++){
		if((temp[i].length > 25)){

		  temp[i]= temp[i].substr(0,25);
           
        }
		  text1 = text1 + " " + temp[i];

	}
	return text1;
}
