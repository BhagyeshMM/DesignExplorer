/* ============================================================
   DESIGN EXPLORER
   Google Drive / Apps Script compatible version
   ============================================================ */

var GOOGLE_DRIVE_PROXY =
    "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";

var Gkey =
    "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";

var BitlyKey =
    "52e99e2d788d32ae8ea99007d96917ac4ba50a5a";


/* ============================================================
   PAGE RESET
   ============================================================ */

function unloadPageContent() {

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

    d3.select("#graph")
        .selectAll("*")
        .remove();

    d3.select("#radarChart")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-btm_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-btm_container")
        .select("div#thumbnails-btm")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-side_container")
        .select("div#sorting")
        .selectAll("*")
        .remove();

    d3.select("#thumbnails-side_container")
        .select("div#thumbnails-side")
        .selectAll("*")
        .remove();

    d3.select("#zoomed")
        .selectAll("*")
        .remove();

    d3.select("#viewer3d")
        .selectAll("*")
        .remove();
}


/* ============================================================
   GLOBAL VALUES
   ============================================================ */

function calWidthAndHeight() {

    windowWidth =
        window.innerWidth;

    windowHeight =
        window.innerHeight;

    cleanHeight =
        windowHeight - 115;

    cleanWidth =
        windowWidth - 100;

    graphHeight =
        (cleanHeight / 3) - 24;

    zoomedHeight =
        cleanHeight * 2 / 3;
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

    calWidthAndHeight();

    selectedDataFormatted = [];

    firstRating = true;

    currentView = "2D";

    initit3DViewer = true;

    d3.select("#zoomed")
        .classed("hidden", false);

    d3.select("#viewer3d")
        .classed("hidden", true);
}


/* ============================================================
   URL VARIABLES
   ============================================================ */

function getUrlVars(url) {

    var vars = {};

    url.replace(
        /[?&]+([^=&]+)=([^&]*)/gi,
        function(m, key, value) {
            vars[key] = value;
        }
    );

    return vars;
}


/* ============================================================
   JSONP LOADER
   ============================================================ */

var DE_jsonpCounter = 0;


function DE_loadJSONP(url, success, failure) {

    DE_jsonpCounter++;

    var callbackName =
        "__DE_callback_" +
        new Date().getTime() +
        "_" +
        DE_jsonpCounter;

    var script =
        document.createElement("script");

    var finished = false;

    var timeout =
        setTimeout(function() {

            if (finished) {
                return;
            }

            finished = true;

            cleanup();

            console.error(
                "Design Explorer JSONP timeout:",
                url
            );

            if (failure) {
                failure();
            }

        }, 30000);


    function cleanup() {

        clearTimeout(timeout);

        if (
            script &&
            script.parentNode
        ) {
            script.parentNode.removeChild(script);
        }

        try {
            delete window[callbackName];
        } catch (e) {
            window[callbackName] = undefined;
        }
    }


    window[callbackName] =
        function(data) {

            if (finished) {
                return;
            }

            finished = true;

            cleanup();

            if (success) {
                success(data);
            }
        };


    script.onerror =
        function() {

            if (finished) {
                return;
            }

            finished = true;

            cleanup();

            console.error(
                "Design Explorer JSONP request failed:",
                url
            );

            if (failure) {
                failure();
            }
        };


    var separator =
        url.indexOf("?") >= 0
            ? "&"
            : "?";


    script.src =
        url +
        separator +
        "callback=" +
        encodeURIComponent(callbackName);


    script.async = true;


    document
        .getElementsByTagName("head")[0]
        .appendChild(script);
}


/* ============================================================
   GOOGLE DRIVE IMAGE URL
   ============================================================ */

function DE_imageURL(fileId) {

    return (
        "https://drive.usercontent.google.com/download?id=" +
        encodeURIComponent(fileId) +
        "&export=view"
    );
}


/* ============================================================
   GOOGLE DRIVE FILE URL
   ============================================================ */

function DE_fileURL(fileId) {

    return (
        GOOGLE_DRIVE_PROXY +
        "?fileId=" +
        encodeURIComponent(fileId)
    );
}


/* ============================================================
   GOOGLE DRIVE FOLDER LOADING
   ============================================================ */

