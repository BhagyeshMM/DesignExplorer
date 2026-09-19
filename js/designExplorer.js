function unloadPageContent() {
    /*
        This function removes current contents from the page.
        Only base HTML objects will remain in the page afterwards.
    */

    overwriteInitialGlobalValues();

    d3.select("div.legend")
        .selectAll("*")
        .remove();

    d3.select("#inputSliders")
        .selectAll("*")
        .remove();

    d3.select("#inputSliders")
        .append("form")
        .attr("class", "sliders");

    d3.select("div#graph")
        .selectAll("*")
        .remove();

    d3.select("div#radarChart")
        .selectAll("*")
        .remove();

    d3.select("div#thumbnails-btm_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("div#thumbnails-btm_container")
        .select("div#sorting")
        .text("");

    d3.select("div#thumbnails-btm_container")
        .select("div#thumbnails-btm")
        .selectAll("*")
        .remove();

    d3.select("div#thumbnails-side_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("div#thumbnails-side_container")
        .select("div#sorting")
        .text("");

    d3.select("div#thumbnails-side_container")
        .select("div#thumbnails-side")
        .selectAll("*")
        .remove();

    d3.select("div#zoomed")
        .selectAll("*")
        .remove();

    d3.select("div#viewer3d")
        .selectAll("*")
        .remove();
}


function calWidthAndHeight() {

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    cleanHeight = windowHeight - 115;
    cleanWidth = windowWidth - 100;

    graphHeight = (cleanHeight / 3) - 24;

    zoomedHeight = (cleanHeight * 2 / 3);
}


function overwriteInitialGlobalValues() {

    /*
        This function initiates all the global values for the page.
    */

    originalData = "";

    cleanedData = [];

    numericalData = [];

    inputData = [];

    outputData = [];

    slidersInfo = [];

    currentSliderValues = {};

    allDataCollector = {};

    slidersMapping = {};

    ids = [];

    cleanedKeys4pc = {};

    googleFolderLink = "";

    inputDataKeys = [];

    outputDataKeys = [];

    imageLinkKeys = [];


    _userSetting = {

        studyInfo: {
            name: "",
            date: ""
        },

        dimScales: {},

        dimTicks: {},

        dimMark: {}
    };


    rcheight =
        height =
        d3.select("#graph")
            .style("height")
            .replace("px", "");


    selectedDataFormatted = [];

    firstRating = true;


    calWidthAndHeight();


    pcHeight =
        d3.select("#graph")
            .style("height")
            .replace("px", "");


    d3.selectAll(".zoomed")
        .style("height", "0px");


    d3.select("#thumbnails-btm_container")
        .style(
            "height",
            zoomedHeight + "px"
        );


    currentView = "2D";


    d3.select("input#toggleView")
        .property("checked", true);


    initit3DViewer = true;


    d3.select("#zoomed")
        .classed("hidden", false);


    d3.select("#viewer3d")
        .classed("hidden", true);
}


/* ============================================================
   GOOGLE DRIVE FILE OBJECT
   ============================================================ */

var _googleReturnObj = {

    csvFiles: {},

    imgFiles: {},

    jsonFiles: {},

    settingFiles: {}

};


/* ============================================================
   GOOGLE DRIVE FOLDER ID
   ============================================================ */

function getGFolderID(link) {

    link = String(link || "").trim();


    var match;


    /*
        Standard folder URL:

        https://drive.google.com/drive/folders/FOLDER_ID
    */

    match =
        link.match(
            /\/folders\/([a-zA-Z0-9_-]+)/
        );


    if (match) {
        return match[1];
    }


    /*
        URL with ?id=FOLDER_ID
    */

    match =
        link.match(
            /[?&]id=([a-zA-Z0-9_-]+)/
        );


    if (match) {
        return match[1];
    }


    /*
        Folder ID entered directly.
    */

    if (
        /^[a-zA-Z0-9_-]{20,}$/.test(link)
    ) {

        return link;

    }


    return "";
}


/* ============================================================
   CHECK INPUT LINK
   ============================================================ */

function checkInputLink(link, callback) {

    link =
        String(link || "").trim();


    var folderLinkObj = {

        DE_PW: "",

        inLink: link,

        url: "",

        type: ""

    };


    /*
        GOOGLE DRIVE
    */

    if (

        link.indexOf(
            "drive.google.com"
        ) !== -1

        ||

        /^[a-zA-Z0-9_-]{20,}$/.test(
            link
        )

    ) {

        var folderId =
            getGFolderID(link);


        if (!folderId) {

            alert(
                "Could not read the Google Drive folder ID."
            );

            return;
        }


        folderLinkObj.folderId =
            folderId;


        /*
            The Apps Script endpoint will be
            called using JSONP.
        */

        folderLinkObj.url =
            GOOGLE_DRIVE_PROXY +
            "?folderId=" +
            encodeURIComponent(
                folderId
            );


        folderLinkObj.type =
            "GoogleDrive";

    }


    /*
        USER SERVER LINK
    */

    else {

        if (
            link.slice(-1) !== "/"
        ) {

            link += "/";

        }


        folderLinkObj.url =
            link;


        folderLinkObj.type =
            "userServerLink";

    }


    callback(
        folderLinkObj
    );
}


/* ============================================================
   CONFIGURATION
   ============================================================ */

var Gkey =
    "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";


var BitlyKey =
    "52e99e2d788d32ae8ea99007d96917ac4ba50a5a";


var GOOGLE_DRIVE_PROXY =
    "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";


/* ============================================================
   GOOGLE DRIVE JSONP LOADER
   ============================================================ */

function loadGoogleDriveJSONP(
    url,
    successCallback,
    errorCallback
) {

    /*
        Generate a unique global callback name.
    */

    var callbackName =
        "__designExplorerGoogleCallback_" +
        new Date().getTime() +
        "_" +
        Math.floor(
            Math.random() * 100000
        );


    var script =
        document.createElement("script");


    var timeout;


    var finished = false;


    /*
        Cleanup function.
    */

    function cleanup() {

        if (finished) {
            return;
        }


        finished = true;


        if (timeout) {

            clearTimeout(
                timeout
            );

        }


        try {

            delete window[
                callbackName
            ];

        }

        catch (e) {

            window[
                callbackName
            ] = undefined;

        }


        if (
            script &&
            script.parentNode
        ) {

            script.parentNode.removeChild(
                script
            );

        }

    }


    /*
        Callback called by Google Apps Script.

        The Apps Script response will look like:

        __designExplorerGoogleCallback_123({
            "files":[...]
        });
    */

    window[
        callbackName
    ] = function(data) {

        console.log(
            "Google Drive JSONP response:",
            data
        );


        cleanup();


        if (
            typeof successCallback ===
            "function"
        ) {

            successCallback(
                data
            );

        }

    };


    /*
        Handle script loading errors.
    */

    script.onerror =
        function(error) {

            console.error(
                "Google Drive JSONP request failed:",
                error
            );


            cleanup();


            if (
                typeof errorCallback ===
                "function"
            ) {

                errorCallback(
                    error
                );

            }

        };


    /*
        Add callback parameter.
    */

    var separator =
        url.indexOf("?") === -1
            ? "?"
            : "&";


    script.src =
        url +
        separator +
        "callback=" +
        encodeURIComponent(
            callbackName
        );


    script.async = true;


    /*
        Timeout after 30 seconds.
    */

    timeout =
        setTimeout(
            function() {

                if (finished) {
                    return;
                }


                console.error(
                    "Google Drive JSONP request timed out."
                );


                cleanup();


                if (
                    typeof errorCallback ===
                    "function"
                ) {

                    errorCallback(
                        new Error(
                            "Google Drive JSONP request timed out."
                        )
                    );

                }

            },
            30000
        );


    document
        .getElementsByTagName("head")[0]
        .appendChild(script);
}


/* ============================================================
   PREPARE GOOGLE DRIVE FOLDER
   ============================================================ */

function prepareGFolder(folderLink) {

    console.log(
        "========================================"
    );

    console.log(
        "Design Explorer Google Drive loader"
    );

    console.log(
        "Folder ID:",
        folderLink.folderId
    );

    console.log(
        "Proxy:",
        folderLink.url
    );

    console.log(
        "========================================"
    );


    /*
        Reset file maps.
    */

    _googleReturnObj = {

        csvFiles: {},

        imgFiles: {},

        jsonFiles: {},

        settingFiles: {}

    };


    /*
        Use JSONP instead of d3.json().

        d3.json() performs XMLHttpRequest.
        Google Apps Script ContentService is
        cross-origin, so JSONP avoids the XHR/CORS
        problem.
    */

    loadGoogleDriveJSONP(

        folderLink.url,

        function(data) {

            console.log(
                "Google Drive data received."
            );


            /*
                Validate response.
            */

            if (!data) {

                alert(
                    "Google Drive loading failed: " +
                    "The proxy returned no data."
                );

                console.error(
                    "Google Drive JSONP returned no data."
                );

                return;
            }


            /*
                Apps Script error.
            */

            if (data.error) {

                alert(
                    "Google Drive loading failed: " +
                    data.error
                );

                console.error(
                    "Google Drive proxy error:",
                    data.error
                );

                return;
            }


            /*
                Validate files array.
            */

            if (
                !Array.isArray(
                    data.files
                )
            ) {

                alert(
                    "Google Drive loading failed: " +
                    "The proxy response does not contain a files array."
                );

                console.error(
                    "Invalid Google Drive response:",
                    data
                );

                return;
            }


            console.log(
                "Google Drive files returned:",
                data.files.length
            );


            /*
                Process files.
            */

            data.files.forEach(
                function(item) {

                    if (!item) {
                        return;
                    }


                    var name =
                        String(
                            item.name || ""
                        ).trim();


                    var lowerName =
                        name.toLowerCase();


                    var fileUrl =
                        String(
                            item.url || ""
                        ).trim();


                    var mimeType =
                        String(
                            item.mimeType || ""
                        ).toLowerCase();


                    /*
                        Skip invalid entries.
                    */

                    if (
                        !name ||
                        !fileUrl
                    ) {

                        console.warn(
                            "Skipping invalid file:",
                            item
                        );

                        return;
                    }


                    /*
                        CSV
                    */

                    if (
                        lowerName.endsWith(
                            ".csv"
                        )
                    ) {

                        _googleReturnObj
                            .csvFiles[name] =
                            fileUrl;

                    }


                    /*
                        IMAGE
                    */

                    else if (

                        mimeType.indexOf(
                            "image/"
                        ) === 0

                        ||

                        /\.(png|jpg|jpeg|gif|webp)$/i
                            .test(name)

                    ) {

                        _googleReturnObj
                            .imgFiles[name] =
                            fileUrl;

                    }


                    /*
                        JSON
                    */

                    else if (

                        mimeType ===
                            "application/json"

                        ||

                        lowerName.endsWith(
                            ".json"
                        )

                    ) {

                        /*
                            Settings files.
                        */

                        if (
                            lowerName.indexOf(
                                "setting"
                            ) === 0
                        ) {

                            _googleReturnObj
                                .settingFiles[name] =
                                fileUrl;

                        }


                        /*
                            3D model files.
                        */

                        else {

                            _googleReturnObj
                                .jsonFiles[name] =
                                fileUrl;

                        }

                    }

                }
            );


            /* =====================================================
               FILE MAP DIAGNOSTICS
               ===================================================== */

            console.log(
                "========================================"
            );

            console.log(
                "Design Explorer Google Drive file map"
            );

            console.log(
                "CSV count:",
                Object.keys(
                    _googleReturnObj.csvFiles
                ).length
            );

            console.log(
                "Image count:",
                Object.keys(
                    _googleReturnObj.imgFiles
                ).length
            );

            console.log(
                "3D JSON count:",
                Object.keys(
                    _googleReturnObj.jsonFiles
                ).length
            );

            console.log(
                "Setting count:",
                Object.keys(
                    _googleReturnObj.settingFiles
                ).length
            );

            console.log(
                "CSV files:",
                _googleReturnObj.csvFiles
            );

            console.log(
                "Image files:",
                _googleReturnObj.imgFiles
            );

            console.log(
                "3D JSON files:",
                _googleReturnObj.jsonFiles
            );

            console.log(
                "Setting files:",
                _googleReturnObj.settingFiles
            );

            console.log(
                "========================================"
            );


            /* =====================================================
               FIND DATA.CSV
               ===================================================== */

            var csvFile =
                null;


            /*
                Exact data.csv.
            */

            if (
                _googleReturnObj
                    .csvFiles["data.csv"]
            ) {

                csvFile =
                    _googleReturnObj
                        .csvFiles["data.csv"];

            }


            /*
                Case-insensitive fallback.
            */

            if (!csvFile) {

                Object.keys(
                    _googleReturnObj.csvFiles
                ).some(
                    function(filename) {

                        if (
                            filename.toLowerCase() ===
                            "data.csv"
                        ) {

                            csvFile =
                                _googleReturnObj
                                    .csvFiles[
                                        filename
                                    ];

                            return true;
                        }


                        return false;

                    }
                );

            }


            /*
                data.csv missing.
            */

            if (!csvFile) {

                alert(
                    "Could not find data.csv " +
                    "in the Google Drive folder."
                );

                console.error(
                    "Available CSV files:",
                    Object.keys(
                        _googleReturnObj.csvFiles
                    )
                );

                return;
            }


            console.log(
                "data.csv URL:",
                csvFile
            );


            /*
                Keep the folder information globally
                available to index.html.
            */

            _folderInfo =
                folderLink;


            /*
                Start Design Explorer.
            */

            readyToLoad(
                csvFile
            );

        },


        function(error) {

            alert(
                "Google Drive loading failed: " +
                "The Apps Script JSONP request could not be completed."
            );


            console.error(
                "Google Drive JSONP error:",
                error
            );

        }

    );
}


/* ============================================================
   URL PARAMETER PARSER
   ============================================================ */

function getUrlVars(url) {

    var vars = {};


    url =
        String(
            url ||
            window.location.href
        );


    var query =
        url.split("?")[1];


    if (!query) {
        return vars;
    }


    query =
        query.split("#")[0];


    query.split("&")
        .forEach(
            function(part) {

                if (!part) {
                    return;
                }


                var pieces =
                    part.split("=");


                var key =
                    decodeURIComponent(
                        pieces[0] || ""
                    );


                var value =
                    decodeURIComponent(
                        pieces
                            .slice(1)
                            .join("=") ||
                        ""
                    );


                if (key) {

                    vars[key] =
                        value;

                }

            }
        );


    return vars;
}


/* ============================================================
   LOAD GOOGLE ID AND DATA
   ============================================================ */

function MP_getGoogleIDandLoad(dataMethod) {

    var serverFolderLink;


    document.getElementById(
        "csv-file"
    ).value = "";


    if (
        dataMethod === "URL"
    ) {

        document.getElementById(
            "folderLink"
        ).value = "";


        var inUrl =
            window.location.href;


        decodeUrlID(

            inUrl,

            function(d) {

                loadFromUrl(d);

            }

        );

    }

    else {

        serverFolderLink =
            document.getElementById(
                "folderLink"
            ).value;


        loadFromUrl(
            serverFolderLink
        );

    }
}


/* ============================================================
   LOAD FROM URL
   ============================================================ */

function loadFromUrl(rawUrl) {

    checkInputLink(

        rawUrl,

        function(d) {

            _folderInfo =
                d;


            if (
                d.type ===
                "userServerLink"
            ) {

                /*
                    Normal user server.
                */

                readyToLoad(
                    d.url +
                    "data.csv"
                );

            }

            else {

                /*
                    Google Drive.
                */

                prepareGFolder(
                    d
                );

            }

        }

    );
}


/* ============================================================
   CHANGE LABEL SIZE
   ============================================================ */

function changeLabelSize(size) {

    if (
        size == "largeLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "95%"
            );

    }

    else if (
        size == "mediumLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "85%"
            );

    }

    else if (
        size == "smallLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "75%"
            );

    }
}


