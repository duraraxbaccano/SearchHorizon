//while no context selected
function genericOnClick (info,tab){
if (info.menuItemId == "defaultClickBtn") {
	window.open("http://searchhorizon.herokuapp.com/");
}
else if (info.menuItemId=="selected") {
	var website = "http://searchhorizon.herokuapp.com/?keyword="+info.selectionText ;
	window.open(website);
};
}

chrome.contextMenus.onClicked.addListener(genericOnClick);

var defaultClickBtn = "go to Search Horizon";
var noSelectItem = chrome.contextMenus.create({"title" : defaultClickBtn , "id": "defaultClickBtn" });

var searchBtn = "Search '%s' on Horizon";
var context = "selection";
var hasSelectItem = chrome.contextMenus.create({"title": searchBtn , "contexts": [context] , "id": "selected"});

