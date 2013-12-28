function SiteMembers (collectionId, baseUrl, smVarOnWindow, metaSiteId) {
    var SM_COOKIE = "smSession";
    var SV_COOKIE = "svSession";
    var DAY_MS = 84600000;
    var TWO_WEEKS_MS = DAY_MS * 14;

    var jsonpHandler = ( function( baseUrl, smVarOnWindow ) {
        var callbackOrdinal = 0;
        var callbacks = {};

        function sendRequest (url, placeHolderValues, onSuccess, onError) {
            /* Create unique string for unique function*/
            callbackOrdinal+=1;
            /* Create an object that holds the string */
            var tmpFuncName = "callback" + callbackOrdinal;
            /* Create new temp object to hold the callbacks */
            var tmpCallbacks = _createCallBackObjekt(onSuccess, onError);
            callbacks[tmpFuncName] = tmpCallbacks;
            url = _parseUrl( url , placeHolderValues);

            url = url + "&callback=" + smVarOnWindow + ".getJSONPHandler().getOnSuccessJsonpCallBack('" + tmpFuncName + "')";
            url = url + "&callerId=" + tmpFuncName;
            tmpCallbacks.scriptRef = makeJsonp(url, onError);

            return true;
        }

        function _parseUrl( url, placeHolderValues ) {
            url = baseUrl + url;
            if(placeHolderValues && placeHolderValues.length > 0){
                for(var i= 0; i < placeHolderValues.length; i++){
                    url = url.replace('{'+ i +'}', placeHolderValues[i]);
                }
            }

            return url;
        }

        function _createCallBackObjekt(onSuccess, onError) {
            var tmpCallbacks = {
                onSuccessJsonp:function (action, data) {
                    clear();

                    if (!data || (data.errorCode && data.errorCode != 0) ) {
                        if (onError) {
                            onError(data);
                        }
                    }
                    else {
                        var payload = data['payload'];
                        var actionName = action.action;
                        if (onSuccess) {
                            _handleSuccessByAction(actionName, payload, onSuccess);
                        }
                    }

                    function clear() {
                        clearTimeout(tmpCallbacks.firstTimeOut);
                        clearTimeout(tmpCallbacks.secondTimeOut);
                        callbacks[tmpCallbacks] = null;
                        if (tmpCallbacks.scriptRef != null)
                            document.getElementsByTagName("head")[0].removeChild(tmpCallbacks.scriptRef);
                    }
                },
                firstTimeOut:null,
                secondTimeOut:null,
                scriptRef:null
            };
            tmpCallbacks.firstTimeOut = setTimeout(function () {
                LOG.reportError("JSONP_3S_TIMEOUT");
            }, 3000);
            tmpCallbacks.secondTimeOut = setTimeout(function () {
                LOG.reportError("JSONP_10S_TIMEOUT");
            }, 10000);

            return tmpCallbacks;
        }

        function makeJsonp (url, onError) {
            var js = document.createElement("script");
            js.type = "text/javascript";
            js.src = url;
            js.onerror = onError;
            document.getElementsByTagName("head")[0].appendChild(js);
            return js;
        }

        function getOnSuccessJsonpCallBack (callBackFunc) {
            var cbFunctions = callbacks[callBackFunc];
            return cbFunctions.onSuccessJsonp;
        }

        /**
         * two domain types:
         * [m].<user>.wix.com/<site-name>
         * www.premiumdomain.com
         * @private
         */
        function _getCurrentDomain() {
            if (location.hostname.indexOf("wix") > 0)
                return location.hostname + "/" + location.pathname;
            else return location.hostname
        }

        return {
            sendRequest: sendRequest,
            getOnSuccessJsonpCallBack: getOnSuccessJsonpCallBack
        }

    })( baseUrl, smVarOnWindow );
    var cookieManager = {

        setCookie : function(name, value, time, domain, path, secure) {
            window[name] = value;
            var cookie = name + "=" + value;
            if (time) cookie += ";expires=" + (new Date((new Date()).getTime() + time)).toGMTString();
            cookie += ";path=" + (path || "/");
            if (domain) cookie += ";domain=" + domain;
            if (secure) cookie += ";secure";
            document.cookie = cookie;
        },

        getCookie : function(name) {
            if (window[name]) return window[name];
            if (document.cookie) {
                var cookies = document.cookie.split(/;\s*/);
                for (var i = 0, n = cookies.length; i < n; i++) {
                    var cookie = cookies[i];
                    if (cookie.indexOf(name + "=") == 0)
                        return cookie.substr(name.length + 1);
                }
            }
            return null;
        },

        deleteCookie : function(name, domain, path, secure) {
            this.setCookie(name, "", -DAY_MS, domain, path, secure);
        }

    };

    var actions = {
        login: "/api/member/login/?email={0}&password={1}&rememberMe={2}",
        loginWithSvSession: "/api/member/login/?email={0}&password={1}&rememberMe={2}&svSession={3}&appUrl={4}",
        loginWithSvSessionAndInitiator: "/api/member/login/?email={0}&password={1}&rememberMe={2}&svSession={3}&initiator={4}&appUrl={5}",
        register: "/api/member/register?email={0}&password={1}",
        registerWithSvSession: "/api/member/register?email={0}&password={1}&svSession={2}&appUrl={3}",
        registerWithSvSessionAndInitiator: "/api/member/register?email={0}&password={1}&svSession={2}&initiator={3}&appUrl={4}",
        apply: "/api/member/apply?email={0}&password={1}",
        applyWithSvSessionAndInitiator: "/api/member/apply?email={0}&password={1}&svSession={2}&initiator={3}&appUrl={4}",
        getMemberDetails: "/api/member/{0}", // {0} is the token
        updateMemberDetails: "/api/member/{0}/update?{1}", // {0} is the parameters query string,
        sendForgotPasswordMail: "/api/member/sendForgotPasswordMail/?email={0}&returnUrl={1}",
        resetMemberPassword: "/api/member/changePasswordWithMailToken/?forgotPasswordToken={0}&newPassword={1}",
        getMembers: "/api/admin/member/list/{0}?",
        inActivate: "/api/admin/member/{0}/inactivate?",
        inActivateWithSvSession: "/api/admin/member/{0}/inactivate?svSession={1}&appUrl={2}",
        activate: "/api/admin/member/{0}/activate?",
        activateWithSvSession: "/api/admin/member/{0}/activate?svSession={1}&appUrl={2}",
        collectionType: "/api/admin/collection/{0}/changeType/{1}?metaSiteId={2}",
        getCollection:"/api/admin/collection/{0}?"
    };

    function _sendAction ( actionName , placeHolderValues, onSuccess, onError) {
        var url = actions[ actionName ];
        if (url.indexOf("?") != -1)
            url += "&collectionId=" + collectionId;
        else
            url += "?collectionId=" + collectionId;

        url += (metaSiteId ? "&metaSiteId=" + metaSiteId : "");
        url += "&accept=jsonp";
        url += "&action="+actionName;
        jsonpHandler.sendRequest(url, placeHolderValues, onSuccess, onError);
    }

    function _setSiteMembersCookie (payload) {
        if (payload) {
            var sessionToken = payload['sessionToken'];
            var rememberMe = payload['rememberMe'];
            var expirationDate = payload['expirationDate'];

            if (sessionToken) {
                var domain = _getCurrentDomain();
                var expirationTime = expirationDate ? new Date(expirationDate).getTime(): TWO_WEEKS_MS;
                expirationTime = rememberMe ? expirationTime : 0;
                cookieManager.setCookie(payload["cookieName"] || SM_COOKIE, sessionToken, expirationTime, domain.host, domain.path);
            }

        }
    }

    function _getCurrentDomain() {
        var pathName = (location.pathname || "/");
        var host = location.host;
        var match = host.match(/(wix|wixpress)+(.com)+/); /* user.wix.com/site */
        if (match) {
            var split = pathName.split("/");
            if (split.length > 0) {
                pathName = "/" + (split[1] || "");
            }
            return { "host" : host, "path": pathName};
        }
        else { /* www.user.com */
            return  { "host" : host, "path": "/"};
        }
    }

    function _handleSuccessByAction (actionName, payload, onSuccess) {
        if (payload !== null) {
            if (!payload ['siteMemberDto']) {
                // return member details
                onSuccess (payload);
            }
            else {
                // set session cookie
                _setSiteMembersCookie (payload);
                // return member details
                onSuccess (payload ['siteMemberDto']);
            }
        }
        else {
            onSuccess();
        }
    }

    function _toQueryString (obj) {
        var queryString = "";
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                queryString += "&" + key + "=" + obj[key];
        }

        return queryString;
    }

    return {
        getJSONPHandler: function() {
            return jsonpHandler;
        },

        login: function (email, password, rememberMe, onSuccess, onError, initiator, svSession) {
            if (svSession) {
                var params = [email, password, rememberMe];

                var appUrl = window.encodeURIComponent(window.location.href);

                if (svSession) {
                    params.push(svSession);
                }

                if (initiator) {
                    params.push(initiator);
                }

                params.push(appUrl);

                if (initiator) {
                    _sendAction("loginWithSvSessionAndInitiator", params, onSuccess, onError);
                } else {
                    _sendAction("loginWithSvSession", params, onSuccess, onError);
                }

                return;
            }

            _sendAction("login", [email, password, rememberMe], onSuccess, onError);
        },

        sendForgotPasswordMail: function(email, returnUrl, onSuccess, onError) {
            _sendAction("sendForgotPasswordMail", [email, returnUrl], onSuccess, onError) ;
        },

        resetMemberPassword: function(resetPasswordToken, newPassword, onSuccess, onError) {
            _sendAction("resetMemberPassword", [resetPasswordToken, newPassword], onSuccess, onError) ;
        },

        register: function (email, password, onSuccess, onError, initiator, svSession) {
            if (svSession) {
                var params = [email, password];

                var appUrl = window.encodeURIComponent(window.location.href);

                if (svSession) {
                    params.push(svSession);
                }

                if (initiator) {
                    params.push(initiator);
                }

                params.push(appUrl);

                if (initiator) {
                    _sendAction("registerWithSvSessionAndInitiator", params, onSuccess, onError);
                } else {
                    _sendAction("registerWithSvSession", params, onSuccess, onError);
                }

                return;
            }

            _sendAction("register", [email, password], onSuccess, onError);
        },

        apply: function (email, password, onSuccess, onError, svSession) {
            if (svSession) {
                var params = [email, password];

                var appUrl = window.encodeURIComponent(window.location.href);

                if (svSession) {
                    params.push(svSession);
                }

                params.push("");

                params.push(appUrl);

                _sendAction("applyWithSvSessionAndInitiator", params, onSuccess, onError);

                return;
            }

            _sendAction("apply", [email, password], onSuccess, onError);
        },

        isSessionValid: function() {
            return !!cookieManager.getCookie(SM_COOKIE);
        },

        logout: function() {
            var domainParams = _getCurrentDomain();
            cookieManager.deleteCookie(SV_COOKIE, domainParams.host, domainParams.path);
            cookieManager.deleteCookie(SM_COOKIE, domainParams.host, domainParams.path);
        },

        updateMemberDetails: function ( token, memberDetails, onSuccess, onError ) {
            var paramsAsQueryString = _toQueryString( memberDetails) ;
            _sendAction("updateMemberDetails", [token, paramsAsQueryString], onSuccess, onError);
        },

        getMemberDetails: function (token, onSuccess, onError) {
            _sendAction("getMemberDetails", [token], onSuccess, onError);
        },

        getMembers: function (onSuccess, onError) {
            _sendAction("getMembers", [collectionId], onSuccess, onError);
        },

        inActivate: function (memberId, onSuccess, onError, svSession) {
            if (svSession) {
                var params = [memberId];
                params.push(svSession);
                params.push(window.encodeURIComponent(window.location.href));

                _sendAction("inActivateWithSvSession", params, onSuccess, onError);

                return;
            }
            _sendAction("inActivate", [memberId], onSuccess, onError);
        },

        activate: function (memberId, onSuccess, onError, svSession) {
            if (svSession) {
                var params = [memberId];
                params.push(svSession);
                params.push(window.encodeURIComponent(window.location.href));

                _sendAction("activateWithSvSession", params, onSuccess, onError);

                return;
            }

            _sendAction("activate", [memberId], onSuccess, onError);
        },

        collectionType: function(metaSiteId, collectionType, onSuccess, onError) {
            _sendAction("collectionType", [collectionId, collectionType, metaSiteId], onSuccess, onError);
        },

        getCollection: function(onSuccess, onError) {
            _sendAction("getCollection", [collectionId], onSuccess, onError);
        }
    }
}
SiteMembers.CONST = {
    COL_TYPE_APPLY : "ApplyForMembership",
    COL_TYPE_CLOSED : "Closed",
    COL_TYPE_OPEN : "Open"
};