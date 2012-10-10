var account = {};
$.getScript('http://id.ming.vn/login/checksessionTemp');
function mingAuthCallBack(data){
	data = $.parseJSON(data);
	account = data;
}
$(function(){

	var host = 'http://localhost:1337/';

  	$("#entry").keypress(function(e){
	    if (e.keyCode != 13 /* Return */) return;
	    var msg = $("#entry").attr("value").replace("\n", "");
	    send(msg);
	    $("#entry").attr("value", "");
		return false;
  	});

	$.get(host + 'list', function(res){
		for(i in res){
			addMessage(res[i]);
		}
		first = false;
		poll();
	})

	function send(m)
	{
  		$.post(host + 'add/', {msg : m, username : account.username}, function(data){});
  	}

	function addMessage(message)
	{
		var created = new Date(message.created);
		var now = new Date();
		var time = created.getHours() + ' giờ ' + created.getMinutes() + ' phút';
		var delta = now.getTime() - created.getTime();
		if (delta < 30 * 1000){
			time = 'chat vừa rồi';
		}
		var title = message.username + ' ('+ time + ')';

		var block = 
				'<div class="blockchat"  title="' + title + '" >'

			+	'<div class="blockchat-avatar">' 
			+ 	'	<a href="http://my.soha.vn/' + message.username + '">' 
			+	'	<img width=20 height=20 src="http://avatar.my.soha.vn/30/' + message.username + '.png" />'
			+ 	'	</a>' 
			+ 	'</div>'

			+	'<div class="blockchat-content">'
			+	'	<div class="blockchat-username">'
			+	'		<a href="http://my.soha.vn/"' + message.username + '">'
			+	'			<strong>' + message.username + '</strong>'
			+	'		</a>'
			+ 			message.msg
			+	'	</div>'
			+ 	'</div>'

			+   '<div class="clearfix"></div>'
			+	'</div>';
		$("#output").append(block);
		
		$("#output").scrollTop($("#output").scrollTop() + $(".blockchat:last-child").height());
	}

	function poll()
	{
		$.ajax({
			cache: false,
			type: "GET",
			url: host + 'poll/',
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

})