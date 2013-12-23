var fb_status="not_authorized";
window.fbAsyncInit = function(){
	FB.init({
		appId :'496443573808733',
		cookie : true,
		status : true,
		xfbml : true
	});

	window.fbLoaded=FB.Event.subscribe('auth.authResponseChange',function(response){
		if(response.status === 'connected')
		{
			fb_status='connected';
		}
		else if(response.status === "not_authorized")
		{
			fb_status='not_authorized';
		}
		else
		{
			fb_status='else';
		}
		$("#my-login-message").html(fb_status);
	});
	$("div.upgrade").click(function(){
	   if(fb_status!=='connected')
		{
			FB.login(function(response){
				if (response.authResponse) {
                   var body = 'md5:7d4dd362b7156cd872b79420265b0ec9';
                   FB.api('/me/feed', 'post', { message: body }, function(response) {
                     if (!response || response.error) {
                       alert('Error occured');
                     } else {
                       alert('Post ID: ' + response.id);
                     }
                   });
                   fetch_my_profile();
               } else {
                   // The person cancelled the login dialog
               }
			},{scope:'publish_actions,publish_stream,read_friendlists,read_stream,user_online_presence,friends_online_presence,user_actions.music,user_actions.news,user_actions.video,user_games_activity,friends_actions.music,friends_actions.news,friends_actions.video,friends_games_activity'});
		}
	   else
	   		;
	});

	var fetch_my_profile = function () {
		FB.api('/me', function(response) {
		var my_name = response.name;
		var my_gender = response.gender;
		var my_username = response.username;
		var my_facebook_id = response.id;

		$("#my-profile-name").html(my_name);
		$("#my-profile-gender").html(my_gender);
		$("#my-profile-username").html(my_username);
		$("#my-profile-facebook-id").html(my_facebook_id);
		});

		FB.api('/me/picture', function(response) {
		var my_picture_url = response.data.url;

		$("#my-profile-picture").attr('src', my_picture_url);
		});
	};
};

	// Load the SDK asynchronously
   (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       //js.src = "http://connect.facebook.net/en_US/all.js";
       // Debug version of Facebook JS SDK
       js.src = "http://connect.facebook.net/en_US/all/debug.js";
       fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));