/* ============================================================
   DESIGN EXPLORER 2
   Google Drive / Apps Script compatible version

   Replace the ENTIRE contents of:
       js/designExplorer.js

   Google Drive is accessed through the Apps Script proxy.
   JSONP is used because GitHub Pages cannot XHR directly
   to a Google Apps Script ContentService endpoint.
   ============================================================ */


/* ============================================================
   BASIC PAGE FUNCTIONS
   ============================================================ */

function unloadPageContent() {

    overwriteInitialGlobalValues();

    d3.select("div.legend").selectAll("*").remove();

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

    d3.select("#thumbnails-btm_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-btm_container")
        .select("div#sorting")
        .text("");

    d3.select("#thumbnails-btm_container")
        .select("div#thumbnails-btm")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-side_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-side_container")
        .select("div#sorting")
        .text("");

    d3.select("#thumbnails-side_container")
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

    rcheight = height =
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
        .style("height", zoomedHeight + "px");

    currentView = "2D";

    d3.select("input#toggleView")
        .property("checked", "true");

    initit3DViewer = true;

    d3.select("#zoomed")
        .classed("hidden", false);

    d3.select("#viewer3d")
        .classed("hidden", true);
}


/* ============================================================
   URL PARAMETERS
   ============================================================ */

function getUrlVars(rawUrl) {

    var vars = {};

    rawUrl.replace(
        /[?&]+([^=&]+)=([^&]*)/gi,
        function (m, key, value) {
            vars[key] = value;
        }
    );

    return vars;
}


/* ============================================================
   KEYS / CONFIGURATION
   ============================================================ */

/*
   These are retained for compatibility with the original
   Design Explorer code.
*/

var Gkey =
    "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";

var BitlyKey =
    "52e99e2d788d32ae8ea99007d96917ac4ba50a5a";


/*
   IMPORTANT:

   This must be the /exec URL of your deployed Apps Script.
*/

var GOOGLE_DRIVE_PROXY =
    "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";


/* ============================================================
   GOOGLE DRIVE URL HELPERS
   ============================================================ */

function makeDriveImageUrl(fileId) {

    if (!fileId) {
        return "";
    }

    /*
       This URL is intended for <img src="...">.
       It does not require the Apps Script proxy.
    */

    return "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=view";
}


function makeDriveDownloadUrl(fileId) {

    if (!fileId) {
        return "";
    }

    return "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=download";
}


function makeProxyFileUrl(fileId) {

    if (!fileId) {
        return "";
    }

    return GOOGLE_DRIVE_PROXY +
        "?fileId=" +
        encodeURIComponent(fileId);
}


function makeProxyJsonpUrl(fileId, callbackName) {

    if (!fileId) {
        return "";
    }

    return GOOGLE_DRIVE_PROXY +
        "?fileId=" +
        encodeURIComponent(fileId) +
        "&callback=" +
        encodeURIComponent(callbackName);
}


/* ============================================================
   JSONP LOADER
   ============================================================ */

var designExplorerJsonpCounter = 0;


function loadGoogleDriveJSONP(url, successCallback, errorCallback) {

    designExplorerJsonpCounter++;

    var callbackName =
        "__designExplorerJSONP_" +
        new Date().getTime() +
        "_" +
        designExplorerJsonpCounter;

    var script =
        document.createElement("script");

    var finished = false;

    function cleanup() {

        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }

        try {
            delete window[callbackName];
        } catch (e) {
            window[callbackName] = undefined;
        }
    }

    window[callbackName] = function (data) {

        if (finished) {
            return;
        }

        finished = true;

        cleanup();

        if (successCallback) {
            successCallback(data);
        }
    };

    script.onerror = function () {

        if (finished) {
            return;
        }

        finished = true;

        cleanup();

        console.error(
            "Design Explorer: JSONP request failed:",
            url
        );

        if (errorCallback) {
            errorCallback();
        }
    };

    if (url.indexOf("?") >= 0) {
        url += "&callback=" +
            encodeURIComponent(callbackName);
    } else {
        url += "?callback=" +
            encodeURIComponent(callbackName);
    }

    script.src = url;

    script.async = true;

    document.getElementsByTagName("head")[0]
        .appendChild(script);
}