/* ============================================================
   ENCODE URL
   ============================================================ */

function encodeUrl(url) {

    var link =
        btoa(url);

    return link;
}


/* ============================================================
   DECODE URL
   ============================================================ */

function decodeUrl(encodedString) {

    var url = "";


    try {

        url =
            atob(
                encodedString
            );

    }

    catch(err) {

        console.log(
            err.message +
            " But fixed:>"
        );


        url =
            atob(
                encodedString
                    .replace(
                        "_",
                        "/"
                    )
                    .replace(
                        "-",
                        "+"
                    ) +
                "="
            );

    }


    return url;
}


/* ============================================================
   COPY TO CLIPBOARD
   ============================================================ */

function CopyToClipboard(element) {

    var $temp =
        $("<input>");


    $("body")
        .append(
            $temp
        );


    $temp
        .val(
            $(element).text()
        )
        .select();


    document.execCommand(
        "copy"
    );


    $temp.remove();
}


/* ============================================================
   BITLY URL CREATION
   ============================================================ */

function makeUrlId(
    rawUrl,
    callback
) {

    var longUrl =
        rawUrl;


    $.ajax({

        type:
            "POST",

        contentType:
            "application/json",

        url:
            "https://api-ssl.bitly.com/v4/shorten",

        data:
            JSON.stringify({

                "long_url":
                    longUrl

            }),

        headers: {

            "Authorization":
                BitlyKey,

            "Content-Type":
                "application/json"

        },

        error:
            function(e) {

                callback(
                    encodeUrl(
                        longUrl
                    )
                );

            },

        dataType:
            "json",

        success:
            function(response) {

                var UrlID =
                    "";


                if (
                    response.id != null
                ) {

                    UrlID =
                        response.id.split(
                            "/"
                        );


                    UrlID =
                        UrlID[
                            UrlID.length - 1
                        ];

                }


                callback(
                    "BL_" +
                    UrlID
                );

            }

    });
}


