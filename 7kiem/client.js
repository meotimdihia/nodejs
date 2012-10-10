/**
 * Created by JetBrains PhpStorm.
 * User: User
 * Date: 9/1/11
 * Time: 3:57 PM
 * To change this template use File | Settings | File Templates.
 */
var CONFIG = { debug: false
             , nick: "#"   // set in onConnect
             , id: null    // set in onConnect
             , last_message_time: 1
             , focus: false //event listeners bound in onConnect
             , unread: 1 //updated in the message-processing loop
             };

var nicks = [];
var myScroll = null;
var ticker_panel = null;


Date.prototype.toRelativeTime = function(now_threshold) {
  var delta = new Date() - this;

  now_threshold = parseInt(now_threshold, 10);

  if (isNaN(now_threshold)) {
    now_threshold = 0;
  }

  if (delta <= now_threshold) {
    return 'Just now';
  }

  var units = null;
  var conversions = {
    millisecond: 1, // ms    -> ms
    second: 1000,   // ms    -> sec
    minute: 60,     // sec   -> min
    hour:   60,     // min   -> hour
    day:    24,     // hour  -> day
    month:  30,     // day   -> month (roughly)
    year:   12      // month -> year
  };

  for (var key in conversions) {
    if (delta < conversions[key]) {
      break;
    } else {
      units = key; // keeps track of the selected key over the iteration
      delta = delta / conversions[key];
    }
  }

  // pluralize a unit when the difference is greater than 1.
  delta = Math.floor(delta);
  if (delta !== 1) { units += "s"; }
  return [delta, units].join(" ");
};

/*
 * Wraps up a common pattern used with this plugin whereby you take a String
 * representation of a Date, and want back a date object.
 */
Date.fromString = function(str) {
  return new Date(Date.parse(str));
};

//  CUT  ///////////////////////////////////////////////////////////////////

//handles another person joining chat
function userJoin(nick, timestamp) {
  //put it in the stream
  addMessage(nick, "joined", timestamp, "join");
  //if we already know about this user, ignore it
  for (var i = 0; i < nicks.length; i++)
    if (nicks[i] == nick) return;
  //otherwise, add the user to the list
  nicks.push(nick);
}

//handles someone leaving
function userPart(nick, timestamp) {
  //put it in the stream
  addMessage(nick, "left", timestamp, "part");
  //remove the user from the list
  for (var i = 0; i < nicks.length; i++) {
    if (nicks[i] == nick) {
      nicks.splice(i,1)
      break;
    }
  }
}

// utility functions

util = {
  urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g,

  //  html sanitizer
  toStaticHTML: function(inputHtml) {
    inputHtml = inputHtml.toString();
    return inputHtml.replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
  },

  //pads n with zeros on the left,
  //digits is minimum length of output
  //zeroPad(3, 5); returns "005"
  //zeroPad(2, 500); returns "500"
  zeroPad: function (digits, n) {
    n = n.toString();
    while (n.length < digits)
      n = '0' + n;
    return n;
  },

  //it is almost 8 o'clock PM here
  //timeString(new Date); returns "19:49"
  timeString: function (date) {
   // var minutes = date.getMinutes().toString();
   // var hours = date.getHours().toString();
    //return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
      var n = new Date();
      var tm = date;
      var t = n.getTime()-tm.getTime();
      var p = Math.floor(t/60000);
      var h =Math.floor(p/60);
      var ng =Math.floor(h/24);
     if(p<1)
     {
         time = 'vài giây';
     }
     else
     {
if(ng>1) time  = ng+ "  ngày";
else if (ng==1) time  = ng+" ngày";

if(ng < 2){
if(h>1) time =h+ " giờ";
else if (h==1) time  = h+ "  giờ";
if(h < 3){
if(p>1) time = p+ " phút";
else if (p==1) time  = p+" phút";
}
}

}
      return time;
  },

  //does the argument only contain whitespace?
  isBlank: function(text) {
    var blank = /^\s*$/;
    return (text.match(blank) !== null);
  }
};

//used to keep the most recent messages visible
function scrollDown () {
  //var $paneOptions = $('#log');
  //$paneOptions.scrollTo( 'li:last',0);     
  //$("#entry").focus();
}

//inserts an event into the stream for display
//the event may be a msg, join or part type
//from is the user, text is the body and time is the timestamp, defaulting to now
//_class is a css class to apply to the message, usefull for system events
function addMessage (from, text, time, _class) {
  if (text === null)
    return;

  if (time == null) {
    // if the time is null or undefined, use the current time.
    time = new Date();
  } else if ((time instanceof Date) === false) {
    // if it's a timestamp, interpret it
     time = new Date(time);

  }

  //every message you see is actually a table with 3 cols:
  //  the time,
  //  the person who caused the event,
  //  and the content
  var messageElement = $(document.createElement("li"));

  messageElement.addClass("data-item data-chat");
  if (_class)
    messageElement.addClass(_class);

  // sanitize
  text = util.toStaticHTML(text);

  // If the current user said this, add a special css class
  var nick_re = new RegExp(CONFIG.nick);
  if (nick_re.exec(text))
    messageElement.addClass("personal");

  // replace URLs with links
  var temp = text.split('__');
  if(temp.length == 3){
    var temp1 = temp[1].split('_');
	text = shortText(temp[0])
    if(temp1.length == 2){
      if(temp1[1] != CONFIG.nick){
        text = text+' <a href="#" class="response" rel="'+temp1[0]+'">+ Đồng ý</a>';
      }
    }
  }else{

	text = shortText(text);
  }

 
  var textMod ='';

  if(from == 'GameMaster'){
    text = '<span style="color: #FF4040;">' + text + '</span>'
  }
  if(from == ''){
    textMod = '(<span style="color: #CD3333;">Mod</span>)'
  }
  
time=util.timeString(time)
   var content =
                '<div class="kt-box clearfix">'
               +'<div class="kt-left">'
               +'<a title="'+util.toStaticHTML(from)+'" target="_blank" href="http://my.soha.vn/'+util.toStaticHTML(from)+'"><img id="'+util.toStaticHTML(from)+'" style="height: 32px;width: 32px;" alt="Avatar " src="http://avatar.my.soha.vn/30/' + util.toStaticHTML(from) + '.png" onerror="replateUrlImage(this, \'' + util.toStaticHTML(from) + '\');"/></a>'
               +'</div>'
               +'<div class="kt-right">'
               +'<h6><a title="'+util.toStaticHTML(from)+'" target="_blank" href="http://my.soha.vn/'+util.toStaticHTML(from)+'">' + util.toStaticHTML(from) + '</a> '+ textMod +'</h6>'
               +'<p>' + text  + '</p>'
               +'</div> </div>'

                    ;

  messageElement.html(content);

  //the log is the stream that we view
  //$("#log").append(messageElement);
  $("#log").prepend(messageElement);
	var ul = document.getElementById('log');
    var i=0, c =0;
    while(ul.getElementsByTagName('li')[i++]) c++;
    if(c > 20){
        $(ul).find('li:last').remove();
    }
  //always view the most recent message when it is added
  scrollDown();
  if(ticker_panel == null){
      ticker_panel = $('#ticker_panel');
  }
  if(!ticker_panel.hasClass("loader")){
      myScroll = ticker_panel.tinyscrollbar();
      ticker_panel.addClass("loader");
  } else{
      myScroll.tinyscrollbar_update('relative');
  }
}
function replateUrlImage(element, username){
	element.removeAttribute("onerror");
	element.src = 'http://avatar.my.soha.vn/30/'+username+'.png';
}

var transmission_errors = 0;
var first_poll = true;
var st = false;



function shortText(sText) {
  var temp = sText.split(' ');
  var text1 = "";
  for(var i= 0; i< temp.length;i++){
    if(temp[i].length > 25)
    {
		temp[i]= temp[i].substr(0,25);
    }
   text1 = text1 + " " + temp[i];
  }
  return text1;
}

function addMessageError(text) {
  if (text === null)
    return;
  $(document.getElementsByClassName("data-item data-chat err")).remove();
  var messageElement = $(document.createElement("li"));

  messageElement.addClass("data-item data-chat err");

  // sanitize
  text = util.toStaticHTML(text);

   var content =
                '<div class="kt-box clearfix">'
               +'<div class="kt-right">'
               +'<p style="color: red;">' + text  + '</p>'
               +'</div> </div>'
                    ;
  messageElement.html(content);
  $("#log").prepend(messageElement);
  scrollDown();
}

function AddAntiSpammess(text,i) {
  if (text === null)
    return;

  var messageElement = $(document.createElement("li"));

  messageElement.addClass("data-item data-chat err_"+i);
  // sanitize
  text = util.toStaticHTML(text);

   var content =
                '<div class="kt-box clearfix">'
               +'<div class="kt-right">'
               +'<p style="color: red;">' + text  + '</p>'
               +'</div> </div>'
                    ;
  messageElement.html(content);
  $("#log").prepend(messageElement);
  scrollDown();
}

//handles another person joining chat
function serverBusy() {
  addMessageError("Server đang bận ...");
}

