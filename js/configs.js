window.onload=function(){
	var bowser_version=getBrowserVersion();
	$("div#panel-configuration").append("<h3>How to display search results:</h3>");
	if(bowser_version.search("Chrome")>=0)
	{
		$("head").append("<link rel='stylesheet' href='css/effekt.css' type='text/css' />");
		$("div#panel-configuration").append('<span class="config-list">List&emsp;<input type="radio" name="group2" class="effeckt-rdio-ios7" checked></span>&emsp;');
		$("div#panel-configuration").append('<span class="config-box">Box&emsp;<input type="radio" name="group2" class="effeckt-rdio-ios7"></span>');
		$("div#panel-configuration span input").click(function(){
			config_result($(this).parent().attr("class"));
		});
	}
	else
	{
		$("div#panel-configuration").append('<span class="other config-list active">List <i class="fa fa-list"></i></span>&emsp;');
		$("div#panel-configuration").append('<span class="other config-box">Box <i class="fa fa-th-large"></i></span>');
		$("div#panel-configuration span").click(function(){
			$("div#panel-configuration span").removeClass("active");
			config_result($(this).toggleClass("other").attr("class"));
			$(this).addClass("other active");
		});
	}
};
function config_result(exec)
{
	if(exec.localeCompare("config-list")==0)
	{
		$("link[href='css/list.css']").remove();
	}
	else if(exec.localeCompare("config-box")==0)
	{
		$("head").append("<link rel='stylesheet' href='css/list.css' type='text/css' />");
	}
	else
		;
}