function prepareGFolder(folderLink) {

    _googleReturnObj = {

        csvFiles: {},

        imgFiles: {},

        jsonFiles: {},

        settingFiles: {}
    };


    DE_loadJSONP(

        folderLink.url,

        function(result) {

            if (
                !result ||
                !result.files ||
                !Array.isArray(result.files)
            ) {

                alert(
                    "Google Drive loading failed: " +
                    "The Apps Script returned an invalid response."
                );

                return;
            }


            var files =
                result.files;


            for (
                var i = 0;
                i < files.length;
                i++
            ) {

                var file =
                    files[i];


                if (
                    !file ||
                    !file.id ||
                    !file.name
                ) {
                    continue;
                }


                var name =
                    file.name;

                var lower =
                    name.toLowerCase();

                var mime =
                    file.mimeType || "";


                /* IMAGE */

                if (
                    mime.indexOf("image/") === 0 ||
                    /\.(png|jpg|jpeg|gif|webp)$/i.test(lower)
                ) {

                    _googleReturnObj.imgFiles[name] =
                        DE_imageURL(file.id);

                    continue;
                }


                /* CSV */

                if (
                    /\.csv$/i.test(lower)
                ) {

                    _googleReturnObj.csvFiles[name] =
                        DE_fileURL(file.id);

                    continue;
                }


                /* JSON */

                if (
                    /\.json$/i.test(lower)
                ) {

                    if (
                        lower.indexOf("setting") === 0
                    ) {

                        _googleReturnObj.settingFiles[name] =
                            DE_fileURL(file.id);

                    } else {

                        _googleReturnObj.jsonFiles[name] =
                            DE_fileURL(file.id);
                    }

                    continue;
                }
            }


            var csvFile = null;

            var csvNames =
                Object.keys(
                    _googleReturnObj.csvFiles
                );


            for (
                var j = 0;
                j < csvNames.length;
                j++
            ) {

                if (
                    csvNames[j].toLowerCase() ===
                    "data.csv"
                ) {

                    csvFile =
                        _googleReturnObj.csvFiles[
                            csvNames[j]
                        ];

                    break;
                }
            }


            if (!csvFile) {

                alert(
                    "Google Drive folder loaded, " +
                    "but data.csv was not found."
                );

                return;
            }


            readyToLoad(csvFile);
        },

        function() {

            alert(
                "Google Drive loading failed: " +
                "The Apps Script JSONP request could not be completed."
            );
        }
    );
}


/* ============================================================
   GOOGLE DRIVE LINK CHECK
   ============================================================ */

function checkInputLink(link, callback) {

    var folderLinkObj = {

        DE_PW: "",

        inLink: link,

        url: "",

        type: ""
    };


    if (
        link &&
        (
            link.indexOf("drive.google.com") >= 0 ||
            link.indexOf("google.com") >= 0
        )
    ) {

        var folderId =
            getGFolderID(link);


        if (!folderId) {

            alert(
                "Could not extract the Google Drive folder ID."
            );

            return;
        }


        folderLinkObj.url =
            GOOGLE_DRIVE_PROXY +
            "?folderId=" +
            encodeURIComponent(folderId);


        folderLinkObj.type =
            "GoogleDrive";


    } else {

        if (
            link.charAt(link.length - 1) !== "/"
        ) {
            link += "/";
        }

        folderLinkObj.url =
            link;

        folderLinkObj.type =
            "userServerLink";
    }


    callback(folderLinkObj);
}


/* ============================================================
   GOOGLE DRIVE FOLDER ID
   ============================================================ */

function getGFolderID(link) {

    if (!link) {
        return "";
    }


    link =
        link.trim();


    var match =
        link.match(
            /\/folders\/([a-zA-Z0-9_-]+)/
        );


    if (match) {
        return match[1];
    }


    match =
        link.match(
            /[?&]id=([a-zA-Z0-9_-]+)/
        );


    if (match) {
        return match[1];
    }


    if (
        /^[a-zA-Z0-9_-]+$/.test(link)
    ) {
        return link;
    }


    return "";
}


/* ============================================================
   LOAD GOOGLE DRIVE
   ============================================================ */

