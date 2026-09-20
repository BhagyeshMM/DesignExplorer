function DE_loadJSONP(url, successCallback, errorCallback) {

    var callbackName =
        "DE_jsonp_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 1000000);

    var script = document.createElement("script");

    var finished = false;

    window[callbackName] = function(data) {

        finished = true;

        try {
            successCallback(data);
        } finally {

            delete window[callbackName];

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }
    };

    script.onerror = function() {

        if (finished) {
            return;
        }

        finished = true;

        delete window[callbackName];

        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }

        if (errorCallback) {
            errorCallback();
        }
    };

    var separator = url.indexOf("?") >= 0 ? "&" : "?";

    script.src =
        url +
        separator +
        "prefix=" +
        encodeURIComponent(callbackName);

    script.async = true;

    document.getElementsByTagName("head")[0].appendChild(script);
}