function AntiSpam(i) {
  AddAntiSpammess("Bạn chat quá nhanh, xin vui lòng đợi trong giây lát ...",i);
}
//handles another person joining chat
function refreshIframe(reload) {
	if(reload)
		location.reload(true);
}
//process updates if we have any, request updates from the server,
// and call again with response. the last part is like recursion except the call
// is being made from the response handler, and not at some point during the
// function's execution.
function longPoll (data) {
  if (transmission_errors > 1) {
	if(st==false){
		st=true;
		serverBusy();
	}
  }else{
	if(st)
	refreshIframe(true);
  }
  
  //process any updates we may have
  
  if (data && data.rss) {
    rss = data.rss;
    updateRSS();
  }

  
  //data will be null on the first call of longPoll
  if (data && data.messages) {
    for (var i = 0; i < data.messages.length; i++) {
      var message = data.messages[i];

      //track oldest message so we only request newer messages from server
      if (message.timestamp > CONFIG.last_message_time)
        CONFIG.last_message_time = message.timestamp;

      //dispatch new messages to their appropriate handlers
      switch (message.type) {
        case "msg":
          if(!CONFIG.focus){
            CONFIG.unread++;
          }
          addMessage(message.nick, message.text, message.timestamp);
          break;

        case "join":
         // userJoin(message.nick, message.timestamp);
          break;

        case "part":
         // userPart(message.nick, message.timestamp);
          break;
      }
    }
    
    //update the document title to include unread message count if blurred
    //updateTitle();

    //only after the first request for messages do we want to show who is here
    if (first_poll) {
      first_poll = false;
      //who();
    }
  }

  //make another request
  $.ajax({ cache: false
         , type: "GET"
         , url: "/7kiem/recv"
         , dataType: "json"
         , data: { since: CONFIG.last_message_time, id: CONFIG.id }
         , error: function () {
             //
             // addMessage("", "long poll error. trying again...", new Date(), "error");
             transmission_errors += 1;
			 //don't flood the servers on error, wait 10 seconds before retrying
             setTimeout(longPoll, 5*1000);
           }
         , success: function (data) {
             transmission_errors = 0;
             longPoll(data);
           }
         });
}

var timeshowmess = 0;
//submit a new message to the server
function send(msg) {
  if (CONFIG.debug === false) {
    // XXX should be POST
    // XXX should add to messages immediately
    var tm = new Date();
    var curenttime = tm - timeshowmess;

    if(curenttime > 5*60*1000){
        timeshowmess = new Date();
        $.getScript("http://soap.soha.vn/apps/tools/showMessBoxChat?game=7kiem");
    }

    jQuery.get("/7kiem/checkLock", {id: CONFIG.id}, function (data) {
        if(data.error == "LOCKED"){
            addMessageError("Mất kết nối box chat, xin vui lòng Ctrl+F5!");
            return;
        }
        if(data.error == "ERROR_UNKNOW"){
            addMessageError("Mất kết nối box chat, xin vui lòng Ctrl+F5!");
            return;
        }else{
             jQuery.get("/7kiem/send", {id: CONFIG.id, text: msg}, function (data1) {
                 if(data1.error == "LOCK_BOX"){
                    addMessageError("Chức năng Chat đang bị khóa!");
                    return;
                }
            }, "json");
        }
    }, "json");
  }
}

//Transition the page to the state that prompts the user for a nickname
function showConnect () {
  $("#connect").show();
  $("#loading").hide();
  $("#toolbar").hide();
  $("#login").hide();
  //$("#nickInput").focus();
}

function showLogin () {
  $("#connect").hide();
  $("#loading").hide();
  $("#toolbar").hide();
  $("#login").show();
  //$("#nickInput").focus();
}

//transition the page to the loading screen
function showLoad () {
  $("#connect").hide();
  $("#loading").show();
  $("#toolbar").hide();
  $("#login").hide();
}

//transition the page to the main chat view, putting the cursor in the textfield
function showChat (nick) {
  $("#toolbar").show();
  //$("#entry").focus();
  $("#connect").hide();
  $("#login").hide();
  $("#loading").hide();
  scrollDown();
}

//we want to show a count of unread messages when the window does not have focus
function updateTitle(){
  if (CONFIG.unread) {
    document.title = "(" + CONFIG.unread.toString() + ") Soha Game Irc";
  } else {
    document.title = "Soha Game Irc";
  }
}

// daemon start time
var starttime;
// daemon memory usage
var rss;

//handle the server's response to our nickname and join request
function onConnect (session) {
  if (session.error) {
   // alert("error connecting: " + session.error);
    showConnect();
    return;
  }
    jQuery.get("/7kiem/checkLock", {id: session.id}, function (data) {
        
    }, "json");

  CONFIG.nick = session.nick;
  CONFIG.id   = session.id;
  starttime   = new Date(session.starttime);
  //update the UI to show the chat
  showChat(CONFIG.nick);

  //listen for browser events so we know to update the document title
  $(window).bind("blur", function() {
    CONFIG.focus = false;
    updateTitle();
  });

  $(window).bind("focus", function() {
    CONFIG.focus = false;
    CONFIG.unread = 0;
    updateTitle();
  });
}

function callBackMess(data){
    var rels = eval('(' + data + ')');
    if(rels =="NOT"){
        $('#mess_admin').html("");
        $('#mess_admin').hide();
    }else{
        $('#mess_admin').html(rels);
        $('#mess_admin').show();
    }
}
//add a list of present chat members to the stream
function outputUsers () {
  var nick_string = nicks.length > 0 ? nicks.join(", ") : "(none)";
 // addMessage("users:", nick_string, new Date(), "notice");
  return false;
}

//get a list of the users presently in the room, and add it to the stream
function who () {
  jQuery.get("/7kiem/who", {}, function (data, status) {
    if (status != "success") return;
    nicks = data.nicks;
    outputUsers();
  }, "json");
}

function removemess (i)
{
    $('.err_'+i).remove();
}

$(document).ready(function() {
    var anti = new Array();
	lock = 0;
    var i=eval(4);
	var s=eval(0);	
  //submit new messages when the user hits enter if the message isnt blank
  $("#entry").keypress(function (e) {
  
    if (e.keyCode != 13 /* Return */) return;	
    var msg = $("#entry").attr("value").replace("\n", "");
    if (!util.isBlank(msg))
    {	
		var n= new Date().getTime();
		if (i>14)
		{			
			var j=eval(i-11);		
			var t = n-anti[j];					
			if (t<=15000){											
				anti[j]= eval(n+15000);
				lock=n;						
			}
			if ((n-lock)<=300000){				
				s=s+1;
				AntiSpam(s);
			    setTimeout("removemess("+s+")",300000);
				return ;
			}	
					
		}
			anti[i]=n;
			msg = filterText(msg);
			send(msg);		
				$("#entry").attr("value", "");// clear the entry field.
			   i=i+1;					
	}
  });

  if (CONFIG.debug) {
    $("#loading").hide();
    $("#connect").hide();
    $("#login").hide();
    scrollDown();
    return;
  }

  // remove fixtures
  $("#log table").remove();

  //begin listening for updates right away
  //interestingly, we don't need to join a room to get its updates
  //we just don't show the chat stream to the user until we create a session
  longPoll();
  showConnect();
});

//if we can, notify the server that we're going away.
$(window).unload(function () {
  jQuery.get("/7kiem/part", {id: CONFIG.id}, function (data) { }, "json");
});


