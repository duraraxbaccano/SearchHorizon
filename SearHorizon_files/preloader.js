(function(){

    if (MobileUtils.isMobile() && MobileUtils.isViewportOpen()) {
        var viewport = document.getElementById('wixMobileViewport');
        var scale = MobileUtils.getInitZoom();
        viewport.setAttribute('content','maximum-scale = '+ scale +', minimum-scale = '+ scale);

        var WinMobileZoomFix = rendererModel.runningExperiments.WinMobileZoomFix || rendererModel.runningExperiments.winmobilezoomfix;
        var WinMobileZoomFixEnabled = WinMobileZoomFix && (WinMobileZoomFix === "New" || WinMobileZoomFix === "new");

        if(WinMobileZoomFix && MobileUtils.isMSMobileDevice()){
            document.body.style.msTouchAction = 'pan-y';
        }

        if(MobileUtils.isMSMobileDevice()){
            document.querySelector("#viewer_preloader").className+=' ms-device-preloader';
            document.querySelector("#preloader").className+=' ms-device-preloader';
            if(document.querySelector("#userLogo")){
                document.querySelector("#userLogo").className+=' ms-device-preloader';
            }
        }

        document.getElementById("viewer_preloader").style.display = "block";
    }
})();