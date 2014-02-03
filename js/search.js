var friends = null;
function friends_search()
{ 
	var access;

	if(getCookie("fb_uid") === "")
	{
		access = "100000413660757";
	}
	else
		access=getCookie("fb_uid");

	var request=$.ajax({
		url:"friends.php",
		data:{ token : access },
		dataType:"json"
	}).done(function(data){
		friends = data;
	}).fail(function(data){
		alert("firends fetching failed");
	});
}
(function(){
	friends_search();
})();

function certify()
{
	var request=$.ajax({ url : "http://searchhorizon.herokuapp.com/certified.php",dataType:"json"}).done(function(data){
		$("div#panel-advanced").text(data.login);
	}).fail(function(data){
		//$("div#panel-advanced").text("Request Failing");
	});
}
function getCookie(cname)
{
var name = cname + "=";
var ca = document.cookie.split(';');
for(var i=0; i<ca.length; i++)
  {
  var c = ca[i].trim();
  if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
return "";
} 
var opts = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};
var spinner = new Spinner(opts).spin();
var pdom,tdom,fdom,gdom,dom;
var rank=false;

function find_friend(uid)
{
	var obj,left,right,mid;

	if( getCookie("fb_uid") === "" && uid === "100000413660757")
	{ return friends[0][friends[0].length-1]; }
	else if( getCookie("fb_uid") === "")
	{ ; }
	else if( getCookie("fb_uid") === uid )
	{ return friends[0][friends[0].length-1]; }

	if(friends)
	{
		obj = friends[0];
		left = 0;
		right = friends[0].length;
		while(left <= right)
		{
			mid = Math.floor(( left + right )/2);
			if( obj[mid].uid === uid )
			{
				return obj[mid];
			}
			else if( parseInt(obj[mid].uid) < parseInt(uid) )
			{
				left = mid + 1;
			}
			else if( parseInt(obj[mid].uid) > parseInt(uid) )
			{
				right = mid - 1;
			}
		}
		return null;
	}
	else
	{
		return null;
	}

}
function data_fetch(key)
{
	var access;
    if(getCookie("fb_uid") == "")
	{
		access = "100000413660757";
	}
	else
		access=getCookie("fb_uid");

	//fetch friends list
	if(friends)
		;
	else
		friends_search();

	var request=$.ajax({
		url:"search.php",
		data: { token: access,keyword:key},
		dataType:"json",
		beforeSend: function(){
			$("div#panel-advanced").empty();
			$("div.wait").append(spinner.el);
		}
	}).done(function(data){
		// $("div#panel-advanced").text(data);
		var obj=data;
		$("div.wait").empty();
		if(typeof(obj[1].login) != "undefined")
		{
			if((obj[1].login).localeCompare("No token")==0)
			{
				$("div#panel-advanced").text("Fetch Failing with No token");
				return;
			}
			else if((obj[1].login).localeCompare("No keyword")==0)
			{
				$("div#panel-advanced").text("Fetch Failing with No keyword");
				return;
			}
			else if((obj[1].login).localeCompare("success")==0)
			{
				var index=0,container="<div id=ires><ol></ol></div>",content,jsonobj,name;
				var summary,title,url,image_urls,created_time,link_id,owner,owner_comment;
				$("div#panel-advanced").append(container);
				if(typeof (obj[0][index].summary) != "undefined" & typeof(obj[0][index].uid) == "undefined" )
					do{

								summary=obj[0][index].summary;
								  title=obj[0][index].title;
								    url=obj[0][index].url;
							 image_urls=obj[0][index].image_urls;
						   created_time=new Date(parseInt(obj[0][index].created_time)*1000);
								link_id=obj[0][index].link_id;
								  owner=obj[0][index].owner;
						  owner_comment=obj[0][index].owner_comment;

						if(friends)
							jsonobj=find_friend(owner);
						else
							;
						if(jsonobj)
							name = jsonobj.username;
						else
							name = eval(owner);

						if(image_urls === "null" || image_urls == null)
						 {
						 	if(owner === "null" || owner == null )
						 		image_urls="";
						 	else
						 	{
						 		if(jsonobj)
						 		{
						 			image_urls=jsonobj.picture;
						 			image_urls=(image_urls == null)?"":image_urls;
						 		}
						 		else
						 			image_urls="";
						 	}
						 }
						 if(owner_comment === "" || owner_comment == null)
						 {
						 	owner_comment="http://www.facebook.com/"+link_id;
						 }
						content="<li class='g'><div class=\"col-md-8 column\"><h3 class='r'><a href='http://www.facebook.com/"+link_id+"'>"+owner_comment+"</a><br><a href='http://www.facebook.com/"+owner+"'>Post By:  "+name+"</a></h3><div class='s'><div class='kv' style='margin-bottom:2px'><ctime>Create Time:"+created_time+"</ctime></div></div><span class='st'>"+summary+"</span><br><span class='title'>"+title+"</span><br><a href='"+url+"'><span class='url'>"+url+"</span></a><br><br></div><div class=\"col-md-4 column\"><a class='pic' href='https://www.facebook.com/"+link_id+"'><img src='"+image_urls+"'/></a></div></li>";
						
						$("div#panel-advanced div#ires ol").append(content);
						index++;
					}while(index<20 && typeof(obj[0][index]) != "undefined" && typeof(obj[0][index].uid) == "undefined");
				else
				{
					content="<li class='g notfound'><div class=\"col-md-12 column\"><h3 class='r'><a href='http://www.facebook.com/100000413660757'>Sorry, No Result Orz</a><br><a href='http://www.facebook.com/100000413660757'>:( Leon Lin</a></h3></a><a class='pic' href='https://www.facebook.com/accelerater'><img src='img/notfound.png'/></a></div></li>";
					$("div#panel-advanced div#ires ol").append(content);
				}
					$("div#panel-advanced div#ires ol").append('<br><br><li class="g"><div class="alert alert-success"><a href="https://www.facebook.com/'+obj[0][index].uid+'" class="alert-link"><h3>'+obj[0][index].username+'</h3><img src="'+obj[0][index].picture+'"></a></div></li>');
					dom = $("div#panel-advanced div#ires ol").clone();
			}
			else
			{
				$("div#panel-advanced").text("Wrong with login attribute");
			}
		}
		else
			$("div#panel-advanced").text("Wrong with login undefined");
	}).fail(function(data){
		$("div#panel-advanced").text("Fetch Failing");
	});
	var plurk= $.ajax({	
	url:"fetch.php",
	data: { site:1,keyword:key},
	dataType:"text",
	beforeSend: function(){
		$("div#panel-plurk").empty();
	}}).done(function(data){
		pdom=jQuery.parseHTML(data);
		$("div#panel-plurk").append(pdom);
	}).fail(function(data){
		$("div#panel-plurk").text("Fetch Failing");		
	}).always(function(){
		var twitter= $.ajax({		
		url:"fetch.php",
		data: { site:2,keyword:key},
		dataType:"text",
		beforeSend: function(){
		$("div#panel-twitter").empty();}})
		.done(function(data){
			tdom=jQuery.parseHTML(data);
			$("div#panel-twitter").append(tdom);
		})
		.fail(function(data){
			$("div#panel-twitter").text("Fetch Failing")
		}).always(function(){
			var face= $.ajax({		
			url:"fetch.php",
			data: { site:3,keyword:key},
			dataType:"text",
			beforeSend: function(){
				$("div#panel-facebook").empty();
			}})
			.done(function(data){
				fdom=jQuery.parseHTML(data);
				$("div#panel-facebook").append(fdom);
			})
			.fail(function(data){
				$("div#panel-facebook").text("Fetch Failing");
			})
			.always(function(){
				var google= $.ajax({		
				url:"fetch.php",
				data: { site:4,keyword:key},
				dataType:"text",
				beforeSend: function(){
					$("div#panel-googleplus").empty();
				}}).done(function(data){
					gdom=jQuery.parseHTML(data);
					$("div#panel-googleplus").append(gdom);
					$("h3>a,li.g>a").attr("target","_blank");
				}).fail(function(data){
					$("div#panel-googleplus").text("Fetch Failing");
				});
			});
		});
	});
	if(rank == true)
	{
		rank = false;
		resetConfigs();
	}
	else
		;
}
function direct_rank()
{
	var pdom_clone,tdom_clone,fdom_clone,gdom_clone;
	$("div#panel-advanced ol").empty();
	$("div.wait").append(spinner.el);
	var dom_clone = dom.clone().find("li.g");
	$("div#panel-advanced ol").append(dom_clone);
	$("div.wait").empty();
	rank=false;
}
function round_robin()
{
	var pdom_clone,tdom_clone,fdom_clone,gdom_clone;
	$("div#panel-advanced ol").empty();
	$("div.wait").append(spinner.el);
	var dom_clone = dom.clone().find("li.g");

	pdom_clone = $("div#panel-plurk ol").clone().find("li.g");
	tdom_clone = $("div#panel-twitter ol li.g").clone();//.find("li.g");
	fdom_clone = $("div#panel-facebook ol li.g").clone();//.find("li.g");
	gdom_clone = $("div#panel-googleplus ol li.g").clone();//.find("li.g");

	var temp=tdom_clone.html();
	tdom_clone.empty();
	tdom_clone.append("<div class=\"col-md-8 column\"></div><div class=\"col-md-4 column\"></div>");
	tdom_clone.children("div.col-md-8").append(temp);
	tdom_clone.children("div.col-md-4").append("<i class=\"fa fa-twitter\"></i>");

	temp=fdom_clone.html();
	fdom_clone.empty();
	fdom_clone.append("<div class=\"col-md-8 column\"></div><div class=\"col-md-4 column\"></div>");
	fdom_clone.children("div.col-md-8").append(temp);
	fdom_clone.children("div.col-md-4").append("<i class=\"fa fa-facebook\"></i>");

	temp=gdom_clone.html();
	gdom_clone.empty();
	gdom_clone.append("<div class=\"col-md-8 column\"></div><div class=\"col-md-4 column\"></div>");
	gdom_clone.children("div.col-md-8").append(temp);
	gdom_clone.children("div.col-md-4").append("<i class=\"fa fa-google-plus\"></i>");

	var index=0,rows=0;
	do{
		if(typeof(dom_clone[index]) !== undefined )
		{
			$("div#panel-advanced ol").append(dom_clone[index]);
			rows++;
		}
		if(typeof(pdom_clone[index]) !== undefined )
		{
			$("div#panel-advanced ol").append(pdom_clone[index]);
			rows++;
		}
		if(typeof(tdom_clone[index]) !== undefined )
		{
			//<i class=\"fa fa-twitter\"></i>
			$("div#panel-advanced ol").append(tdom_clone[index]);
			rows++;
		}
		if(typeof(fdom_clone[index]) !== undefined )
		{
			//<i class=\"fa fa-facebook\"></i>
			$("div#panel-advanced ol").append(fdom_clone[index]);
			rows++;
		}
		if(typeof(gdom_clone[index]) !== undefined )
		{
			//<i class=\"fa fa-google-plus\"></i>
			$("div#panel-advanced ol").append(gdom_clone[index]);
			rows++;
		}
		index+=1;
	}while(rows < 25);
	$("div#panel-advanced ol li.g div.alert-success").remove();
	$("li.notfound").remove();
	$("div.wait").empty();
	rank=true;
}