function filterText(sText) {
    var filterWords = [
       "an_cac","ancac","ăn cặc","ăncặc",
    "ba_may","bà mày","ba mày","bàmay","bamày","bàmày","bac_ho","bamay","ban_dam","ban_hoa","bandam","banhoa","bánhoa",
    "bo_may","bomay","bon_cho","bon_khon_nan","boncho","bonkhonnan","breast","bucac","buoi","buồi","buom",
    "bướm","c_san","cạc","cặc","cai_buoi","cai_chim","cai_cu","cai_lon","caibuoi","caichim","caicu","cailon","cave",
    "chim","chim_to","chimto","chó","cho_chet","cho_kin","chochet","chokin","con_cho","con_cu","con_cu_cac",
    "con_cu_to_tuong","con_di","con_diem","con_pho", "concho","concu","concucac","concutotuong","condi","condiem","cong_hoa","cong_san","conghoa","congsan","conlon",
    "conpho","csan","cụ","cu_cac","cu_ho","cu_may","cu_to","cuc_cac","cuc_cut","cucac","cuccac","cuccut","cuho","cumay",
    "cunt","cuong_dam","cuong_hiep","cuongdam","cuonghiep","cứt","cuto","đái","dâm","dan_chu","danchu","dang_c_s",
    "dang_cong_san","dang_congsan","dang_cs","dang_tien_tri","dang_tientri","dangcongsan","dangcs","dangtien_tri",
    "dangtientri","dcm","đcm","đĩ","điếm","dis_me","disme","dit","dịt","đít","địt","dit_bo","dit_con_cu","dit_con_me",
    "dit_concu","dit_conme","dit_cu","dit_cu_may","dit_me","dit_me","dit_ong","ditba","ditbo","ditme","ditme","ditmemay",
    "ditong","dm","đm","doconcho","dokhon","drug","dụ","đụ","du_ma","dục","duma","dume","f_u_c_k","fuck","gai_ban_hoa",
    "gai_diem","Gaibanhoa","Gaidiem","ham_hiep","Hamhiep","hanh_kinh","Hanhkinh","Hiếp","hiep_dam","Hiepdam",
    "ho_chi_minh","hồ_chí_minh","ho_chiminh","hochi_minh","Hochiminh","H0chiminh","Iả","Ỉa","Khốn","khon_nan",
    "Khonnan","khung_bo","Khungbo","Kiep","Kiép","kiếp","lam_tinh","lamtinh","liem_cac","liemcac","lìn","lon",
    "lòn","lồn","lợn","lon_to","long_lon","longlon","lonto","lu_cho","lu_khon","lucho","lukhon","mau_kinh","mau_lon",
    "maukinh","maulon","mẹ","me_kiep","me_may","mekiep","memay","mie","mohamet","mua_dam","muadam","mut_cac","mutbuoi",
    "mutcac","nake","nguyen_ai_quoc","nguyen_aiquoc","nguyenai_quoc","nguyenaiquoc","nguyenaiquoc","ong_may","ongmay",
    "penis","phò","pimp","rape","s_h_i_t","sex","shit","sinh_duc","sinhduc","slut","so_lon","solon","su_bo_may","subomay",
    "thang_cho","thangcho","tien_su","tiensu","tinh_duc","tinhduc","to_su","tosu","v_cong","vai_dai","vai_leu","vai_lin",
    "vai_lon","vaidai","vaileu","vailin","vailon","10`n","1`0n","1o`n","1ỒN ",
    "_BacHo_","_BAcHo_","_Bacho_","_bacHo_","_bAcHo_","bac_ho","Bac_ho","bac_Ho","Bac_Ho","Bác Hồ","bác Hồ","Bác hồ","bác hồ",
    "bÁc Hồ","bÁc hỒ","báC Hồ","b4c Hồ","b4c hỒ","b'4c Hồ","b'4c hỒ","b4'c Hồ","b4'c hỒ","bac h0","Bac h0","bac H0","Bac H0",
    "bitch","BITCH","Bitch","buoi","Buoi","buoi`","Buoi`","buồi","Buồi","bu0`i","Bu0`i","buỒi","BuỒi","congsan","cong san",
    "Cong san","cong San","Cong San","cộng sản","cộng Sản","Cộng sản","cong_san","Congsan ","CongSan","cuho","Cuho","cuHo",
    "CuHo","cuh0","Cuh0","cuH0","CuH0","cu_ho","Cu_ho","cU_ho","cu_Ho","cu_hO","cụ hồ","Cụ hồ","cỤ hồ","cụ Hồ","cụ hỒ",  
    "CĂC.","cặc","Cặc","cẶc","CẶc","CẶC","cave","Cave","cAve","CAVE","cAve","CAVE","cứt","Cứt","cỨt","CỨT","CỨt","d1t",
    "D1t","D1T","dai'","Dai'","dAi'","DAI'","dái","đái","Đái","ĐÁI","dâm","dÂm","damn","DAMN","dcm","DCM","đcm","ĐCM",
    "ĐcM","Đcm","đĩ","Đĩ","đi~","Đi~","ĐĨ","ĐI~","di~","Dĩ","DI~","di.t","Di.t","dI.t ","DI.T","đi.t","Đi.t","ĐI.T",
    "địt","đỊt ","Địt","ĐịT","ĐỊT ","dis","Dis","diS","đis","Đis","dit","đit","Dit","Đit","DIT","ĐIT","điếm","Điếm",
    "điẾm","ĐiẾm","ĐIẾM","Fck","Dis","djs","dm","Dm","DM","đm","Đm","ĐM","dmm","đmm","Dmm","Đmm","DMM","ĐMM","Đcm",
    "ĐcM","đCM","đcmm","dkm","đkm","dcm","đcm","dkmm","đkmm","đụ","đỤ","Đụ","ĐỤ","đu.","Đu.","ĐU.","fuck","Fuck",
    "FUCK","f_u_c_k","Hồ chí minh","hochiminh","HoChiMinh",
    "HOCHIMINH","ho_chi_minh","Ho_Chi_Minh","ho chi minh","Ho Chi Minh","HO CHI MINH","hiếp","Hiếp","HIẾP",
    "lo`n","Lo`n","lon`","Lon`","lồn","Lồn","lôn","Lôn","LÔN","LỒN","lỒn","mk","Mk","MK","nông đức mạnh ",
    "Nông Đức Mạnh","nongducmanh","NONGDUCMANH","N0ngducmanh","penis","PENIS","Phạm Văn Đồng","phạm văn đồng",
    "phamvandong","PHAMVANDONG","phò","Phò","phÒ","PHÒ","pho`","Pho`","PHO`","rape","Rape","RAPE","sex","Sex",
    "SEX","sh1t","Sh1t","SH1T","shit","Shit","SHIT","tổng bí thư","Tổng Bí Thư","tongbithu","tong bi thu","vietcong",
    "Vietcong","VIETCONG","viet cong","Viet Cong","VIET CONG","việt công","Việt Cộng","VIỆT CỘNG","lìn","Lìn","LÌN",
    "li`n","Li`n","LI`N","thủ dâm","Thủ Dâm","THỦ DÂM","!ồn","£jn`","£ô`n","£ôÑ","£ồn","£ồñ","₫éo","₫iṭ",
    ,"1o`n","1on","1ôn","1ồn","am vat",
    "an buoi","an kut","an kuz","an loz","an no^n","äñ£0ñ","AnLoz ","ăn buoi","bµ́","Bµ0m","bµồi","b0 cu","b0 ku",
    "b3`","bà","ba`","bím","bitch","bkl","bó cu","bo ku","bó ku","bo^'","Bu'","bu b","bu' b","bu bu0j","bu buoi",
    "bu buoj","bu lol","bu' lol","bu loz","bu' loz","bu0^j","bu0+m","bu0i","bu0j","bu0j`","bu0j` ","bu0m","bu0'm",
    "bu0z`","BuBu0¡ ","bubuoj","buo^i","bUO^J`","buo^'m","buO^y`","buoi","buoi^","buoi`","buoj","buoj`","buom","buo'm",
    "buôi","Buôì","buồi","bUôj","bUồj","buồy","buớm","bướm","bướm","BVS","bym","bým","c0n dy~","c0n f0`","c0n m3",
    "c0n me","c0n mẹ","c0n phO","C0nch0","c0ng s4n","c4v3","c4ve","ca.c","cAc","cạc","Cạ̈c","Cac.","cac. ","cai dis",
    "cai' dis","cái dis","cAi DKM","cai' loz","cailoz","caj dis","caj djjt me","caj DKM","caj loz","caj lozl ","caj…Đị†",
    "cak","cAM IồN","cav3","cave","căc","cặc","cặç","Çăç","Căk","cặk","cec. ","çhÿm","CL","cON","Çoñ","con cac",
    "Çøn Çhǿ","con ch0","Con di~","con di~ ","con diem","con fò","cOn fO`","con Ion` ","con m3","con me","con mẹ",
    "cong san","cộng sản","çU+t'","cu0ng da^m","cuc'","cuc ga`","Çứ†","Cứt","ch0'","Ch0́","CH0''","ch0' ",
    "ch0 ghE dis","ch0 Sua","ch0.","Ch0'a ","chém","Chet","CHIM","CHIM ","chjm","chó","cho'","chO kOn bu'","cho'",
    "Chui","chuj","chuj? ","chuj~","chuYm","Chửi..","Chym","chym ","d!t","D!t ","D!TL","D.yt","D¥¶¯","D†CM","d0g",
    "d1~","d1t","dá¡","dai'","daj","dáj","daj'","damn","dang hang","dạng háng","dÂm","dcm","de0","de0'","de0 ",
    "de0' ","de0'","de0`","de0~ ","dek","DEK'","deo","de'o","Deó","déo","deo'","-DeO'","DEO ","deo' ","deO'  iA?",
    "deo kut'","deo'","det m3","dEt. mE.","dey the' ","dĩ","D-ĩ","di.S","di.S me.","di.t","di~","Dï§","di†","dị†",
    "dï†","dien","D-iếm","diit","dis","dïs","DIS'","dis ","dis c0n me","dis c0n mje ","DIS CO0N ME","dis cu",
    "Dis K0n Me","dis ku","dis me","Dis me.","diS me. ","Dis me… ","Dis.","dis. ","Disd","disme","diss m3",
    "Diss Me","disss","dit","di't","Dịt","dix","diz","dịz","dj","dj~","dj†","dje^'m","djE^m'","dje^'m ","djem",
    "djem'","Djf","Djit","Djj~","djjt","Djs","djx","Djz","DK ","dK.","dKm","DlT","dm","doet.","Dú","dụ","du m3",
    "du ma","du má","du me maj`","du.","du. Me.","du` moa' an kut' ","duk.","duong vat","DUYT","duyt ","DŸ  Ḿ ",
    "dy.t","Dy.t ","dy`n","dy`n ","dY~","dy~ deo' daj traj","dys","dyS mjE","dyt","dYt'","dYt ","dyt' ","Dyt Buoj  ",
    "dyt c0n m3","dỵt c0n me","dyt cai I0ng c0ng l0z","dyt dyt","Dyt K0an","dYT k0n m3","dyt kon me",
    "dyt kon me kaj'' loz`","dyt kon me sock","Dyt ku.","dyt l0z","dyt m","DYt m3 ","Dyt m3 an Kuz","dyt me","Dyt Me",
    "dYt mE nUnG l0zl ","dyt me thagfo`","dyt mE.","Dyt me. ","dYt mJe","Đ!†","Đ¡§","Đ¡†","đ¡̣†","Đ¡•t","Đ¡̣t","đ¥†",
    "ham~ Ion","ham~ loz ","ham~ lozl","ham~ lozn`","hamloz","hcm","hi3p","hi3'p","hie'p",
    "hiep'","hiếp","hiêp'","hjep","HL`","ho chi minh","hồ chí minh","i.t","I^0N","I0^k`","I0`n","I0`n`","I0n",
    "I0n`","I0z","iạ","ỉa","IO^`n","Io^n","IO^-n","Io^n ","Io^n`","IO^n` ","Io^ng","Io`n","Io`n ","Ion","Ion`",
    "Ion` me","Ion`. Dis","IoZ","Ioz ","Ioz`","Ioz` ","Iôn","Iồn","Iồñ","Iồñ ","Iôn`","Iông","ịt","ja?","k0n",
    "k0n cac","K0n Ch0","k0n ch0 an cuc' ","k0n m0e. mAj","k0n m3","k0n me","k0n me maj ","K3 M3 ","k4v3","k4ve",
    "kaj dyt mE","Kaj' dYt. mE","kak ","kat ku","kav3","kave","kăc","kặc","kặç","kit'","KLM","Kon","kon  DKM","kon ch0' ",
    "kon cho'","kon dj?","Kon Dkm","KON DY~","kon f0","kon kac","kon kak","kOn ky~","kon m3","kon me","kon mẹ","kotex",
    "Ku","kụ","kụ ","Ku*'t","kU+t'","kuc'","kuc kut","KUT","kut'","kut' ","kut ch0","kut het","Kut nat","Kuz","Kuz'",
    "Kứ†","Kứ†…Çhó","Kưt'","Kưt́","kứt","kYnh nguye^T.","khìn","khjn`","khoviIon","l dog","l to","L`","l0^n`","l0^z`",
    "L0`z","l0n","l0on","l0x","l0z","l0z`","l0z` mej","l0zl","l0zl ","l0zl`","l0zn","l0zn`","l0zz","La Liem","lA pho`",
    "lam` fo` ","li3m","li3'm","lie^M: lolz` mek lolz` ","lie'm","LIEM'","Liem I0n ch0","li'm","lím","lin`","ljn","ljn`",
    "LM","lO^`n","Lo^lz` ","lo^n","lo^n`","lo^z","lO^z`","lo^zn`","lo`n","lO+i`","LO0^N` ","lo0n`","loiz","lol","lOlz","lon",
    "lÖn","lon'","lon`","loon","loon`","loz","löz","loz`","Lozl","lozl`","lozn","Lô`n","lÔlz","lôn","lôñ","Lôñ̀","Lồn","lồñ",
    "Lôǹ ","lôn`","lồnz","lồz","lu`n","Lu`n ","Lu~ d0g","lu~ re rack:","lu~dog","Lũ…Dog Húp…Máu","lua tinh ","lun`",
    "luoj~ tat' va`o dau` buoj` ","lz0`","lz0n`","lz0n` ","lzo`","lZO`l","lzol","lzol`","lzồn","m€̣ mAj`","m0m~","m3",
    "m3 mai","mau' Io`n ","mau' Ion","mau L","mau l0z","mau lol","mau loz","mau non`","MAy`","me","Mẹ","Mẹ̈",
    "me chung maj ","me mai","me maj ","me. maj`","met loz","mI","Mịe","mie.","mje","ML","ml ","ML`","ml` ","mo^m  loz",
    "mõm","Mom~","mom~ dog  lu~ ch0","mú† ","mut","mút","mut'","mut bi0i","mut bu0j","mut ku","mut' lz0n`","Ñ§ü","Ñgậm…ßµồ¡",
        "ba.mày","bàm.ày","bac_h.o","ba.may","ban_d.am","ban_ho.a","banda.m","ba.nhoa","bán.hoa","bit.ch","bo_ma.y",
        "bo.may","bon_ch.o","bon_kh.on_nan","bonc.ho","bonk.honnan","bre.ast","buc.ac","bu.oi","bu.ồi","buo.m","b.ướm",
        "c_san","cạ.c","cặ.c","cai_bu.oi","cai_ch.im","cai_c.u","cai_lo.n","caib.uoi","caic.him","ca.icu","cail.on",
        "ca.ve","ch.im","chi.m_to","chi.mto","ch.ó","cho_ch.et","c.ho_kin","cho.chet","chok.in","con_c.ho","c.on_cu",
        "c.on_cu_cac","con_cu_to_tu.ong","c.on_di","con_die.m","con_ph.o","conc.ho","con.cu","con.cucac","concuto.tuong",
        "co.ndi","condie.m","cong_hoa","co.ng_san","cong.hoa","cong.san","conl.on","conp.ho","cs.an","c.ụ","cu_ca.c",
        "cu_h.o","cu_m.ay","cu_t.o","cuc_ca.c","cuc_c.ut","cu.cac","cucca.c","cuc.cut","cu.ho","cu.may","cu.nt","cuo.ng_dam",
        "cuon.g_hiep","cuon.gdam","cuo.nghiep","c.ứt","cut.o","đ.ái","dâ.m","da.n_chu","dan.chu","da.ng_c_s","da.ng_cong_san",
        "dang_cong.san","da.ng_cs","da.ng_tien_tri","dan.g_tientri","dang.congsan","dang.cs","dang.tien_tri","da.ngtientri",
        "dc.m","đc.m","đ.ĩ","điế.m","di.s_me","di.sme","d.it","dị.t","đí.t","đị.t","d.it_bo","di.t_con_cu","dit_co.n_me",
        "dit_c.oncu","dit_con.me","d.it_cu","dit_cu_m.ay","dit_m.e","dit_m.e","dit_o.ng","dit.ba","d.itbo","dit.me","ditm.e",
        "ditm.emay","dito.ng","d.m","đ.m","doco.ncho","do.khon","d.rug","d.ụ","đ.ụ","du_m.a","d.ục","du.ma","du.me","fu.ck",
        "gai_b.an_hoa","gai_die.m","Gaiban.hoa","Gaid.iem","h.am_hiep","Hamh.iep","ha.nh_kinh","Ha.nhkinh","Hiế.p","hiep_da.m",
        "Hiepda.m","ho_chi_mi.nh","hồ_chí_m.inh","ho_chim.inh","hochi_m.inh","Hochi.minh","I.ả","Ỉ.a","K.hốn","kho.n_nan",
        "Kho.nnan","khu.ng_bo","Kh.ungbo","Ki.ep","Ki.ép","kiế.p","la.m_tinh","lam.tinh","lie.m_cac","lie.mcac","lì.n","lo.n",
        "l.òn","lồ.n","lợ.n","lo.n_to","lo.ng_lon","lo.nglon","lo.nto","lu_ch.o","lu_k.hon","luc.ho","luk.hon","mau_k.inh",
        "m.au_lon","mauki.nh","mau.lon","m.ẹ","m.e_kiep","me_m.ay","me.kiep","me.may","mi.e","moha.met","mua_da.m","mua.dam",
        "mu.t_cac","mu.tbuoi","mut.cac","na.ke","ngu.yen_ai_quoc","nguy.en_aiquoc","nguyen.ai_quoc","nguyen.aiquoc","nguyenaiq.uoc",
        "ong_m.ay","ongm.ay","pen.is","ph.ò","pim.p","rap.e","s_h_i_t","se.x","sh.it","sin.h_duc","sin.hduc","sl.ut","so_lo.n",
        "s.olon","su_bo_ma.y","subo.may","th.ang_cho","than.gcho","tie.n_su","tien.su","tinh_du.c","tin.hduc","to_s.u","to.su",
        "v_co.ng","vai_da.i","v.ai_leu","v.ai_lin","va.i_lon","vaida.i","va.ileu","vaili.n","va.ilon","vco.ng","viet_co.ng",
        "vietc.ong","Cổ L.oa","Vạn X.uân","Thà.nh Hồ","Tha.nh Ho","Vua Đi.nh","Vu.a Lê","H.oa Lư","Cố .Đô Huế","1.ồn","1.Ồn",
        "1ồ.N","1.0n","1.0`n","1`0.n","1.o`n","1Ồ.N ","_Ba.cHo_","_Bac.Ho_","_Ba.cho_","_b.acHo_","_bAc.Ho_","ba.c_ho","B.ac_ho",
        "b.ac_Ho","Ba.c_Ho","B.ác Hồ","b.ác Hồ","B.ác hồ","bá.c hồ","b.Ác Hồ","bÁ.c hỒ","bá.C Hồ","b4.c Hồ","b4c h.Ồ","b'.4c Hồ",
        "b'4.c hỒ","b4'.c Hồ","b4'.c hỒ","ba.c h0","B.ac h0","bac H.0","B.ac H0","b.itch","BIT.CH","Bi.tch","bu.oi","Bu.oi",
        "bu.oi`","B.uoi`","b.uồi","Bu.ồi","b.u0`i","Bu.0`i","bu.Ồi","Bu.Ồi","congs.an","co.ng san","Cong. san","co.ng San",
        "Con.g San","cộn.g sản","cộn.g Sản","Cộn.g sản","co.ng_san","Con.gsan ","Con.gSan","cuh.o","Cu.ho","cuH.o","CuH.o",
        "c.uh0","Cuh.0","cu.H0","Cu.H0","cu_h.o","Cu_h.o","cU_h.o","cu_.Ho","cu_h.O","c.ụ hồ","Cụ h.ồ","cỤ h.ồ","cụ H.ồ",
        "cụ h.Ồ","c_a._c","C_a._c","c_A._c","C_A._c","C_A._C","c4.c","C.4c","C4.C","ca.c.","C.ac.","c.Ac.","C.AC.","că.c.",
        "C.ăc.","cĂ.c.","C.Ăc.","CĂ.C.","c.ặc","C.ặc","c.Ặc","CẶ.c","C.ẶC","cav.e","Ca.ve","cA.ve","CA.VE","c.Ave","CA.VE",
        "c.ứt","C.ứt","c.Ứt","C.ỨT","C.Ứt","d.1t","D1.t","D.1T","d.ai'","Da.i'","dA.i'","D.AI'","d.ái","đá.i","Đ.ái","Đ.ÁI",
        "d.âm","dÂ.m","dam.n","DAM.N","dc.m","DC.M","đc.m","ĐC.M","Đc.M","Đc.m","đ.ĩ","Đ.ĩ","đ.i~","Đ.i~","Đ.Ĩ","Đ.I~","d.i~",
        "D.ĩ","D.I~","d.i.t","D.i.t","d.I.t ","D.I.T","đ.i.t","Đ.i.t","Đ.I.T","đị.t","đ.Ịt ","Đ.ịt","Đ.ịT","Đ.ỊT ","d.is",
        "D.is","d.iS","đi.s","Đ.is","d.it","đi.t","D.it","Đ.it","DI.T","ĐI.T","đi.ếm","Đi.ếm","điẾ.m","Đi.Ếm","ĐiẾ.M","d.m",
        "D.m","D.M","đ.m","Đ.m","Đ.M","dm.m","đm.m","Dm.m","Đm.m","DM.M","ĐM.M","Đ.cm","Đc.M","đC.M","đcm.m","dk.m","đk.m",
        "d.cm","đc.m","dk.mm","đk.mm","đ.ụ","đ.Ụ","Đ.ụ","Đ.Ụ","đ.u.","Đ.u.","Đ.U.","fu.ck","F.uck","FU.CK","f_u._c_k",
        "F_U_C._K","Hồ chí m.inh","HỒ c.hí minh","hồ C.hí minh","hồ chí Mi.nh","Hồ ch.í Minh","h.ồ Chí minh","hồ ch.í minh",
        "hochi.minh","HoCh.iMinh","HOCH.IMINH","ho_ch.i_minh","Ho_Ch.i_Minh","ho ch.i minh","Ho C.hi Minh",
        "HO C.HI MINH","hi.ếp","Hi.ếp","HI.ẾP","lo.`n","L.o`n","lo.n`","L.on`","lồ.n","Lồ.n","lô.n","L.ôn","LÔ.N",
        "L.ỒN","l.Ồn","m.k","M.k","M.K","nông đứ.c mạnh ","Nông .Đức Mạnh","nongduc.manh","NONG.DUCMANH","pen.is",
        "PE.NIS","Phạ.m Văn Đồng","phạm vă.n đồng","phamvand.ong","PHAM.VANDONG","ph.ò","Ph.ò","ph.Ò","PH.Ò","p.ho`",
        "Ph.o`","PH.O`","rap.e","Ra.pe","RA.PE","s.ex","Se.x","SE.X","sh.1t","Sh1.t","SH1.T","sh.it","Sh.it","SH.IT",
        "tổ.ng bí thư","Tổng B.í Thư","tongb.ithu","tong b.i thu","vietc.ong","Vietcon.g","VIETC.ONG","viet c.ong",
        "Vi.et Cong","VIET C.ONG","việt c.ông","Việ.t Cộng","VIỆT C.ỘNG","lì.n","L.ìn","LÌ.N","li.`n","Li.`n","LI`.N",
        "th.ủ dâm","Thủ Dâ.m","TH.Ủ DÂ.M","!ồ..n","£.j.n`","£.ô`n","£ô.Ñ","£.ồn","£.ồñ","₫.éo","₫.iṭ","₫y.t","y.t.",
        ,"1.o`n","1o.n","1.ôn","1ồ.n","a.m vat",
        "an b.uoi","an k.ut","an k.uz","a.n loz","an no.^n","äñ.£0ñ","An.Loz ","ăn bu.oi","b.µ́","Bµ0.m","bµ.ồi","b.0 cu",
        "b.0 ku","b.3`","b.à","b.a`","bí.m","bit.ch","b.kl","bó c.u","bo k.u","b.ó ku","b.o^'","B.u'","b.u b","b.u' b",
        "bu b.u0j","bu b.uoi","bu b.uoj","bu l.ol","bu' l.ol","bu lo.z","bu' lo.z","bu.0^j","bu.0+m","b.u0i","bu.0j","bu.0j`",
        "bu0.j` ","b.u0m","bu.0'm","b.u0z`","Bu.Bu0¡ ","bub.uoj","bu.o^i","bU.O^J`","bu.o^'m","bu.O^y`","bu.oi","bu.oi^",
        "bu.oi`","bu.oj","b.uoj`","bu.om","bu.o'm","bu.ôi","B.uôì","b.uồi","bU.ôj","bU.ồj","bu.ồy","buớ.m","bư.ớm","bư.m",
        "BV.S","by.m","bý.m","c0.n dy~","c0n f.0`","c.0n m3","c0.n me","c0n m.ẹ","c0.n phO","C0nch.0","c0n.g s4n","c4.v3",
        "c4.ve","c.a.c","c.Ac","c.ạc","C.ạ̈c","C.ac.","c.ac. ","cai d.is","c.ai' dis","cái d.is","cAi DK.M","c.ai' loz",
        "cailo.z","caj di.s","caj dj.jt me","ca.j DKM","c.aj loz","caj lo.zl ","ca.j…Đị†","ca.k","cA.M IồN","ca.v3","ca.ve",
        "că.c","c.ặc","cặ.ç","Ç.ăç","C.ăk","cặ.k","c.ec. ","çh.ÿm","C.L","c.ON","Ço.ñ","co.n cac","Çøn Ç.hǿ","c.on ch0",
        "C.on di~","co.n di~ ","con die.m","co.n fò","cO.n fO`","con I.on` ","co.n m3","con m.e","co.n mẹ","cong sa.n",
        "cộn.g sản","çU.+t'","cu0n.g da^m","c.uc'","cuc g.a`","Ç.ứ†","C.ứt","c.h0'","Ch.0́","CH.0''","c.h0' ",
        "ch0 g.hE dis","ch0 Su.a","ch.0.","Ch.0'a ","ch.ém","Ch.et","CH.IM","CHI.M ","chj.m","ch.ó","ch.o'","chO kO.n bu'",
        "ch.o'","Ch.ui","ch.uj","ch.uj? ","ch.uj~","ch.uYm","C.hửi..","Ch.ym","ch.ym ","d.!t","D!.t ","D!.TL","D.yt","D.¥¶¯",
        "D†C.M","d.0g","d.1~","d1.t","dá.¡","d.ai'","d.aj","d.áj","da.j'","da.mn","dang ha.ng","dạn.g háng","d.Âm",
        "dc.m","de.0","d.e0'","de.0 ","d.e0' ","de.0' ","d.e0`","de.0~ ","d.ek","DE.K'","de.o","d.e'o","D.eó","d.éo",
        "de.o'","De.O'","D.EO ","de.o' ","de.O'  iA?","de.o kut'","d.eo'","d.et m3","d.Et. mE.","d.ey the' ","d.ĩ","D.-ĩ",
        "d.i.S","di.S m.e.","d.i.t","d.i~","D.ï§","d.i†","d.ị†","d.ï†","di.en","D-i.ếm","d.iit","di.s","d.ïs","D.IS'",
        "d.is ","dis c0n m.e","dis c.0n mje ","DIS CO.0N ME","di.s cu","Dis K0.n Me","d.is k.u","di.s m.e","Di.s m.e.",
        "di.S m.e. ","D.is m.e… ","Di.s.","d.is. ","Di.sd","dis.me","dis.s m3","Dis.s Me","d.isss","d.it","d.i't","Dị.t",
        "di.x","di.z","d.z","d.j","d.j~","d.j†","dj.e^'m","dj.E^m'","dj.e^'m ","dj.em","dj.em'","D.jf","D.jit","D.jj~",
        "djj.t","Dj.s","d.jx","D.jz","D.K ","d.K.","dK.m","D.lT","d.m","do.et.","D.ú","d.ụ","d.u m3","du m.a","du m.á",
        "du m.e maj`","d.u.","d.u. Me.","du` mo.a' an kut' ","du.k.","duon.g vat","D.UYT","du.yt ","D.Ÿ  Ḿ ","d.y.t",
        "D.y.t ","d.y`n","d.y`n ","d.Y~","dy~ de.o' daj traj","d.ys","dyS m.jE","d.yt","dY.t'","dY.t ","d.yt' ","Dyt B.uoj  ",
        "dyt c.0n m3","dỵt c0.n me","dyt cai I0.ng c0ng l0z","dy.t dyt","Dyt K0.an","dYT k.0n m3","d.yt kon me",
        "dyt kon m.e kaj'' loz`","dyt k.on me sock","Dy.t ku.","dyt l0.z","dy.t m","D.Yt m3 ","Dyt m.3 an Kuz",
        "dyt m.e","D.yt Me ","dYt m.E nUnG l0zl ","dyt m.e thagfo`","dyt .mE.","Dyt .me. ","dY.t mJe","Đ.!†",
        "Đ.¡§","Đ.¡†","đ.¡̣†","Đ.¡•t","Đ.¡̣t","đ¥.†","Đ.¥̣†","Đ.¥t","Đ¥̣.T","Đ€́.ø","Đ.µ","đ.µ̣","Đµ̣. Møª́","Đµ́.†","Đ†ç.m",
        "đ.ái","đả.ng","đc.m","đ.é0","Đe.ó","đ.éo","Đ.ĩ","Đ.ï","Đĩ Đ.ựç","Đ.i†","Đ.ị†","đị̈.†","Đ.i† ","Đ.ị† ",
        "đi†Çâ.ñAñh","Đi†m.ẹ","Đi.Ếm","đi.ên","Đ.iĩ","Đ.is","Đị.s ","Đ.is Mẹ","Đ.it","Đ.ịt","Đ.ịt ","Đ.it M3.","Đi.t mẹ",
        "Đ.ịt me","Đ.ịt mẹ","Đ.ịt.","Địt. Đ.ỳn","Đ.ịt...","đ.iz","Đ.î†̣","Đị̂.†","Đ.ị̂†…mẹ","Đ.ị̂t","đ.J†","đ.jếm",
        "đjế.m  ","đj.t","Đ.j̣t","đk.lm","Đk.m","ĐK.M ","đl.t","Đ.m","đ.u","Đ.ụ","Đ.ụ mẹ ","Đ.ỹ","Đ.ÿ§ ","Đy.†","Đ.ÿ†",
        "Đỵ̈.†","Đ.y† ","Đỵ† k.ụ ","Đ.Ỵ̈† m€̣","Đ.ys…","Đ.yt","Đ.ỴT","Đ.Ÿt","đ.Yt ","đ.yṭ mẹ","Đ.yt me.","đy.t.","Đ.yz","f`.O`",
        "k.ụ ","K.u*'t","kU.+t'","k.uc'","k.uc kut","K.UT","k.ut'","k.ut' ","ku.t ch0","ku.t het","K.ut nat","K.uz","K.uz'","K.ứ†",
        "Kứ.†…Çhó","K.ưt'","K.ưt́","k.ứt","kY.nh nguye^T.","kh.ìn","kh.jn`","kho.viIon","l do.g","l t.o","L.`","l.0^n`","l0.^z`",
        "L.0`z","l0.n","l0o.n","l0.x","l.0z","l0.z`","l0z` me.j","l0.zl","l0.zl ","l0.zl`","l0.zn","l0.zn`","l0.zz","La Li.em","lA ph.o`",
        "la.m` fo`","li3.m","l.i3'm","lie^M: lolz` m.ek lolz` ","li.e'm","LIE.M'","Lie.m I0n ch0","li'.m","lí.m","li.n`","l.jn","lj.n`",
        "L.M","l.O^`n","L.o^lz` ","l.o^n","l.o^n`","l.o^z","l.O^z`","lo^z.n`","lo.`n","l.O+i`","LO.0^N` ","lo.0n`","lo.iz","l.ol","lO.lz",
        "lo.n","l.Ön","lo.n'","l.on`","lo.on","loo.n`","lo.z","l.öz","lo.z`","L.ozl","lo.zl`","lo.zn","L.ô`n","lÔ.lz","lô.n","l.ôñ","L.ôñ̀",
        "L.ồn","lồ.ñ","Lô.ǹ ","lô.n`","l.ồnz","l.ồz","lu.`n","Lu.`n ","Lu~ d.0g","lu~ re ra.ck:","lu~d.og","Lũ…Dog H.úp…Máu",
        "lua ti.nh ","lu.n`","luoj~ tat' va.`o dau` buoj` ","lz.0`","lz.0n`","lz.0n` ","lz.o`","lZ.O`l","lz.ol","lz.ol`","lz.ồn",
        "m€̣ m.Aj`","m.0m~","m.3","m3 ma.i","ma.u' Io`n ","m.au' Ion","ma.u L","m.au l0z","ma.u lol","m.au loz","ma.u non`",
        "M.Ay`","m.e","M.ẹ","M.ẹ̈","m.e chu.ng maj ","m.e m.ai","m.e m.aj ","me. Ma.j`","me.t loz","m.I","M.ịe","mi.e.","m.je","M.L","m.l ",
        "M.L`","m.l` ","mo.^m  loz","m.õm","Mo.m~","mo.m~ dog  lu~ ch0","m.ú† ","m.ut","mú.t","m.ut'","m.ut bi0i","mut b.u0j","m.ut ku",
        "m.ut' lz0n`","Ñ.§ü","Ñ.gậm…ßµồ¡","ni.ém","nj.n`","n.o^n`","n.o`n","no.n","n.on^`","no.n`","n.ôn","n.ồn","N.ồñ","Ñ.ồñ",
        "Nồ.n ","Ñ.ôǹ ","nỒ.z","n.u*ng'","nU.n`","nu.ng*' loz` ","nứ.ng","ng.u","n.h0n`","nh.a` may`","n.ho^n`","nh.u cac",
        "N.huc̣…","nh.uk ","p.3`","p.à","p.A`","pa` m.ay`","pe.nis","playk.u","pó c.u","po k.u","pó k.u","po ma.y` ","p.o'",
        "p.o`","P.uoi`","pu.ồj","Ph.`o ","p.h0`","ph.a^n","ph.an^","ph.ân","ph.ò","p.ho`","ra.ck","R.áçk","r.ai'","ra.pe",
        "re r.ack","rẻ ra.cḱ ","s0.ck k0n me","S.elit","se.x","sh.1t","sh.it","s.ip","sk.m","sO.ck","so.cl","ß.µ́","ßµ.ô¡","ßµ.ồ¡",
        "ßµ.ồ¡¯","ßµ.ồ¿","ß.µồi","ß.µồï","ß.µồi¯","ßµ.ôî","ß.µồî","ß.ố","ßu.oi","ßu.oj","ß.uoj`","ßu.om","ß.uồi","ß.ựa",
        "ßư.ớm","su.a?","s.uc vaT","t.bc","t.bs","Tie.n Su","Tu.oi? Io`n ","tYnh tru.G` ","tha.ng fo","thang p.ho","th.ang` fo",
        "thoi k.en","thủ d.âm","thủ z.âm","thu.? za^m","tr1.nh","tri.nh","trj.nh","t.rlnh","tr.o'","tr.o'","t.rym","try.nh",
        "v.åi","v.kc","v.kl","v.l","v.ú","tư b.ản đỏ","tub.ando","tu b.an do","tư.bản","xã hội ch.ũ nghĩa","xahoic.hunghia",
        "xã hoich.unghia","sã hội chũ ng.hĩa","xa hội chu.nghia","xahoi ch.ủ nghia","xahoic.hu nghĩa","tư bản ch.ủ nghĩa",
        "tubanchu.nghia","tu ban ch.u nghia","tưbản.chủnghĩa","sã.hộichũnghĩa","xãhội.chũnghĩa","an_ca_c","anc_ac","ăn c_ặc",
        "ăn_cặc","ba_ma_y","bà m_ày","ba m_ày","bà_may","ba_mày","bàm_ày","bac_h_o","ba_may","ban_d_am","ban_ho_a","banda_m",
        "ba_nhoa","bán_hoa","bit_ch","bo_ma_y","bo_may","bon_ch_o","bon_kh_on_nan","bonc_ho","bonk_honnan","bre_ast","buc_ac",
        "bu_oi","bu_ồi","buo_m","b_ướm","c_san","cạ_c","cặ_c","cai_bu_oi","cai_ch_im","cai_c_u","cai_lo_n","caib_uoi","caic_him",
        "ca_icu","cail_on","ca_ve","ch_im","chi_m_to","chi_mto","ch_ó","cho_ch_et","c_ho_kin","cho_chet","chok_in","con_c_ho",
        "c_on_cu","c_on_cu_cac","con_cu_to_tu_ong","c_on_di","con_die_m","con_ph_o","conc_ho","con_cu","con_cucac","concuto_tuong",
        "co_ndi","condie_m","cong_hoa","co_ng_san","cong_hoa","cong_san","conl_on","conp_ho","cs_an","c_ụ","cu_ca_c","cu_h_o",
        "cu_m_ay","cu_t_o","cuc_ca_c","cuc_c_ut","cu_cac","cucca_c","cuc_cut","cu_ho","cu_may","cu_nt","cuo_ng_dam","cuon_g_hiep",
        "cuon_gdam","cuo_nghiep","c_ứt","cut_o","đ_ái","dâ_m","da_n_chu","dan_chu","da_ng_c_s","da_ng_cong_san","dang_cong_san",
        "da_ng_cs","da_ng_tien_tri","dan_g_tientri","dang_congsan","dang_cs","dang_tien_tri","da_ngtientri","dc_m","đc_m","đ_ĩ",
        "điế_m","di_s_me","di_sme","d_it","dị_t","đí_t","đị_t","d_it_bo","di_t_con_cu","dit_co_n_me","dit_c_oncu","dit_con_me",
        "d_it_cu","dit_cu_m_ay","dit_m_e","dit_m_e","dit_o_ng","dit_ba","d_itbo","dit_me","ditm_e","ditm_emay","dito_ng","d_m",
        "đ_m","doco_ncho","do_khon","d_rug","d_ụ","đ_ụ","du_m_a","d_ục","du_ma","du_me","fu_ck","gai_b_an_hoa","gai_die_m",
        "Gaiban_hoa","Gaid_iem","h_am_hiep","Hamh_iep","ha_nh_kinh","Ha_nhkinh","Hiế_p","hiep_da_m","Hiepda_m","ho_chi_mi_nh",
        "hồ_chí_m_inh","ho_chim_inh","hochi_m_inh","Hochi_minh","I_ả","Ỉ_a","K_hốn","kho_n_nan","Kho_nnan","khu_ng_bo",
        "Kh_ungbo","Ki_ep","Ki_ép","kiế_p","la_m_tinh","lam_tinh","lie_m_cac","lie_mcac","lì_n","lo_n","l_òn","lồ_n",
        "lợ_n","lo_n_to","lo_ng_lon","lo_nglon","lo_nto","lu_ch_o","lu_k_hon","luc_ho","luk_hon","mau_k_inh","m_au_lon",
        "mauki_nh","mau_lon","m_ẹ","m_e_kiep","me_m_ay","me_kiep","me_may","mi_e","moha_met","mua_da_m","mua_dam","mu_t_cac",
        "mu_tbuoi","mut_cac","na_ke","ngu_yen_ai_quoc","nguy_en_aiquoc","nguyen_ai_quoc","nguyen_aiquoc","nguyenaiq_uoc","ong_m_ay",
        "ongm_ay","pen_is","ph_ò","pim_p","rap_e","s_h_i_t","se_x","sh_it","sin_h_duc","sin_hduc","sl_ut","so_lo_n","s_olon",
        "su_bo_ma_y","subo_may","th_ang_cho","than_gcho","tie_n_su","tien_su","tinh_du_c","tin_hduc","to_s_u","to_su","v_co_ng",
        "vai_da_i","v_ai_leu","v_ai_lin","va_i_lon","vaida_i","va_ileu","vaili_n","va_ilon","vco_ng","viet_co_ng","vietc_ong",
        "ƒu.c¶«","fu.ck","ƒu.ck","ƒü.çk","Fu.uck","gh.e?","gie? Ra.ch' ","ha.m~ Ion","h.am~ loz ","ham~ lo.zl","ha.m~ lozn`",
        "ha.mloz","hc.m","hi.3p","hi.3'p","hi.e'p","hie.p'","h.iếp","hiê.p'","hj.ep","H.L`","ho ch.i minh","hồ ch.í minh",
        "i.tnh.au","I^0.N","I.0^k`","I.0`n","I.0`n`","I0.n","I.0n`","I.0z","i.ạ","ỉ.a","I.O^`n","I.o^n","I.O^-n","I.o^n ",
        "I.o^n`","IO.^n` ","I.o^ng","I.o`n","Io.`n ","I.on","Io.n`","Io.n` me","Io.n`. Dis","I.oZ","I.oz ","I.oz`","Io.z` ",
        "Iô.n","I.ồn","Iồ.ñ","I.ồñ ","Iô.n`","Iô.ng","ị.t","j.a?","k.0n","k0.n cac","K0.n Ch0","k0n c.h0 an cuc' ",
        "k0n m.0e. mAj","k0n m.3","k0n m.e","k0n m.e maj ","K3 M.3 ","k4.v3","k4.ve","kaj d.yt mE","K.aj' dYt. mE","ka.k ",
        "k.at ku","ka.v3","ka.ve","k.ăc","k.ặc","k.ặç","k.it'","K.LM","K.on","ko.n  DKM","ko.n ch0' ","k.on cho'","k.on dj?",
        "Ko.n Dkm","KO.N DY~","ko.n f0","k.on kac","kon k.ak","kO.n ky~","k.on m3","kon m.e","ko.n mẹ","kote.x","K.u",
        "k.ụ","k.ụ ","K.u*'t","kU.+t'","k.uc'","k.uc kut","K.UT","k.ut'","k.ut' ","ku.t ch0","ku.t het","K.ut nat",
        "l0.zl`","l0.zn","l0.zn`","l0.zz","La Li.em","lA ph.o`","la.m` fo` ","li3.m","l.i3'm","lie^M: lolz` m.ek lolz` ",
        "li.e'm","LIE.M'","Lie.m I0n ch0","li'.m","lí.m","li.n`","l.jn","lj.n`","L.M","l.O^`n","L.o^lz` ",
        "l.o^n","l.o^n`","l.o^z","l.O^z`","lo^z.n`","lo.`n","l.O+i`","LO.0^N` ","lo.0n`","lo.iz","l.ol","lO.lz",
        "lo.n","l.Ön","lo.n'","l.on`","lo.on","loo.n`","lo.z","l.öz","lo.z`","L.ozl","lo.zl`","lo.zn","L.ô`n",
        "lÔ.lz","lô.n","l.ôñ","L.ôñ̀","L.ồn","lồ.ñ","Lô.ǹ ","lô.n`","l.ồnz","l.ồz","lu.`n","Lu.`n ","Lu~ d.0g",
        "lu~ re ra.ck:","lu~d.og","Lũ…Dog H.úp…Máu","lua ti.nh ","lu.n`","luoj~ tat' va.`o dau` buoj` ","lz.0`",
        "lz.0n`","lz.0n` ","lz.o`","lZ.O`l","lz.ol","lz.ol`","lz.ồn","m€̣ m.Aj`","m.0m~","m.3","m3 ma.i",
        "ma.u' Io`n ","m.au' Ion","ma.u L","m.au l0z","ma.u lol","m.au loz","ma.u non`","M.Ay`","m.e","M.ẹ","M.ẹ̈",
        "m.e chu.ng maj ","m.e m.ai","m.e m.aj ","me. Ma.j`","me.t loz","m.I","M.ịe","mi.e.","m.je","M.L","m.l ","M.L`","m.l` ",
        "mo.^m  loz","m.õm","Mo.m~","mo.m~ dog  lu~ ch0","m.ú† ","m.ut","mú.t","m.ut'","m.ut bi0i","mut b.u0j","m.ut ku","m.ut' lz0n`",                              
		"tYnh tru.G` ","tha.ng fo","thang p.ho","th.ang` fo","thoi k.en","thủ d.âm","thủ z.âm","thu.? za^m","tr1.nh","tri.nh","trj.nh","t.rlnh","tr.o'","tr.o'",
        "t.rym","try.nh","v.åi","v.kc","v.kl","v.l","v.ú","tư b.ản đỏ","tub.ando","tu b.an do","tư.bản","xã hội ch.ũ nghĩa","xahoic.hunghia",
		"xã hoich.unghia","sã hội chũ ng.hĩa","xa hội chu.nghia","xahoi ch.ủ nghia","xahoic.hu nghĩa","tư bản ch.ủ nghĩa","tubanchu.nghia",
		"tu ban ch.u nghia","tưbản.chủnghĩa","sã.hộichũnghĩa","xãhội.chũnghĩa","an_ca_c","anc_ac","ăn c_ặc","ăn_cặc","ba_ma_y","bà m_ày","ba m_ày","bà_may","ba_mày","bàm_ày",
		"condie_m","cong_hoa","co_ng_san","cong_hoa","cong_san","conl_on","conp_ho","cs_an","c_ụ","cu_ca_c","cu_h_o","cu_m_ay","cu_t_o",
		"cu_ho","cu_may","cu_nt","cuo_ng_dam","cuon_g_hiep","cuon_gdam","cuo_nghiep","c_ứt","cut_o",
		"đ_ái","dâ_m","da_n_chu","dan_chu","da_ng_c_s","da_ng_cong_san",
        "dang_cong_san","da_ng_cs","da_ng_tien_tri","dan_g_tientri","dang_congsan","dang_cs","dang_tien_tri","da_ngtientri","dc_m","đc_m","đ_ĩ","điế_m",
		"di_s_me","di_sme","d_it","dị_t","đí_t","đị_t","d_it_bo","di_t_con_cu","dit_co_n_me","dit_c_oncu","dit_con_me","d_it_cu","dit_cu_m_ay","dit_m_e",
		"dit_m_e","dit_o_ng","dit_ba","d_itbo","dit_me","ditm_e","ditm_emay",
        "dito_ng","d_m","đ_m","doco_ncho","do_khon","d_rug","d_ụ","đ_ụ","du_m_a","d_ục","du_ma","du_me","fu_ck","gai_b_an_hoa","gai_die_m","Gaiban_hoa",
		"Gaid_iem","h_am_hiep","Hamh_iep","ha_nh_kinh","Ha_nhkinh","Hiế_p","hiep_da_m","Hiepda_m","ho_chi_mi_nh","hồ_chí_m_inh","ho_chim_inh","hochi_m_inh",
		"Hochi_minh","ngu_yen_ai_quoc","nguy_en_aiquoc","nguyen_ai_quoc","nguyen_aiquoc","nguyenaiq_uoc","ong_m_ay","ongm_ay","pen_is","ph_ò","pim_p","rap_e","s_h_i_t",	"se_x","sh_it","sin_h_duc","sin_hduc","sl_ut","so_lo_n","s_olon","su_bo_ma_y","subo_may","th_ang_cho","than_gcho","tie_n_su","tien_su","tinh_du_c",
"đ_m","Đ_m","Đ_M","dm_m","đm_m","Dm_m","Đm_m","DM_M","ĐM_M","Đ_cm","Đc_M","đC_M","đcm_m","dk_m","đk_m","d_cm","đc_m","dk_mm","đk_mm","đ_ụ","đ_Ụ","Đ_ụ","ca_ve","că_c","c_ặc","cặ_ç","Ç_ăç","C_ăk","cặ_k","c_ec_ ","çh_ÿm","C_L","c_ON","Ço_ñ","co_n cac","Çøn Ç_hǿ","c_on ch0","C_on di~","co_n di~ ","con die_m","co_n fò","cO_n fO`","con I_on` ","co_n m3","con m_e","co_n mẹ","cong sa_n","cộn_g sản","çU_+t'","cu0n_g da^m","c_uc'","cuc g_a`","Ç_ứ†","C_ứt","c_h0'","Ch_0́","CH_0''","c_h0' ","ch0 g_hE dis","ch0 Su_a","ch_0_","Ch_0'a ","ch_ém","Ch_et","CH_IM","CHI_M ","chj_m","ch_ó","ch_o'","chO kO_n bu'","ch_o'","Ch_ui","ch_uj","ch_uj? ","ch_uj~","ch_uYm","C_hửi__","Ch_ym","ch_ym ","d_!t","D!_t ","D!_TL","D_yt","D_¥¶¯","D†C_M","d_0g","d_1~","d1_t","dá_¡","d_ai'","d_aj","d_áj","da_j'","da_mn","dang ha_ng","dạn_g háng","d_Âm","dc_m","de_0","d_e0'","de_0 ","d_e0' ","de_0' ",		
        "m_3","m3 ma_i","ma_u' Io`n ","m_au' Ion","ma_u L","m_au l0z","ma_u lol","m_au loz","ma_u non`","M_Ay`","m_e","M_ẹ","M_ẹ̈","m_e chu_ng maj ","m_e m_ai","m_e m_aj ","me_ Ma_j`","me_t loz","m_I","M_ịe","mi_e_","m_je","M_L","m_l ","M_L`","m_l` ","mo_^m  loz","m_õm","Mo_m~","mo_m~ dog  lu~ ch0","m_ú† ","m_ut","mú_t","m_ut'","m_ut bi0i","mut b_u0j","m_ut ku","m_ut' lz0n`","Ñ_§ü","Ñ_gậm…ßµồ¡","ni_ém","nj_n`","n_o^n`","n_o`n","no_n","n_on^`","no_n`","n_ôn","n_ồn","N_ồñ","Ñ_ồñ","Nồ_n ","Ñ_ôǹ ","nỒ_z","n_u*ng'","nU_n`","nu_ng*' loz` ","nứ_ng","ng_u","n_h0n`","nh_a` may`","n_ho^n`","nh_u cac","N_huc̣…","nh_uk ","p_3`","p_à","p_A`","pa` m_ay`","pe_nis","playk_u","pó c_u","po k_u","pó k_u","po ma_y` ","p_o'",
       	"xahoic*hunghia","xã hoich*unghia","sã hội chũ ng*hĩa","xa hội chu*nghia","xahoi ch*ủ nghia","xahoic*hu nghĩa","tư bản ch*ủ nghĩa","tubanchu*nghia",
		"tu ban ch*u nghia","tưbản*chủnghĩa","sã*hộichũnghĩa","xãhội*chũnghĩa","nong duc manh","nong ducmanh","nongduc manh","Chính phủ","Chínhphủ","CSVN",
		"le kha phieu","Lê khả phiêu","Lêkhả phiêu","Lê khảphiêu","lekha phieu","le khaphieu","lekhaphieu","VNCH","Trung Cộng-Việt Cộng","trungcong-vietcong",
		"trungcong-viet cong","trung cong-viet cong","trung cong-vietcong","TrungCộng-Việt Cộng","TrungCộng-ViệtCộng","Trung Cộng-ViệtCộng","Phạm Văn Ðồng",
		"PhạmVăn Ðồng","PhạmVănÐồng","Phạm VănÐồng","phamvandong","pham vandong","pham van dong","phamvan dong","VNDCCH","Trung Cộng","TrungCộng","trungcong",
		"trung cong","Ðại Nam","ÐạiNam","DaiNam","Dai Nam","chính trị","chinh tri","Nguyễn Huệ","Quang Trung","Hai Bà Trưng","Nguyen Hue","Quang Trung",
		"Hai Ba Trung","Nguyễn Minh Triết","Nguyen Minh Triet","Nguyễn Tấn Dũng","Nguyen Tan Dung","quốc hội","quoc hoi","bộ trính trị","bo trinh tri",
		"đảng","Đảng Cộng sản Việt Nam","dang cong san Viet Nam","Nguyễn Thị Doan","mat tran to quoc Viet Nam","mặt trận tổ quốc Việt Nam","khủng bố",
		"Nguyen Thai Hoc","Nguyễn Thái Học","Cần Lao","Can lao","Ngô Đình Diệm","Ngo Dinh Diem","ông Hồ","VNCH","Hồ chủ tịch","Ho chu tich","Việt tân",
		"Viet tan","phản động","phan dong","Hitler","Stalin","Bach Dang Giang","Bạch Đằng Giang","CHXHCN ","cách mạng mầu","cach mang mau","Đảng thăng tiến",
		"khoi 8406","Khối 8406","Đảng dân chủ XXI","dang dan chu XXI","Bô-xit","bo-xit","bauxite","phản quốc","phan quoc",
        "cắn","bậy","giao phối","giao hợp","loạn luân","ịt","Ịt","ịT","ỊT","Quasoha","QuaSoha","QuaSoHa","QUASOHA","quasoha"        
    ];

    /*/ "i" is to ignore case and "g" for global

   var rgx = new RegExp(filterWords.join(""), "gi");
   return sText.replace(rgx, "***");
   */
var filterWords2 = [
        "quasoha","soha"
    ];
var char_h ="************************************";
	var temp = sText.split(' ');
	var text1 = "";
	for(var i= 0; i< temp.length;i++){
        for (var j=0 in filterWords)
        {
           if(temp[i].toLowerCase() == filterWords[j].toLowerCase()){
				var l = temp[i].length;
				temp[i]=char_h.substr(0,l);
				break;
		    }
        }

        text1 = text1 + " " + temp[i];
	}

    for (var m=0 in filterWords)
    {
        if(text1.search(filterWords[m]))
        {
            text1=text1.replace(filterWords[m],char_h.substr(0,filterWords[m].length));
        }
    }
	var textsearch;
	for (var n=0 in filterWords2)
    {
		textsearch = RegExp(filterWords2[n], 'gi')
        if(text1.search(textsearch))
        {
            text1=text1.replace(textsearch,char_h.substr(0,filterWords2[n].length));
        }
    }

	return text1;
}   
   
   
   
   
   