function MP_getGoogleIDandLoad(dataMethod) {

    var link;


    if (dataMethod === "URL") {

        link =
            window.location.href;


        decodeUrlID(
            link,
            function(result) {

                loadFromUrl(result);
            }
        );


    } else {

        link =
            document.getElementById(
                "folderLink"
            ).value;


        loadFromUrl(link);
    }
}


/* ============================================================
   LOAD FROM URL
   ============================================================ */

function loadFromUrl(rawUrl) {

    if (!rawUrl) {

        alert(
            "Please enter a Google Drive folder URL."
        );

        return;
    }


    checkInputLink(
        rawUrl,

        function(folder) {

            _folderInfo =
                folder;


            if (
                folder.type ===
                "GoogleDrive"
            ) {

                prepareGFolder(folder);

            } else {

                readyToLoad(
                    folder.url +
                    "data.csv"
                );
            }
        }
    );
}


/* ============================================================
   LABEL SIZE
   ============================================================ */

function changeLabelSize(size) {

    if (
        size === "largeLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "95%"
            );

    } else if (
        size === "mediumLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "85%"
            );

    } else if (
        size === "smallLabel"
    ) {

        d3.selectAll(".label")
            .style(
                "font-size",
                "75%"
            );
    }
}


/* ============================================================
   URL ENCODE
   ============================================================ */

function encodeUrl(url) {

    try {

        return btoa(url);

    } catch (e) {

        return url;
    }
}


/* ============================================================
   URL DECODE
   ============================================================ */

function decodeUrl(encoded) {

    try {

        return atob(encoded);

    } catch (e) {

        try {

            return atob(
                encoded
                    .replace(/_/g, "/")
                    .replace(/-/g, "+") +
                "="
            );

        } catch (error) {

            return "";
        }
    }
}


/* ============================================================
   COPY TO CLIPBOARD
   ============================================================ */

function CopyToClipboard(element) {

    var temp =
        $("<input>");

    $("body")
        .append(temp);

    temp
        .val(
            $(element).text()
        )
        .select();

    document.execCommand("copy");

    temp.remove();
}


/* ============================================================
   BITLY
   ============================================================ */

function makeUrlId(rawUrl, callback) {

    $.ajax({

        type: "POST",

        contentType:
            "application/json",

        url:
            "https://api-ssl.bitly.com/v4/shorten",

        data:
            JSON.stringify({
                long_url: rawUrl
            }),

        headers: {
            Authorization: BitlyKey
        },

        dataType: "json",

        success:
            function(response) {

                if (
                    response &&
                    response.id
                ) {

                    var parts =
                        response.id.split("/");

                    callback(
                        "BL_" +
                        parts[
                            parts.length - 1
                        ]
                    );

                } else {

                    callback(
                        encodeUrl(rawUrl)
                    );
                }
            },

        error:
            function() {

                callback(
                    encodeUrl(rawUrl)
                );
            }
    });
}


/* ============================================================
   BITLY EXPAND
   ============================================================ */

function getUrlID(urlID, callback) {

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
                    "bit.ly/" + urlID
            }),

        headers: {
            Authorization: BitlyKey
        },

        contentType:
            "application/json",

        success:
            function(result) {

                if (
                    result &&
                    result.long_url
                ) {

                    callback(
                        result.long_url
                    );
                }
            },

        error:
            function() {

                console.error(
                    "Bitly expansion failed."
                );
            }
    });
}


/* ============================================================
   DECODE DESIGN EXPLORER URL
   ============================================================ */

function decodeUrlID(rawUrl, callback) {

    var vars =
        getUrlVars(rawUrl);

    var folder =
        vars.GFOLDER;

    var id =
        vars.ID;


    if (
        folder !== undefined
    ) {

        callback(folder);

        return;
    }


    if (
        id !== undefined
    ) {

        if (
            id.indexOf("BL_") === 0
        ) {

            getUrlID(
                id.substring(3),

                function(url) {

                    var values =
                        getUrlVars(url);

                    if (
                        values.ID
                    ) {

                        callback(
                            decodeUrl(
                                values.ID
                            )
                        );
                    }
                }
            );

        } else {

            callback(
                decodeUrl(id)
            );
        }

        return;
    }


    callback(rawUrl);
}
