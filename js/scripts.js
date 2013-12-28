window.onload=function(){
	var command="";
	$("body").keydown(function( event ){
		switch(event.which)
		{
			//up down left right
			case 13:
				callSearch();
				break;
			case 38:
				command+="1";
				break;
			case 40:
				command+="2";
				break;
			case 37:
				command+="3";
				break;
			case 39:
				command+="4";
				break;
			//B b
			case 66:
			case 98:
				command+="5";
				break;
			//A a
			case 65:
			case 97:
				command+="6";
				break;
		//s S n N o O w W
			case 83:
			case 115:
				command+="s";
				break;
			case 78:
			case 110:
				command+="n";
				break;
			case 79:
			case 111:
				command+="o";
				break;
			case 87:
			case 119:
				command+="w";
				break;
			default:
				break;
		}
		if(command.search("1122343456")>=0)
		{
			command="";
			konami();
		}
		else if(command.search("123456")>=0)
		{
			command="";
			callMember();
		}
		else if(command.search("snow")>=0)
		{
			command="";
			if(typeof $.fn.snow() == 'function')
				$.fn.snow({ minSize: 10, maxSize: 50, newOn: 500, flakeColor: '#DDD' });
			else
				;
		}
		else
			;
	});

	$("a.konami").click(function(){
		callMember();
	});
	/* smooth scrolling */
	 $('i[data-target*=#]:not([href=#])').click(function() {

  		$("div.tab-pane.active").toggleClass("active");
  		$("div"+$(this).attr("data-target")).toggleClass("active");
  		$("ul.nav.nav-tabs li.active").toggleClass("active");
  		$("ul.nav.nav-tabs li a[href='"+$(this).attr("data-target")+"']").parent().toggleClass("active");
  		var moveTo=$("div.tabbable");

        $('html,body').animate({
          scrollTop: moveTo.offset().top
        }, 1000);
  });
	 $("button.search").click(function(){
	 	callSearch();
	 });
};

var flag=false,member_block=false;

function konami(){
	if(!flag)
	{
		$("style.konami").html("body{ opacity:0; }");
	}
	else
	{
		$("style.konami").html("body{ opacity:1; }");
	}
	flag=!flag;
}
function callMember()
{
	if(!member_block)
	{
		$("style.konami").html("div.container{ display:none; }");
		$("div.developer-pane").addClass("effeckt-page-active");
	}
	else
	{
		$("style.konami").html("");
		$("div.developer-pane").removeClass("effeckt-page-active");
		$("div.container").fadeIn();
	}
	member_block=!member_block;
}
function callSearch()
{
	window.location="http://searchhorizon.herokuapp.com/?keyword="+$("input[type='text'].keyword").val()+"#tabs-663924";
}