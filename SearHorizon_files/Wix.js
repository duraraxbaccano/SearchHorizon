(function (container) {
    var _w = {
        /**
         * Internal Constants
         */
        version: "1.17.0",

        TPA_INTENT:"TPA",

        /**
         * SDK message types
         */
        MessageTypes:{
            CHANGE_APP_SIZE:"changeWindowSize",
            RESIZE_WINDOW:"resizeWindow",
            REFRESH_APP:"refreshApp",
            APP_IS_ALIVE:"appIsAlive",
            APP_STATE_CHANGED:"appStateChanged",
            CLOSE_WINDOW:"closeWindow",
            OPEN_POPUP:"openPopup",
            OPEN_MODAL:"openModal",
            OPEN_MEDIA_DIALOG:"openMediaDialog",
            OPEN_BILLING_PAGE:"openBillingPage",
            GET_SITE_PAGES: 'getSitePages',
            GET_SITE_COLORS: 'getSiteColors',
            NAVIGATE_TO_PAGE: 'navigateToPage',
            POST_MESSAGE: 'postMessage',
            SM_REQUEST_LOGIN:"pingpong:smRequestLogin",
            SM_CURRENT_MEMBER:"pingpong:smCurrentMember",
            SITE_INFO:"pingpong:siteInfo",
            EVENT_LISTENER_ADDED:"pingpong:addEventListener",
            HEIGHT_CHANGED:"heightChanged",
            NAVIGATE_TO_STATE: "navigateToState"
        },
        /**
         * Registered events callbacks
         */
        EventsCallbacks:{},
        /**
         * Resident component id
         */
        compId: null,
        /**
         * Messages response callback map
         */
        callbacks: {},
        /**
         * callback id
         */
        callId: 1,
        /**
         * Current edit mode state
         */
        currentEditMode: 'site',

        /**
         * SDK initialization function
         */
        init:function () {
            // deploy compatibility script to support modern JS on iOS5,IE8/9
            _w.deployPolyFills();
            // initialize google analytics
            _w.gaInit();
            // initialize the event callbacks mechanism
            _w.initEventsCallbacks(Wix.Events);
            // initialize error tracking logic
            _w.errorTrackingInit();
            // get our comp id
            _w.compId = _w.getQueryParameter("compId") || "[UNKNOWN]";

            // register post message hub function
            _w.addPostMessageCallback(_w.receiver.bind(_w));
            // initialize edit mode state tracking
            this.currentEditMode = _w.getQueryParameter("viewMode") || this.currentEditMode;
            Wix.addEventListener('EDIT_MODE_CHANGE', function(params) {
                this.currentEditMode = params.editMode;
            }.bind(this));
            // report ready to Wix
            _w.sendMessageInternal(_w.MessageTypes.APP_IS_ALIVE, {version: _w.getVersion()});
        },

        reportSdkError: function(errorMessage) {
            var error = new Error('Wix SDK: ' + errorMessage);
            throw error.stack;
        },

        /**
         * Internal Functions
         */
        sendMessageInternal:function (type, data) {
            var target = parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined);
            if (target && typeof target != "undefined") {
                target.postMessage(JSON.stringify({
                    intent:_w.TPA_INTENT,
                    compId:_w.compId,
                    type:type,
                    data:data
                }), "*");

                var dataStr = "";
                try {
                    dataStr = JSON.stringify(data);
                } catch(err) {}
                _w.trackSDKCall(type, dataStr);
            }
        },

        sendMessageInternal2:function (msgType, params, callback) {
            if (!msgType) {
                return;
            }

            /* prepare call parameters */
            var blob = _w.getBlob(msgType, params, callback);


            var target = parent.postMessage ? parent : (parent.document.postMessage ? parent.document : undefined);
            if (target && typeof target != "undefined") {
                var dataStr = "";
                try {
                    dataStr = JSON.stringify(params);
                } catch(err) {
                    // ...
                }

                target.postMessage(JSON.stringify(blob),"*");

                _w.trackSDKCall(msgType, dataStr);
            }
        },

        getBlob: function(msgType, params, onResponseCallback) {
            var blob = {
                intent: "TPA2",
                callId: this.getCallId(),
                type: msgType,
                compId: _w.compId,
                data: params
            };

            if (onResponseCallback) {
                this.callbacks[blob.callId] = onResponseCallback;
            };

            return blob;
        },

        getCallId: function() {
           return _w.callId++;
        },

        /** Function sendPingPongMessage
         *  sends a post message to TPAManager (viewer) with message type and invokes the callback
         * @param type - a property of MessageTypes
         * @param callback
         * @param runMultipleTimes - optional, if set to true the post message callback isn't removed
         */
        sendPingPongMessage:function (type, callback, runMultipleTimes) {
            this.sendMessageInternal(type);

            var onMessageCallback = function (evt) {
                var postMessageData = JSON.parse(evt.data);
                if (postMessageData.intent == _w.TPA_INTENT) {
                    if (postMessageData.type == type && callback) {
                        callback(postMessageData.data);
                        if (!runMultipleTimes) {
                            this._removePostMessageCallback(onMessageCallback);
                        }
                    }
                }
            }.bind(this);

            this.addPostMessageCallback(onMessageCallback);
        },

        addPostMessageCallback:function (callback) {
            if (window.addEventListener) {
                window.addEventListener('message', callback, false);
            } else if (window.attachEvent) {
                window.attachEvent('onmessage', callback);
            }
        },

        _removePostMessageCallback:function (callback) {
            if (window.removeEventListener) {
                window.removeEventListener('message', callback);
            } else if (window.detachEvent) {
                window.detachEvent('onmessage', callback);
            }
        },

        getQueryParameter:function (parameterName) {
            if (!_w.queryMap) {
                _w.queryMap = {};
                var queryString = location.search.substring(1) || '';
                var queryArray = queryString.split('&');

                queryArray.forEach(function(element) {
                    var parts = element.split('=');
                    _w.queryMap[parts[0]] = decodeURIComponent(parts[1]);
                });
            }
            return _w.queryMap[parameterName] || null;
        },

        decodeBase64: function(str) {
            return atob(str);
        },

        getVersion: function() {
            var version = !!_w.version ? _w.version : (window.location.pathname.split('/')[3] || "unknown");

            return version;
        },

        gaInit: function() {
            var _gaq = window._gaq || ( window._gaq = []);
            _gaq.push(['wix._setAccount', 'UA-2117194-51']);
            _gaq.push(['wix._trackPageview']);

            (function() {
              var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
              ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
              var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
            })();
        },

        errorTrackingInit: function() {
            var event = 'onerror';
            var listener =  _w.errorHandler;

            if (window.addEventListener) {
                window.addEventListener(event.replace(/^on/, ''), listener, false);
            } else {
                if (window[event]) {
                    var origListener = window[event];
                    window[event] = function(event) {
                        origListener(event);
                        listener(event);
                    }
                } else {
                    window[event] = function(event) {
                        listener(event);
                    }
                }
            }
        },

        errorHandler: function(errorMsg, url, lineNumber) {
            _w.trackError(errorMsg, lineNumber);

            return false;
        },

        /** Function trackEvent
         *
         * Add an event tracking
         *
         * @param category (String) name for the group of objects you want to track.
         * @param action (String) action name, unique in the category scope used to define the type of user interaction.
         * @param label (String) Optional, provides additional dimensions to the event data
         * @param value (Number) Optional, provides numerical data about the user event
         */
        gaTrackEvent: function(category, action, label, value) {
            _gaq.push(['wix._trackEvent', category || "default", action || "default", label || "", value]);
        },

        trackSDKCall: function(callName, label) {
            _w.gaTrackEvent("SDK", callName, label);
        },

        trackEventCall: function(eventName) {
            _w.gaTrackEvent("Event", eventName);
        },

        trackError: function(errorMessage) {
            _w.gaTrackEvent("Error", errorMessage);
        },

        initEventsCallbacks: function(events) {
            for (var propertyName in events) {
                if (events.hasOwnProperty(propertyName)) {
                    _w.EventsCallbacks[propertyName] = [];
                }
            }
        },

        getDecodedInstance: function() {
            var instanceStr = _w.getQueryParameter("instance");
            var encodedInstance = instanceStr.substring(instanceStr.indexOf(".")+1);
            return JSON.parse(this.decodeBase64(encodedInstance));
        },

        getInstanceValue: function(key) {
            var decodedInstance = _w.getDecodedInstance();
            if (decodedInstance) {
                return decodedInstance[key] || null;
            }
            return null;
        },

        receiver:function (event) {
            if (!event || !event.data) {
                return;
            }

            var data = {};
            try {
                data = JSON.parse(event.data);
            } catch(e) {
                return;
            }

            switch(data.intent) {
                case "TPA_RESPONSE":
                    if (data.callId && this.callbacks[data.callId]) {
                        this.callbacks[data.callId](data.res);
                        delete this.callbacks[data.callId];
                    }
                    break;

            case "addEventListener":
                _w.trackEventCall(data.eventType);
                if (this.EventsCallbacks[data.eventType]) {
                    this.EventsCallbacks[data.eventType].forEach(
                        function (callback) {
                            callback.apply(this, [data.params]);
                        });
                }
                break;
            }
        },

        deployPolyFills: function() {
            this.deployES5Shim();
            this.deployBase64PolyFill();
        },

        deployBase64PolyFill: function() {
            // minified source at https://github.com/davidchambers/Base64.js
            var t="undefined"!=typeof window?window:exports,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n=function(){try{document.createElement("$")}catch(t){return t}}();t.btoa||(t.btoa=function(t){for(var o,e,a=0,c=r,f="";t.charAt(0|a)||(c="=",a%1);f+=c.charAt(63&o>>8-8*(a%1))){if(e=t.charCodeAt(a+=.75),e>255)throw n;o=o<<8|e}return f}),t.atob||(t.atob=function(t){if(t=t.replace(/=+$/,""),1==t.length%4)throw n;for(var o,e,a=0,c=0,f="";e=t.charAt(c++);~e&&(o=a%4?64*o+e:e,a++%4)?f+=String.fromCharCode(255&o>>(6&-2*a)):0)e=r.indexOf(e);return f;});
        },

        deployES5Shim: function() {
            (function(f){"function"==typeof define?define(f):"function"==typeof YUI?YUI.add("es5-sham",f):f()})(function(){function f(a){try{return Object.defineProperty(a,"sentinel",{}),"sentinel"in a}catch(b){}}Object.getPrototypeOf||(Object.getPrototypeOf=function(a){return a.__proto__||(a.constructor?a.constructor.prototype:prototypeOfObject)});Object.getOwnPropertyDescriptor||(Object.getOwnPropertyDescriptor=function(a,b){if(typeof a!="object"&&typeof a!="function"||a===null)throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object: "+
                a);if(owns(a,b)){var d={enumerable:true,configurable:true};if(supportsAccessors){var l=a.__proto__;a.__proto__=prototypeOfObject;var c=lookupGetter(a,b),e=lookupSetter(a,b);a.__proto__=l;if(c||e){if(c)d.get=c;if(e)d.set=e;return d}}d.value=a[b];return d}});Object.getOwnPropertyNames||(Object.getOwnPropertyNames=function(a){return Object.keys(a)});if(!Object.create){var h;if(null===Object.prototype.__proto__||"undefined"==typeof document)h=function(){return{__proto__:null}};else{var k=function(){},
                e=document.createElement("iframe"),g=document.body||document.documentElement;e.style.display="none";g.appendChild(e);e.src="javascript:";var c=e.contentWindow.Object.prototype;g.removeChild(e);e=null;delete c.constructor;delete c.hasOwnProperty;delete c.propertyIsEnumerable;delete c.isPrototypeOf;delete c.toLocaleString;delete c.toString;delete c.valueOf;c.__proto__=null;k.prototype=c;h=function(){return new k}}Object.create=function(a,b){function d(){}var c;if(a===null)c=h();else{if(typeof a!=="object"&&
                typeof a!=="function")throw new TypeError("Object prototype may only be an Object or null");d.prototype=a;c=new d;c.__proto__=a}b!==void 0&&Object.defineProperties(c,b);return c}}if(Object.defineProperty&&(e=f({}),g="undefined"==typeof document||f(document.createElement("div")),!e||!g))var i=Object.defineProperty,j=Object.defineProperties;if(!Object.defineProperty||i)Object.defineProperty=function(a,b,d){if(typeof a!="object"&&typeof a!="function"||a===null)throw new TypeError("Object.defineProperty called on non-object: "+
                a);if(typeof d!="object"&&typeof d!="function"||d===null)throw new TypeError("Property description must be an object: "+d);if(i)try{return i.call(Object,a,b,d)}catch(c){}if(owns(d,"value"))if(supportsAccessors&&(lookupGetter(a,b)||lookupSetter(a,b))){var e=a.__proto__;a.__proto__=prototypeOfObject;delete a[b];a[b]=d.value;a.__proto__=e}else a[b]=d.value;else{if(!supportsAccessors)throw new TypeError("getters & setters can not be defined on this javascript engine");owns(d,"get")&&defineGetter(a,b,
                d.get);owns(d,"set")&&defineSetter(a,b,d.set)}return a};if(!Object.defineProperties||j)Object.defineProperties=function(a,b){if(j)try{return j.call(Object,a,b)}catch(d){}for(var c in b)owns(b,c)&&c!="__proto__"&&Object.defineProperty(a,c,b[c]);return a};Object.seal||(Object.seal=function(a){return a});Object.freeze||(Object.freeze=function(a){return a});try{Object.freeze(function(){})}catch(n){var m=Object.freeze;Object.freeze=function(a){return typeof a=="function"?a:m(a)}}Object.preventExtensions||
            (Object.preventExtensions=function(a){return a});Object.isSealed||(Object.isSealed=function(){return false});Object.isFrozen||(Object.isFrozen=function(){return false});Object.isExtensible||(Object.isExtensible=function(a){if(Object(a)!==a)throw new TypeError;for(var b="";owns(a,b);)b=b+"?";a[b]=true;var c=owns(a,b);delete a[b];return c})});

            // minified source at https://github.com/kriskowal/es5-shim
            (function(p){"function"==typeof define?define(p):"function"==typeof YUI?YUI.add("es5",p):p()})(function(){function p(a){a=+a;a!==a?a=0:0!==a&&(a!==1/0&&a!==-(1/0))&&(a=(0<a||-1)*Math.floor(Math.abs(a)));return a}function s(a){var b=typeof a;return null===a||"undefined"===b||"boolean"===b||"number"===b||"string"===b}Function.prototype.bind||(Function.prototype.bind=function(a){var b=this;if("function"!=typeof b)throw new TypeError("Function.prototype.bind called on incompatible "+b);var d=q.call(arguments,
            1),c=function(){if(this instanceof c){var e=b.apply(this,d.concat(q.call(arguments)));return Object(e)===e?e:this}return b.apply(a,d.concat(q.call(arguments)))};b.prototype&&(c.prototype=Object.create(b.prototype));return c});var k=Function.prototype.call,o=Object.prototype,q=Array.prototype.slice,h=k.bind(o.toString),t=k.bind(o.hasOwnProperty);t(o,"__defineGetter__")&&(k.bind(o.__defineGetter__),k.bind(o.__defineSetter__),k.bind(o.__lookupGetter__),k.bind(o.__lookupSetter__));if(2!=[1,2].splice(0).length){var x=
            Array.prototype.splice;Array.prototype.splice=function(a,b){return arguments.length?x.apply(this,[a===void 0?0:a,b===void 0?this.length-a:b].concat(q.call(arguments,2))):[]}}if(1!=[].unshift(0)){var y=Array.prototype.unshift;Array.prototype.unshift=function(){y.apply(this,arguments);return this.length}}Array.isArray||(Array.isArray=function(a){return h(a)=="[object Array]"});var k=Object("a"),l="a"!=k[0]||!(0 in k);Array.prototype.forEach||(Array.prototype.forEach=function(a,b){var d=n(this),c=l&&
            h(this)=="[object String]"?this.split(""):d,e=-1,f=c.length>>>0;if(h(a)!="[object Function]")throw new TypeError;for(;++e<f;)e in c&&a.call(b,c[e],e,d)});Array.prototype.map||(Array.prototype.map=function(a,b){var d=n(this),c=l&&h(this)=="[object String]"?this.split(""):d,e=c.length>>>0,f=Array(e);if(h(a)!="[object Function]")throw new TypeError(a+" is not a function");for(var g=0;g<e;g++)g in c&&(f[g]=a.call(b,c[g],g,d));return f});Array.prototype.filter||(Array.prototype.filter=function(a,b){var d=
            n(this),c=l&&h(this)=="[object String]"?this.split(""):d,e=c.length>>>0,f=[],g;if(h(a)!="[object Function]")throw new TypeError(a+" is not a function");for(var i=0;i<e;i++)if(i in c){g=c[i];a.call(b,g,i,d)&&f.push(g)}return f});Array.prototype.every||(Array.prototype.every=function(a,b){var d=n(this),c=l&&h(this)=="[object String]"?this.split(""):d,e=c.length>>>0;if(h(a)!="[object Function]")throw new TypeError(a+" is not a function");for(var f=0;f<e;f++)if(f in c&&!a.call(b,c[f],f,d))return false;
            return true});Array.prototype.some||(Array.prototype.some=function(a,b){var d=n(this),c=l&&h(this)=="[object String]"?this.split(""):d,e=c.length>>>0;if(h(a)!="[object Function]")throw new TypeError(a+" is not a function");for(var f=0;f<e;f++)if(f in c&&a.call(b,c[f],f,d))return true;return false});Array.prototype.reduce||(Array.prototype.reduce=function(a){var b=n(this),d=l&&h(this)=="[object String]"?this.split(""):b,c=d.length>>>0;if(h(a)!="[object Function]")throw new TypeError(a+" is not a function");
            if(!c&&arguments.length==1)throw new TypeError("reduce of empty array with no initial value");var e=0,f;if(arguments.length>=2)f=arguments[1];else{do{if(e in d){f=d[e++];break}if(++e>=c)throw new TypeError("reduce of empty array with no initial value");}while(1)}for(;e<c;e++)e in d&&(f=a.call(void 0,f,d[e],e,b));return f});Array.prototype.reduceRight||(Array.prototype.reduceRight=function(a){var b=n(this),d=l&&h(this)=="[object String]"?this.split(""):b,c=d.length>>>0;if(h(a)!="[object Function]")throw new TypeError(a+
            " is not a function");if(!c&&arguments.length==1)throw new TypeError("reduceRight of empty array with no initial value");var e,c=c-1;if(arguments.length>=2)e=arguments[1];else{do{if(c in d){e=d[c--];break}if(--c<0)throw new TypeError("reduceRight of empty array with no initial value");}while(1)}do c in this&&(e=a.call(void 0,e,d[c],c,b));while(c--);return e});if(!Array.prototype.indexOf||-1!=[0,1].indexOf(1,2))Array.prototype.indexOf=function(a){var b=l&&h(this)=="[object String]"?this.split(""):
            n(this),d=b.length>>>0;if(!d)return-1;var c=0;arguments.length>1&&(c=p(arguments[1]));for(c=c>=0?c:Math.max(0,d+c);c<d;c++)if(c in b&&b[c]===a)return c;return-1};if(!Array.prototype.lastIndexOf||-1!=[0,1].lastIndexOf(0,-3))Array.prototype.lastIndexOf=function(a){var b=l&&h(this)=="[object String]"?this.split(""):n(this),d=b.length>>>0;if(!d)return-1;var c=d-1;arguments.length>1&&(c=Math.min(c,p(arguments[1])));for(c=c>=0?c:d-Math.abs(c);c>=0;c--)if(c in b&&a===b[c])return c;return-1};if(!Object.keys){var v=
            !0,w="toString toLocaleString valueOf hasOwnProperty isPrototypeOf propertyIsEnumerable constructor".split(" "),z=w.length,r;for(r in{toString:null})v=!1;Object.keys=function(a){if(typeof a!="object"&&typeof a!="function"||a===null)throw new TypeError("Object.keys called on a non-object");var b=[],d;for(d in a)t(a,d)&&b.push(d);if(v)for(d=0;d<z;d++){var c=w[d];t(a,c)&&b.push(c)}return b}}if(!Date.prototype.toISOString||-1===(new Date(-621987552E5)).toISOString().indexOf("-000001"))Date.prototype.toISOString=
            function(){var a,b,d,c;if(!isFinite(this))throw new RangeError("Date.prototype.toISOString called on non-finite value.");c=this.getUTCFullYear();a=this.getUTCMonth();c=c+Math.floor(a/12);a=[(a%12+12)%12+1,this.getUTCDate(),this.getUTCHours(),this.getUTCMinutes(),this.getUTCSeconds()];c=(c<0?"-":c>9999?"+":"")+("00000"+Math.abs(c)).slice(0<=c&&c<=9999?-4:-6);for(b=a.length;b--;){d=a[b];d<10&&(a[b]="0"+d)}return c+"-"+a.slice(0,2).join("-")+"T"+a.slice(2).join(":")+"."+("000"+this.getUTCMilliseconds()).slice(-3)+
                "Z"};r=!1;try{r=Date.prototype.toJSON&&null===(new Date(NaN)).toJSON()&&-1!==(new Date(-621987552E5)).toJSON().indexOf("-000001")&&Date.prototype.toJSON.call({toISOString:function(){return true}})}catch(G){}r||(Date.prototype.toJSON=function(){var a=Object(this),b;a:if(s(a))b=a;else{b=a.valueOf;if(typeof b==="function"){b=b.call(a);if(s(b))break a}b=a.toString;if(typeof b==="function"){b=b.call(a);if(s(b))break a}throw new TypeError;}if(typeof b==="number"&&!isFinite(b))return null;b=a.toISOString;
            if(typeof b!="function")throw new TypeError("toISOString property is not callable");return b.call(a)});var g=Date,m=function(a,b,d,c,e,f,h){var i=arguments.length;if(this instanceof g){i=i==1&&String(a)===a?new g(m.parse(a)):i>=7?new g(a,b,d,c,e,f,h):i>=6?new g(a,b,d,c,e,f):i>=5?new g(a,b,d,c,e):i>=4?new g(a,b,d,c):i>=3?new g(a,b,d):i>=2?new g(a,b):i>=1?new g(a):new g;i.constructor=m;return i}return g.apply(this,arguments)},u=function(a,b){var d=b>1?1:0;return A[b]+Math.floor((a-1969+d)/4)-Math.floor((a-
            1901+d)/100)+Math.floor((a-1601+d)/400)+365*(a-1970)},B=RegExp("^(\\d{4}|[+-]\\d{6})(?:-(\\d{2})(?:-(\\d{2})(?:T(\\d{2}):(\\d{2})(?::(\\d{2})(?:\\.(\\d{3}))?)?(Z|(?:([-+])(\\d{2}):(\\d{2})))?)?)?)?$"),A=[0,31,59,90,120,151,181,212,243,273,304,334,365],j;for(j in g)m[j]=g[j];m.now=g.now;m.UTC=g.UTC;m.prototype=g.prototype;m.prototype.constructor=m;m.parse=function(a){var b=B.exec(a);if(b){var d=Number(b[1]),c=Number(b[2]||1)-1,e=Number(b[3]||1)-1,f=Number(b[4]||0),h=Number(b[5]||0),i=Number(b[6]||
            0),j=Number(b[7]||0),m=!b[4]||b[8]?0:Number(new g(1970,0)),k=b[9]==="-"?1:-1,l=Number(b[10]||0),b=Number(b[11]||0);if(f<(h>0||i>0||j>0?24:25)&&h<60&&i<60&&j<1E3&&c>-1&&c<12&&l<24&&b<60&&e>-1&&e<u(d,c+1)-u(d,c)){d=((u(d,c)+e)*24+f+l*k)*60;d=((d+h+b*k)*60+i)*1E3+j+m;if(-864E13<=d&&d<=864E13)return d}return NaN}return g.parse.apply(this,arguments)};Date=m;Date.now||(Date.now=function(){return(new Date).getTime()});if("0".split(void 0,0).length){var C=String.prototype.split;String.prototype.split=function(a,
            b){return a===void 0&&b===0?[]:C.apply(this,arguments)}}if("".substr&&"b"!=="0b".substr(-1)){var D=String.prototype.substr;String.prototype.substr=function(a,b){return D.call(this,a<0?(a=this.length+a)<0?0:a:a,b)}}j="\t\n\x0B\f\r \u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff";if(!String.prototype.trim||j.trim()){j="["+j+"]";var E=RegExp("^"+j+j+"*"),F=RegExp(j+j+"*$");String.prototype.trim=function(){if(this===void 0||this===
            null)throw new TypeError("can't convert "+this+" to object");return String(this).replace(E,"").replace(F,"")}}var n=function(a){if(a==null)throw new TypeError("can't convert "+a+" to object");return Object(a)}});
        }
    };

    /**
     * Public API definition
     */
    var Wix = {
        // helper function to name the Wix object on runtime
        constructor: function Wix(){},

        /**
         * Supported events - some are relevant for the editor only
         */
        Events:{
            /**
             * @since SDK 1.11.0
             * Signal transition between editor and preview modes
             */
            EDIT_MODE_CHANGE:'EDIT_MODE_CHANGE',
            /**
             * @since SDK 1.11.0
             * Signal page navigation, relevant for editor, preview & site
             */
            PAGE_NAVIGATION_CHANGE:'PAGE_NAVIGATION_CHANGE',
            /**
             * @since SDK 1.13.0
             * Signal Site publishing - editor only
             */
            SITE_PUBLISHED: 'SITE_PUBLISHED',
            /**
             * @since SDK 1.13.0
             * Signal Component deletion in the editor
             */
            COMPONENT_DELETED: 'COMPONENT_DELETED',
            /**
             * @since SDK 1.17.0
             * Signal internal app message
             */
            SETTINGS_UPDATED: 'SETTINGS_UPDATED',
            /**
             * @private
             */
            ON_MESSAGE_RESPONSE: "ON_MESSAGE_RESPONSE"
        },

        /**
         * Enum Window Origin
         *
         * Represents a Wix popup window origin. A window can be positioned where it is origin is the viewport (0,0) or
         * where the origin is another widget (x,y).
         */
        WindowOrigin: {
            DEFAULT: 'FIXED',

            VIEWPORT: 'FIXED',
            RELATIVE: 'RELATIVE'
        },

        /**
         * Enum Window placement
         *
         * Represents a predefined values to position a Wix popup windows without the hassle of figuring out the position yourself.
         * Can be used to position the window relatively (to the calling widget) or absolutely (to the viewport).
         */
        WindowPlacement: {
            /* corner positions - clock wise */
            TOP_LEFT: 'TOP_LEFT',
            TOP_RIGHT: 'TOP_RIGHT',
            BOTTOM_RIGHT: 'BOTTOM_RIGHT',
            BOTTOM_LEFT: 'BOTTOM_LEFT',
            /* edge center positions - clock wise */
            TOP_CENTER: 'TOP_CENTER',
            CENTER_RIGHT: 'CENTER_RIGHT',
            BOTTOM_CENTER: 'BOTTOM_CENTER',
            CENTER_LEFT: 'CENTER_LEFT',
            CENTER: 'CENTER'
        },

        Settings: {
            /**
             * Wix Media type used by the openMediaDialog function
             */
            MediaType: {
                /* Image media type */
                IMAGE:  'photos',
                /* Background media type */
                BACKGROUND: 'backgrounds',
                /* Audio media type */
                AUDIO:  'audio',
                /* Document media type */
                DOCUMENT: 'documents',
                /* FLASH media type */
                SWF: 'swf'
            },

            /** Function getSiteInfo
             *
             * Returns the site information in a callback function
             *
             * @since SDK 1.12.0
             * @param onSuccess (Function) callback function: function(params) {...}
             */
            getSiteInfo: function(onSuccess) {
                Wix.getSiteInfo(onSuccess);
            },

            /** Function getSiteColors
             *
             * Returns the currently active site colors
             *
             * @since SDK 1.12.0
             * @param onSuccess (Function) callback function: function(colors) {...}
             */
            getSiteColors: function(onSuccess) {
                _w.sendMessageInternal2(_w.MessageTypes.GET_SITE_COLORS, null, onSuccess);
            },

            /** Function refreshAppByCompIds
             *
             * Refresh all app's components
             *
             * @since SDK 1.12.0
             * @param queryParams
             */
            refreshApp: function(queryParams) {
                this.refreshAppByCompIds(null, queryParams);
            },

            /** Function refreshAppByCompIds
             *
             * Refresh a specific app's component
             *
             * @since SDK 1.12.0
             * @param compIds (String) a component id
             * @param queryParams (String) custom query parameters to pass to the component
             */
            refreshAppByCompIds: function(compIds, queryParams) {
                _w.sendMessageInternal2(_w.MessageTypes.REFRESH_APP, {'queryParams':queryParams, 'compIds':compIds});
            },

            /** Function openBillingPage
             *
             * @since SDK 1.13.0
             * Opens the Wix billing page in a new tab/window
             */
            openBillingPage: function() {
                _w.sendMessageInternal2(_w.MessageTypes.OPEN_BILLING_PAGE);
            },

            /** Function openMediaDialog
             *
             * Opens the Wix media dialog and let's the site owner choose a file from the
             * Wix collectoin, or upload a new file instead.
             *
             * @since SDK 1.17.0
             * @param mediaType (MediaType enum) use one of the MediaType enum values
             * @param multipleSelection (Boolean) selection mode, single/false or multiple/true item to choose
             * @param onSuceess (Function) callback function: function(data) {...} where the data schema is:
             *          fileName (String) - media item title
             *          type (String) - e.g. 'Image', 'AudioPlayer'
             *          relativeUri (String) -  media item uri (relative to Wix media gallery) use Wix.Utils.Media.get* to get an actual url
             *          width - media type width (for images)
             *          height - media type height (for images)
             */
            openMediaDialog: function(mediaType, multipleSelection, onSuccess) {
                if (!onSuccess) {
                    return;
                }
                mediaType = mediaType || this.MediaType.IMAGE;
                multipleSelection = multipleSelection || false;

                _w.sendMessageInternal2(_w.MessageTypes.OPEN_MEDIA_DIALOG, {'mediaType':mediaType, 'multiSelection': multipleSelection}, onSuccess);
            },

            /**
             * Function triggerSettingsUpdatedEvent
             *
             * Sends a message (json object) to a specific app components or to all the app components
             * This API is inspired by HTML5 iframe messages - https://developer.mozilla.org/en-US/docs/DOM/window.postMessage
             *
             * @since 1.17.0
             * @param message (Object,Optional) a custom json object representing a message
             * @param compId (String,Optional) component id to sent message or '*' (default) to send the message to all the app's components
             */
            triggerSettingsUpdatedEvent: function(message, compId) {
                message = message || {};
                compId = compId || '*';

                _w.sendMessageInternal2(_w.MessageTypes.POST_MESSAGE, {'message':message, 'compId': compId});
            },

            /**
             * Function getSitePages
             *
             * Returns the pages which are used in hosting site by name
             *
             * @since 1.17.0
             * @param callback (Function) a callback function that returns the site pages
             *   callback signature: function(data) {}
             *   data signature: { pages: ['page1', 'page2', 'myPage', ...]}
             */
            getSitePages: function(callback) {
                _w.sendMessageInternal2(_w.MessageTypes.GET_SITE_PAGES, {}, callback);
            }
        },

        Utils: {
            /**
               * Function getCompId
               *
               * @since SDK 1.12.0
               * @return (String) the widget/section/settings iframe's component id
            */
            getCompId: function(){
                _w.trackSDKCall("Utils.getCompId");
                return _w.compId;
            },

            /**
             * Function getOrigCompId
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns origCompId parameter value, otherwise returns null
             */
            getOrigCompId: function(){
                _w.trackSDKCall("Utils.getOrigCompId");
                return _w.getQueryParameter("origCompId");
            },

            /**
             * Function getViewMode
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns viewMode parameter value, otherwise returns null
             */
            getViewMode: function(){
                _w.trackSDKCall("Utils.getViewMode");
                return _w.currentEditMode;
            },

            /**
             * Function getWidth
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns width parameter value, otherwise returns null
             */
            getWidth: function(){
                _w.trackSDKCall("Utils.getWidth");
                return _w.getQueryParameter("width");
            },

            /**
             * Function getLocale
             *
             * @since SDK 1.14.0
             * @return for valid endpoints returns locale parameter value, otherwise returns null
             */
            getLocale: function(){
                _w.trackSDKCall("Utils.getLocale");
                return _w.getQueryParameter("locale");
            },

            /**
             * Function getCacheKiller
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns cacheKiller parameter value, otherwise returns null
             */
            getCacheKiller: function(){
                _w.trackSDKCall("Utils.getCacheKiller");
                return _w.getQueryParameter("cacheKiller");
            },

            /**
             * Function getTarget
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns target parameter value, otherwise returns null
             */
            getTarget: function(){
                _w.trackSDKCall("Utils.getTarget");
                return _w.getQueryParameter("target");
            },

            /**
             * Function getSectionUrl
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns section-url parameter value, otherwise returns null
             */
            getSectionUrl: function(){
                _w.trackSDKCall("Utils.getSectionUrl");
                var sectionUrl = _w.getQueryParameter("section-url");
                return (sectionUrl && sectionUrl.replace(/\?$/, ""));
            },

            /**
             * Function getInstanceId
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns instanceId app instance property value, otherwise returns null
             */
            getInstanceId: function(){
                _w.trackSDKCall("Utils.getInstanceId");
                return _w.getInstanceValue("instanceId");
            },

            /** Function getSignDate
             *
             * @deprecated  As of SDK 1.13.0
             * @return for valid endpoints returns signDate app instance property value, otherwise returns null
             */
            getSignDate: function(){
                _w.trackSDKCall("Utils.getSignDate");
                return _w.getInstanceValue("signDate");
            },

            /**
             * Function getUid
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns uid app instance property value, otherwise returns null
             */
            getUid: function(){
                _w.trackSDKCall("Utils.getUid");
                return _w.getInstanceValue("uid");
            },

            /**
             * Function getPermissions
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns permissions app instance property value, otherwise returns null
             */
            getPermissions: function(){
                _w.trackSDKCall("Utils.getPermissions");
                return _w.getInstanceValue("permissions");
            },

            /**
             * Function getIpAndPort
             *
             * @deprecated  As of SDK 1.13.0
             * @return for valid endpoints returns ipAndPort app instance property value, otherwise returns null
             */
            getIpAndPort: function(){
                _w.trackSDKCall("Utils.getIpAndPort");
                return _w.getInstanceValue("ipAndPort");
            },

            /**
             * Function getDemoMode
             *
             * @since SDK 1.12.0
             * @return for valid endpoints returns demoMode app instance property value, otherwise returns null
             */
            getDemoMode: function(){
                _w.trackSDKCall("Utils.getDemoMode");
                var mode = _w.getInstanceValue("demoMode");
                mode = (mode == null) ? false : mode;

                return mode;
            },

            Media: {
                /**
                 * Function getImageUrl
                 *
                 * Returns a url for the image in it's original dimensions (width, height)
                 *
                 * @since SDK 1.17.0
                 * @param relativeUrl (String) static image url provided by the media dialog
                 * @return url (String)
                 */
                getImageUrl: function(relativeUrl) {
                    _w.trackSDKCall("Utils.Media.getImageUrl");

                    return 'http://static.wix.com/media/' + relativeUrl;
                },

                /**
                 * Function getResizedImageUrl
                 *
                 * Resize image and apply sharpening (if available) see details here
                 * http://en.wikipedia.org/wiki/Unsharp_masking
                 *
                 * @since SDK 1.17.0
                 * @param relativeUrl (String) static image url provided by the media dialog
                 * @param width (Number) desired image width
                 * @param height (Number) desired image height
                 * @param sharpParams (Object, optional)
                 *          quality - JPEG quality, leave as is (75) unless image size is important for your app
                 *          resizaFilter - resize filter
                 *          usm_r - unsharp mask radius
                 *          usm_a - unsharp mask amount (precentage)
                 *          usm_t - unsharp mask threshold
                 *
                 * @return url (String)
                 */
                getResizedImageUrl: function(relativeUrl, width, height, sharpParams) {
                    _w.trackSDKCall("Utils.Media.getResizedImageUrl");

                    // assign shap default parameters
                    sharpParams = sharpParams || {};
                    sharpParams.quality = sharpParams.quality || 75;
                    sharpParams.resizaFilter = sharpParams.resizaFilter || 22;
                    sharpParams.usm_r = sharpParams.usm_r || 0.50;
                    sharpParams.usm_a = sharpParams.usm_a || 1.20;
                    sharpParams.usm_t = sharpParams.usm_t || 0.00;

                    var urlArr = [];
                    var splitUrl = /[.]([^.]+)$/.exec(relativeUrl);
                    var ext = (splitUrl && /[.]([^.]+)$/.exec(relativeUrl)[1]) || "";

                    // build the image url
                    relativeUrl = 'http://static.wix.com/media/' + relativeUrl;
                    urlArr.push(relativeUrl);
                    urlArr.push("srz");
                    urlArr.push(width);
                    urlArr.push(height);

                    // sharpening parameters
                    urlArr.push(sharpParams.quality);
                    urlArr.push(sharpParams.resizaFilter);
                    urlArr.push(sharpParams.usm_r);
                    urlArr.push(sharpParams.usm_a);
                    urlArr.push(sharpParams.quality);

                    urlArr.push(ext); // get file extension
                    urlArr.push("srz");

                    return urlArr.join('_');
                },

                /**
                 * Function getAudioUrl
                 *
                 * @since SDK 1.17.0
                 * @param relativeUrl (String) static image url provided by the media dialog
                 * @return url (String)
                 */
                getAudioUrl: function(relativeUrl) {
                    _w.trackSDKCall("Utils.Media.getAudioUrl");

                    return 'http://media.wix.com/mp3/' + relativeUrl;
                },

                /**
                 * Function getDocumentUrl
                 *
                 * @since SDK 1.17.0
                 * @param relativeUrl (String) static image url provided by the media dialog
                 * @return url (String)
                 */
                getDocumentUrl: function(relativeUrl) {
                    _w.trackSDKCall("Utils.Media.getDocumentUrl");

                    return 'http://static.wix.com/ugd/' + relativeUrl;
                },

                /**
                 * Function getSwfUrl
                 *
                 * @since SDK 1.17.0
                 * @param relativeUrl (String) static image url provided by the media dialog
                 * @return url (String)
                 */
                getSwfUrl: function(relativeUrl) {
                    _w.trackSDKCall("Utils.Media.getSwfUrl");

                    return 'http://static.wix.com/media/' + relativeUrl;
                }
            }
        },

        /**
         * Function reportHeightChange
         *
         * @since SDK 1.8.0
         * @param height (Number) new component height
         */
        reportHeightChange:function (height) {
            if (typeof height !== "number") {
                _w.reportSdkError('Mandatory argument - height - should be of type Number');
                return;
            } else if (height < 0) {
                _w.reportSdkError('height should be a positive integer');
                return;
            }
            _w.sendMessageInternal(_w.MessageTypes.HEIGHT_CHANGED, height);
        },

        /**
         * Function pushState
         *
         * @since SDK 1.8.0
         * @param state (String) new app's state to push into the editor history stack
         */
        pushState:function (state) {
            if (typeof state !== "string") {
                _w.reportSdkError('Missing mandatory argument - state');
                return;
            }
            _w.sendMessageInternal(_w.MessageTypes.APP_STATE_CHANGED, state);
        },

        /**
         * Function requestLogin
         *
         * @since SDK 1.3.0
         * @param onSuccess (Function) a callback function to receive the operation completion
         * status. The function signature should be :
         *  function onSuccess(param) {...}
         */
        requestLogin:function (onSuccess) {
            _w.sendPingPongMessage(_w.MessageTypes.SM_REQUEST_LOGIN, onSuccess);
        },

        /**
         * Function getSiteInfo
         *
         * @param onSuccess (Function) a callback function that returns the site info
         *   The function signature should be :
         *   function onSuccess(param) {...}
         */
        getSiteInfo:function (onSuccess) {
            _w.sendPingPongMessage(_w.MessageTypes.SITE_INFO, onSuccess);
        },

        /**
         * Function getSitePages
         *
         * Returns the pages which are used in hosting site by name
         *
         * @since 1.17.0
         * @param callback (Function) a callback function that returns the site pages
         *   callback signature: function(data) {}
         *   data signature: { pages: ['page1', 'page2', 'myPage', ...]}
         */
        getSitePages: function(callback) {
            _w.sendMessageInternal2(_w.MessageTypes.GET_SITE_PAGES, {}, callback);
        },

        /**
         * Function navigateToPage
         *
         * Returns the pages which are used in hosting site by name
         *
         * @since 1.17.0
         * @param pageId (String) the page name as received by getSitePages
         *
         */
        navigateToPage: function(pageId) {
            if (!pageId) {
                _w.reportSdkError('Missing mandatory argument - pageId');
                return;
            }

            _w.sendMessageInternal2(_w.MessageTypes.NAVIGATE_TO_PAGE, {pageId: pageId});
        },

        /**
         * Function currentMember
         *
         * @since SDK 1.6.0
         * @param onSuccess (Function) a call back function to receive the function completion
         * status. The function signature should be :
         *  function onSuccess(param) {...}
         */
        currentMember:function (onSuccess) {
            if (this.Utils.getViewMode() !== "site") {
                _w.reportSdkError('Invalid View Mode, this method works only for site view mode');
                return;
            }
            _w.sendPingPongMessage(_w.MessageTypes.SM_CURRENT_MEMBER, onSuccess);
        },

        /**
         * Function openPopup
         *
         * @param url (String) popup iframe's url
         * @param width (Number) popup width in pixels
         * @param height (Number) popup height in pixels
         * @param position (Object) properties
         *     Object
         * 		  origin (WindowOrigin enum) popup origin point, reserved values. One of WindowOrigin's values, default is set to WindowOrigin.RELATIVE
         * 		  placement (WindowPlacement enum) - a predefine set of common placements, default is set to WindowPlacement.CENTER
         *
         *  example - {origin: Wix.WindowOrigin.RELATIVE, placement: Wix.WindowPlacement.TOP_CENTER}
         */
        openPopup:function (url, width, height, position) {
            if (this.Utils.getViewMode() === "editor") {
                _w.reportSdkError('Invalid View Mode, editor, only preview and site are supported');
                return;
            }

            position = position || {};
            position.origin = position.origin || this.WindowOrigin.DEFAULT;
            position.placement = position.placement || this.WindowPlacement.CENTER;

            var args = {
                url   : url,
                width : width,
                height: height,
                position: position
            };
            _w.sendMessageInternal(_w.MessageTypes.OPEN_POPUP, args);
        },

        /**
         * Function openModal
         *
         * @since SDK 1.13.0
         * @param url (String) popup iframe's url
         * @param width (Number) popup width in pixels
         * @param height (Number) popup height in pixels
         */
        openModal:function (url, width, height) {
            if (this.Utils.getViewMode() === "editor") {
                _w.reportSdkError('Invalid View Mode, editor, only preview and site are supported');
                return;
            }

            var args = {
                url   : url,
                width : width,
                height: height
            };
            _w.sendMessageInternal(_w.MessageTypes.OPEN_MODAL, args);
        },

        /*
         * Function closeWindow
         *
         * Closes the app's modal/popup window.
         * This function can be used from a popup scope only!!
         *
         * @since SDK 1.13.0
         */
        closeWindow:function () {
            _w.sendMessageInternal2(_w.MessageTypes.CLOSE_WINDOW);
        },

        /**
         * Function addEventListener
         *
         * @since SDK 1.11.0
         * @param eventName (String) the event name, reserved values, see Events
         * @param callBack (Function) a callback function which gets invoked when a new
         * event is sent from the wix site, The function signature should be :
         *  function callBack(param) {...}
         */
        addEventListener: function(eventName, callBack) {
            if (!eventName || !Wix.Events.hasOwnProperty(eventName)) {
                _w.reportSdkError('Unsupported event name, ' + eventName);
                return;
            }

            var callbacks = _w.EventsCallbacks[eventName] || [];
            callbacks.push(callBack);
        }

    };

    /**
     * Deploy API on the container (iframe window)
     */
    container.Wix = Wix;
    _w.init();
}(this));