/* ============================================================
   GET BITLY URL
   ============================================================ */

function getUrlID(
    urlID,
    callback
) {

    $.ajax({

        url:
            "https://api-ssl.bitly.com/v4/expand",

        type:
            "POST",

        dataType:
            "json",

        data:
            JSON.stringify({

                "bitlink_id":
                    "bit.ly/" +
                    urlID

            }),

        headers: {

            "Authorization":
                BitlyKey

        },

        contentType:
            "application/json",

        success:
            function(result) {

                callback(
                    result.long_url
                );

            },

        error:
            function(error) {

                console.error(
                    "Bitly expand failed:",
                    error
                );

            }

    });
}


/* ============================================================
   DECODE URL ID
   ============================================================ */

function decodeUrlID(
    rawUrl,
    callback
) {

    var serverFolderLink =
        "";


    var urlVars =
        getUrlVars(
            rawUrl
        );


    var GfolderORUrl =
        urlVars.GFOLDER;


    var DEID =
        urlVars.ID;


    /* =========================================================
       OLD GFOLDER FORMAT
       ========================================================= */

    if (
        GfolderORUrl !==
        undefined
    ) {

        if (
            GfolderORUrl.search(
                "/"
            ) == -1
        ) {

            serverFolderLink =
                "https://drive.google.com/drive/folders/" +
                GfolderORUrl;

        }

        else {

            serverFolderLink =
                GfolderORUrl;

        }


        callback(
            serverFolderLink
        );

    }


    /* =========================================================
       ID FORMAT
       ========================================================= */

    else if (
        DEID !== undefined
    ) {

        var linkID =
            DEID;


        /*
            Old goo.gl format.
        */

        if (
            linkID.length === 6
        ) {

            d3.json(

                "https://www.googleapis.com/urlshortener/v1/url?key=" +
                Gkey +
                "&shortUrl=http://goo.gl/" +
                linkID,

                function(error, d) {

                    /*
                        Support both old D3 callback
                        forms.
                    */

                    if (
                        arguments.length === 1
                    ) {

                        d = error;
                        error = null;

                    }


                    if (
                        error ||
                        !d ||
                        !d.longUrl
                    ) {

                        console.error(
                            "Could not expand Google short URL:",
                            error || d
                        );

                        return;
                    }


                    var GID =
                        getUrlVars(
                            d.longUrl
                        ).ID;


                    if (!GID) {

                        console.error(
                            "Could not extract ID from:",
                            d.longUrl
                        );

                        return;
                    }


                    serverFolderLink =
                        decodeUrl(
                            GID
                        );


                    callback(
                        serverFolderLink
                    );

                }
            );

        }


        /*
            Bitly format.
        */

        else if (
            linkID.startsWith(
                "BL_"
            )
        ) {

            getUrlID(

                linkID.replace(
                    "BL_",
                    ""
                ),

                function(d) {

                    if (!d) {

                        console.error(
                            "Bitly did not return a URL."
                        );

                        return;
                    }


                    var GID =
                        getUrlVars(
                            d
                        ).ID;


                    if (!GID) {

                        console.error(
                            "Could not extract ID from:",
                            d
                        );

                        return;
                    }


                    serverFolderLink =
                        decodeUrl(
                            GID
                        );


                    callback(
                        serverFolderLink
                    );

                }
            );

        }


        /*
            Direct encoded URL.
        */

        else {

            serverFolderLink =
                decodeUrl(
                    linkID
                );


            callback(
                serverFolderLink
            );

        }

    }


    else {

        console.warn(
            "No GFOLDER or ID parameter found:",
            rawUrl
        );

    }
}