/* ============================================================
   PATCH D3 CSV / JSON
   ============================================================ */

/*
   The original index.html contains:

       d3.csv(csvFilePathLink, ...)

   and:

       d3.json(jsonFileAddress, ...)

   Those are XMLHttpRequests.

   Google Apps Script is cross-origin from GitHub Pages,
   therefore those XHR calls can fail.

   We intercept only requests going to our Apps Script proxy
   and load them through JSONP instead.
*/

(function installGoogleDriveD3Patch() {

    if (typeof d3 === "undefined") {
        console.error(
            "Design Explorer: D3 was not loaded before designExplorer.js."
        );
        return;
    }

    var originalD3Csv = d3.csv;
    var originalD3Json = d3.json;


    /* --------------------------------------------------------
       d3.csv patch
       -------------------------------------------------------- */

    d3.csv = function (url, callback) {

        if (
            typeof url === "string" &&
            url.indexOf(GOOGLE_DRIVE_PROXY) === 0 &&
            url.indexOf("fileId=") >= 0
        ) {

            var fileId =
                getQueryParameter(url, "fileId");

            if (!fileId) {

                if (callback) {
                    callback([]);
                }

                return;
            }

            loadGoogleDriveJSONP(
                makeProxyJsonpUrl(
                    fileId,
                    "__unused__"
                ),
                function (csvText) {

                    try {

                        /*
                           Apps Script returns the CSV as a
                           JSON string when callback is supplied.
                        */

                        if (
                            typeof csvText !== "string"
                        ) {

                            csvText =
                                String(csvText);
                        }

                        var parsed =
                            d3.csv.parse(csvText);

                        if (callback) {
                            callback(parsed);
                        }

                    } catch (error) {

                        console.error(
                            "Design Explorer: CSV parsing failed.",
                            error
                        );

                        if (callback) {
                            callback([]);
                        }
                    }
                },
                function () {

                    console.error(
                        "Design Explorer: CSV loading failed."
                    );

                    if (callback) {
                        callback([]);
                    }
                }
            );

            /*
               We cannot use the generated callback above
               because loadGoogleDriveJSONP generates its own
               callback.

               Return a dummy request-like object.
            */

            return {
                abort: function () {}
            };
        }

        return originalD3Csv.apply(
            d3,
            arguments
        );
    };


    /* --------------------------------------------------------
       d3.json patch
       -------------------------------------------------------- */

    d3.json = function (url, callback) {

        if (
            typeof url === "string" &&
            url.indexOf(GOOGLE_DRIVE_PROXY) === 0 &&
            url.indexOf("fileId=") >= 0
        ) {

            var fileId =
                getQueryParameter(url, "fileId");

            if (!fileId) {

                if (callback) {
                    callback(null);
                }

                return;
            }

            loadGoogleDriveJSONP(
                makeProxyJsonpUrl(
                    fileId,
                    "__unused__"
                ),
                function (jsonData) {

                    if (callback) {
                        callback(jsonData);
                    }
                },
                function () {

                    console.error(
                        "Design Explorer: 3D JSON loading failed:",
                        fileId
                    );

                    if (callback) {
                        callback(null);
                    }
                }
            );

            return {
                abort: function () {}
            };
        }

        return originalD3Json.apply(
            d3,
            arguments
        );
    };

})();


function getQueryParameter(url, parameterName) {

    var escaped =
        parameterName.replace(
            /[\[\]]/g,
            "\\$&"
        );

    var regex =
        new RegExp(
            "[?&]" +
            escaped +
            "(=([^&#]*)|&|#|$)"
        );

    var results =
        regex.exec(url);

    if (!results) {
        return null;
    }

    if (!results[2]) {
        return "";
    }

    return decodeURIComponent(
        results[2].replace(/\+/g, " ")
    );
}


/* ============================================================
   GOOGLE DRIVE FOLDER LOADING
   ============================================================ */

