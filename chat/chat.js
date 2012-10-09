var account = {};
$.getScript('http://id.ming.vn/login/checksessionTemp');
function mingAuthCallBack(data){
	data = $.parseJSON(data);
	account = data;
}
$(function(){

	var host = 'http://192.168.14.131:1337/';
	
	function send(m)
	{
  		$.post(host + 'add/',{msg : m, username : account.username}, function(data){});
  	}

  	$("#entry").keypress(function(e){
	    if (e.keyCode != 13 /* Return */) return;
	    var msg = $("#entry").attr("value").replace("\n", "");
	    send(msg);
	    $("#entry").attr("value", "");
		return false;
  	});

	var counter = 0;

	function addMessage(message)
	{
		var block = 
				'<div>'

			+	'<div class="boxchat-avatar">' 
			+ 	'	<a href="http://my.soha.vn/"' + message.username + '">' 
			+	'	<img src="http://avatar.my.soha.vn/40/' + message.username + '.png" />'
			+ 	'	</a>' 
			+ 	'</div>'

			+	'<div class="boxchat-content">'
			+	'	<div class="boxchat-username">'
			+	'		<a href="http://my.soha.vn/"' + message.username + '">'
			+	'			<strong>' + message.username + '</strong>'
			+	'		</a>'
			+	'	</div>'
			+ 	message.msg 
			+ 	'</div>'

			+   '<div class="clearfix"></div>'
			+	'</div>';
		$("#output").append(block);
	}

	function poll(){
		$.ajax({
			cache: false,
			type: "GET",
			url: host + 'poll/'+counter,
			dataType: "json",
			error: function(){
             	setTimeout(poll, 10*1000);
           	},
           	success: function(response)
           	{
				addMessage(response);
				poll();
           	}
     	});
	}

	poll();
})
