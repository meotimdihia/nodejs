<html>
<head>
	<script type='text/javascript' src='jquery-1.8.2.min.js'></script>
</head>
<body>
	<div id='result'></div>
	<div id='output'></div>
	<input type='text' id='entry' />
	<script type='text/javascript'>
	$(function(){
		var host = 'http://localhost:1337/';
	// 	$.get(host, function(data){
	// 		$('#result').html(data);
	// 	});
		
	
	function send(msg){
  		$.get(host + 'msg/' + escape(msg), function(data){});
  	}


  	$("#entry").keypress(function(e){
	    if (e.keyCode != 13 /* Return */) return;
	    var msg = $("#entry").attr("value").replace("\n", "");
	    send(msg);
	    $("#entry").attr("value", ""); // clear the entry field.
		return false;
  	});

		var counter = 0;
		var poll = function() {
		$.getJSON(host + 'poll/'+counter, function(response) {
			counter = response.count;
			var elem = $('#output');
			elem.text(elem.text() + response.append);
			poll();
		});
		}
		poll();
	})
	</script>
</body>
</html>