function prepareGFolder(folderLink) {

    if (!folderLink) {

        alert(
            "Design Explorer: Google Drive folder information is missing."
        );

        return;
    }


    /*
       Reset the object.
    */

    _googleReturnObj = {
        csvFiles: {},
        imgFiles: {},
        jsonFiles: {},
        settingFiles: {}
    };


    var folder = {

        DE_PW: "",

        inLink: "",

        url: "",

        type: ""
    };


    folder = folderLink;


    console.log(
        "Design Explorer: loading Google Drive folder..."
    );

    console.log(
        "Proxy:",
        folder.url
    );


    loadGoogleDriveJSONP(

        folder.url,

        function (data) {

            if (!data) {

                alert(
                    "Google Drive loading failed: The proxy returned no data."
                );

                return;
            }


            /*
               Some Apps Script versions may return:

                   { files: [...] }

               Make sure files is always an array.
            */

            var files = [];

            if (Array.isArray(data.files)) {
                files = data.files;
            }


            console.log(
                "Design Explorer: files received:",
                files.length
            );


            files.forEach(function (item) {

                if (!item) {
                    return;
                }


                var name =
                    item.name || "";


                var fileId =
                    item.id || item.fileId || "";


                var mimeType =
                    item.mimeType || "";


                if (!name || !fileId) {
                    return;
                }


                /*
                   Normalize filename for matching.
                */

                var lowerName =
                    name.toLowerCase();


                /*
                   IMAGE
                */

                if (
                    mimeType.indexOf("image/") === 0 ||
                    lowerName.match(
                        /\.(png|jpg|jpeg|gif|webp)$/i
                    )
                ) {

                    _googleReturnObj.imgFiles[name] =
                        makeDriveImageUrl(fileId);

                    return;
                }


                /*
                   CSV
                */

                if (
                    mimeType === "text/csv" ||
                    lowerName.endsWith(".csv")
                ) {

                    _googleReturnObj.csvFiles[name] =
                        makeProxyFileUrl(fileId);

                    return;
                }


                /*
                   JSON
                */

                if (
                    mimeType === "application/json" ||
                    lowerName.endsWith(".json")
                ) {

                    var jsonUrl =
                        makeProxyFileUrl(fileId);


                    /*
                       Design Explorer convention:
                       files beginning with "setting"
                       are settings.
                    */

                    if (
                        lowerName.indexOf("setting") === 0
                    ) {

                        _googleReturnObj.settingFiles[name] =
                            jsonUrl;

                    } else {

                        _googleReturnObj.jsonFiles[name] =
                            jsonUrl;
                    }

                    return;
                }

            });


            console.log(
                "Design Explorer: CSV files:",
                Object.keys(
                    _googleReturnObj.csvFiles
                )
            );

            console.log(
                "Design Explorer: image files:",
                Object.keys(
                    _googleReturnObj.imgFiles
                ).length
            );

            console.log(
                "Design Explorer: 3D JSON files:",
                Object.keys(
                    _googleReturnObj.jsonFiles
                ).length
            );


            /*
               Pagination
            */

            if (data.nextPageToken) {

                var separator =
                    folder.url.indexOf("?") >= 0
                        ? "&"
                        : "?";

                var nextUrl =
                    folder.url +
                    separator +
                    "pageToken=" +
                    encodeURIComponent(
                        data.nextPageToken
                    );

                folder.url = nextUrl;

                prepareGFolder(folder);

                return;
            }


            /*
               Find data.csv.
            */

            var csvFile =
                _googleReturnObj.csvFiles["data.csv"];


            /*
               Some datasets use DATA.CSV.
               Search case-insensitively if exact
               data.csv was not found.
            */

            if (!csvFile) {

                var csvNames =
                    Object.keys(
                        _googleReturnObj.csvFiles
                    );

                for (
                    var i = 0;
                    i < csvNames.length;
                    i++
                ) {

                    if (
                        csvNames[i].toLowerCase() ===
                        "data.csv"
                    ) {

                        csvFile =
                            _googleReturnObj.csvFiles[
                                csvNames[i]
                            ];

                        break;
                    }
                }
            }


            if (!csvFile) {

                alert(
                    "Could not find data.csv in the Google Drive folder."
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
                "Design Explorer: loading:",
                csvFile
            );


            readyToLoad(csvFile);
        },

        function () {

            alert(
                "Google Drive loading failed. " +
                "The Apps Script proxy could not be reached."
            );

            console.error(
                "Design Explorer: unable to load proxy:",
                folder.url
            );
        }
    );
}


/* ============================================================
   LOAD FROM GOOGLE DRIVE / URL
   ============================================================ */

function MP_getGoogleIDandLoad(dataMethod) {

    var serverFolderLink;

    document.getElementById(
        "csv-file"
    ).value = "";


    if (dataMethod === "URL") {

        document.getElementById(
            "folderLink"
        ).value = "";


        var inUrl =
            window.location.href;


        decodeUrlID(
            inUrl,
            function (d) {

                loadFromUrl(d);
            }
        );

    } else {

        serverFolderLink =
            document.getElementById(
                "folderLink"
            ).value;


        loadFromUrl(
            serverFolderLink
        );
    }
}


function loadFromUrl(rawUrl) {

    if (!rawUrl) {

        alert(
            "Please enter a Google Drive folder URL."
        );

        return;
    }


    checkInputLink(
        rawUrl,

        function (d) {

            _folderInfo = d;


            console.log(
                "Design Explorer folder info:",
                d
            );


            if (
                d.type ===
                "userServerLink"
            ) {

                readyToLoad(
                    d.url +
                    "data.csv"
                );

            } else {

                prepareGFolder(d);
            }
        }
    );
}


/* ============================================================
   LABEL SIZE
   ============================================================ */

function changeLabelSize(size) {

    if (size === "largeLabel") {

        d3.selectAll(".label")
            .style(
                "font-size",
                "95%"
            );

    } else if (size === "mediumLabel") {

        d3.selectAll(".label")
            .style(
                "font-size",
                "85%"
            );

    } else if (size === "smallLabel") {

        d3.selectAll(".label")
            .style(
                "font-size",
                "75%"
            );
    }
}


/* ============================================================
   CHECK INPUT LINK
   ============================================================ */

function checkInputLink(
    link,
    callback
) {

    var folderLinkObj = {

        DE_PW: "",

        inLink: "",

        url: "",

        type: ""
    };


    if (
        link &&
        (
            link.indexOf("google.com") >= 0 ||
            link.indexOf("drive.google") >= 0
        )
    ) {

        var GFolderID =
            getGFolderID(link);


        if (!GFolderID) {

            alert(
                "Could not find the Google Drive folder ID."
            );

            return;
        }


        /*
           IMPORTANT:

           Do NOT use:
             googleapis.com/drive/v3/files

           The Apps Script proxy lists the files.
        */

        folderLinkObj.url =
            GOOGLE_DRIVE_PROXY +
            "?folderId=" +
            encodeURIComponent(
                GFolderID
            );


        folderLinkObj.type =
            "GoogleDrive";


    } else if (
        link &&
        link.indexOf("1drv.ms") >= 0
    ) {

        folderLinkObj.url =
            "https://api.onedrive.com/v1.0/shares/u!" +
            encodeUrl(link) +
            "/root?expand=children";

        folderLinkObj.type =
            "OneDrive";

    } else {

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


    folderLinkObj.inLink =
        link;


    callback(
        folderLinkObj
    );
}


/* ============================================================
   GOOGLE DRIVE FOLDER ID
   ============================================================ */

function getGFolderID(link) {

    if (!link) {
        return "";
    }


    var cleanLink =
        link.trim();


    /*
       /folders/FOLDER_ID
    */

    var folderMatch =
        cleanLink.match(
            /\/folders\/([a-zA-Z0-9_-]+)/
        );


    if (folderMatch) {

        return folderMatch[1];
    }


    /*
       ?id=FOLDER_ID
    */

    var idMatch =
        cleanLink.match(
            /[?&]id=([a-zA-Z0-9_-]+)/
        );


    if (idMatch) {

        return idMatch[1];
    }


    /*
       Raw folder ID.
    */

    if (
        /^[a-zA-Z0-9_-]+$/.test(
            cleanLink
        )
    ) {

        return cleanLink;
    }


    /*
       Last fallback:
       take the last non-empty URL component.
    */

    var parts =
        cleanLink.split("/");


    while (
        parts.length &&
        parts[parts.length - 1] === ""
    ) {

        parts.pop();
    }


    if (parts.length) {

        var last =
            parts[parts.length - 1];


        if (
            /^[a-zA-Z0-9_-]+$/.test(
                last
            )
        ) {

            return last;
        }
    }


    return "";
}


/* ============================================================
   URL ENCODE / DECODE
   ============================================================ */

function encodeUrl(url) {

    try {

        return btoa(url);

    } catch (e) {

        return url;
    }
}


function decodeUrl(encodedString) {

    var url = "";


    try {

        url =
            atob(encodedString);

    } catch (err) {

        console.log(
            err.message +
            " But fixed:"
        );


        try {

            url =
                atob(
                    encodedString
                        .replace("_", "/")
                        .replace("-", "+") +
                    "="
                );

        } catch (e) {

            url = "";
        }
    }


    return url;
}


/* ============================================================
   CLIPBOARD
   ============================================================ */

function CopyToClipboard(element) {

    var $temp =
        $("<input>");


    $("body")
        .append($temp);


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
   BITLY
   ============================================================ */

function makeUrlId(
    rawUrl,
    callback
) {

    var longUrl =
        rawUrl;


    $.ajax({

        type: "POST",

        contentType:
            "application/json",

        url:
            "https://api-ssl.bitly.com/v4/shorten",

        data:
            JSON.stringify({
                long_url:
                    longUrl
            }),

        headers: {

            "Authorization":
                BitlyKey,

            "Content-Type":
                "application/json"
        },

        error:
            function () {

                callback(
                    encodeUrl(
                        longUrl
                    )
                );
            },

        dataType:
            "json",

        success:
            function (response) {

                var UrlId = "";


                if (
                    response.id != null
                ) {

                    UrlId =
                        response.id
                            .split("/");

                    UrlId =
                        UrlId[
                            UrlId.length - 1
                        ];
                }


                callback(
                    "BL_" +
                    UrlId
                );
            }
    });
}


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

                bitlink_id:
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
            function (result) {

                callback(
                    result.long_url
                );
            },

        error:
            function () {

                console.error(
                    "Bitly expansion failed."
                );
            }
    });
}


