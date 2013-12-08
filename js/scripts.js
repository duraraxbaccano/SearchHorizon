window.onload=function(){
	var command="";
	$("body").keydown(function( event ){
		switch(event.which)
		{
			//up down left right
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
			default:
				break;
		}
		if(command.search("1122343456")>=0)
		{
			command="";
			konami();
		}
		else
			;
	});
};

var flag=false;

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