/* ============================================================
   DECODE DESIGN EXPLORER URL
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


    /*
       Old GFOLDER link
    */

    if (
        GfolderORUrl !== undefined
    ) {

        if (
            GfolderORUrl.search("/") === -1
        ) {

            serverFolderLink =
                "https://drive.google.com/drive/folders/" +
                GfolderORUrl;

        } else {

            serverFolderLink =
                GfolderORUrl;
        }


        callback(
            serverFolderLink
        );


        return;
    }


    /*
       ID link
    */

    if (
        DEID !== undefined
    ) {

        var linkID =
            DEID;


        /*
           Old goo.gl ID.
        */

        if (
            linkID.length === 6
        ) {

            d3.json(
                "https://www.googleapis.com/urlshortener/v1/url?key=" +
                Gkey +
                "&shortUrl=http://goo.gl/" +
                linkID,

                function (d) {

                    if (!d) {
                        return;
                    }


                    var GID =
                        getUrlVars(
                            d.longUrl
                        ).ID;


                    serverFolderLink =
                        decodeUrl(
                            GID
                        );


                    callback(
                        serverFolderLink
                    );
                }
            );


        } else if (
            linkID.indexOf("BL_") === 0
        ) {

            getUrlID(
                linkID.replace(
                    "BL_",
                    ""
                ),

                function (d) {

                    var GID =
                        getUrlVars(
                            d
                        ).ID;


                    serverFolderLink =
                        decodeUrl(
                            GID
                        );


                    callback(
                        serverFolderLink
                    );
                }
            );


        } else {

            serverFolderLink =
                decodeUrl(
                    linkID
                );


            callback(
                serverFolderLink
            );
        }


        return;
    }


    /*
       Nothing found.
    */

    console.warn(
        "Design Explorer: no GFOLDER or ID parameter found."
    );
}
