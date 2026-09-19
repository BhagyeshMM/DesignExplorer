function unloadPageContent() {
    /*
    	// This function removes current contents from the page
    	// Only base HTML objects will remain in the page afterwards
    	// Use this in case you want to load new data to the page
    */

    overwriteInitialGlobalValues();

    d3.select("div.legend").selectAll("*").remove(); // remove legend

    d3.select("#inputSliders").selectAll("*").remove(); //remove sliders
    d3.select("#inputSliders").append("form").attr("class", "sliders"); // append a form

    d3.select("div#graph").selectAll("*").remove(); //remove left side parallel coord graph
    d3.select("div#radarChart").selectAll("*").remove(); //remove right side graph

    d3.select("div#thumbnails-btm_container")
        .select("div#sorting")
        .selectAll("*")
        .remove(); // remove sorting drop-down

    d3.select("div#thumbnails-btm_container")
        .select("div#sorting")
        .text("");

    d3.select("div#thumbnails-btm_container")
        .select("div#thumbnails-btm")
        .selectAll("*")
        .remove(); // remove thumbnail images

    d3.select("div#thumbnails-side_container")
        .select("div#sorting")
        .selectAll("*")
        .remove(); // remove thumbnail images

    d3.select("div#thumbnails-side_container")
        .select("div#sorting")
        .text("");

    d3.select("div#thumbnails-side_container")
        .select("div#thumbnails-side")
        .selectAll("*")
        .remove(); // remove thumbnail images

    d3.select("div#zoomed")
        .selectAll("*")
        .remove(); //remove zoomed image if any

    d3.select("div#viewer3d")
        .selectAll("*")
        .remove(); //remove any object inside 3D viewer
}


function calWidthAndHeight() {

    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
    cleanHeight = windowHeight - 115, // 2
    cleanWidth = windowWidth - 100,
    graphHeight = (cleanHeight / 3) - 24, //remove 22+2 top tool button
    zoomedHeight = (cleanHeight * 2 / 3); //remove 22+2 top tool button

}


function overwriteInitialGlobalValues() {
    /*
    	// This function initiates all the global values for the page
    	// I'm not sure if this is the best practice in javascript (probably it's not)
    	// Let me (github.com/mostaphaRoudsari) know if you know a better solution
    */

    originalData = ""; //csv as it is imported

    cleanedData = []; //all the columns to be used for parallel coordinates

    numericalData = [],
    inputData = []; // columns with input values - to be used for sliders

    outputData = []; // columns with output values - to be used for radar graph

    slidersInfo = []; // {name:'inputName', tickValues : [sorted set of values]},

    currentSliderValues = {}; // collector for values

    allDataCollector = {};

    slidersMapping = {}; // I collect the data for all the input sliders here so I can use it to remap the sliders later

    ids = []; // Here I collect all data based on a unique ID from inputs

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

    firstRating = true; // variable for star rating


    //set up heights of divs ro default
    calWidthAndHeight();


    pcHeight =
        d3.select("#graph")
            .style("height")
            .replace("px", "");


    // hide zoomed area
    d3.selectAll(".zoomed")
        .style("height", "0px");


    // show btm thumbnail
    d3.select("#thumbnails-btm_container")
        .style("height", zoomedHeight + "px");


    // re-set the viewer to 2D
    currentView = "2D";


    // set view toggle to 2D
    d3.select("input#toggleView")
        .property("checked", "true");


    initit3DViewer = true;

    d3.select("#zoomed")
        .classed("hidden", false);

    d3.select("#viewer3d")
        .classed("hidden", true);
}


/* ============================================================
   GOOGLE DRIVE RETURN OBJECT
   ============================================================ */

var _googleReturnObj = {

    csvFiles: {},

    imgFiles: {},

    jsonFiles: {},

    settingFiles: {}

};


/* ============================================================
   GET GOOGLE DRIVE FOLDER ID
   ============================================================ */

function getGFolderID(link) {

    link = String(link || "").trim();

    var match;


    /*
        Standard Google Drive folder URL:

        https://drive.google.com/drive/folders/FOLDER_ID
    */

    match = link.match(
        /\/folders\/([a-zA-Z0-9_-]+)/
    );

    if (match) {
        return match[1];
    }


    /*
        Google Drive URL containing ?id=FOLDER_ID
    */

    match = link.match(
        /[?&]id=([a-zA-Z0-9_-]+)/
    );

    if (match) {
        return match[1];
    }


    /*
        Allow the user to enter the folder ID directly.
    */

    if (
        /^[a-zA-Z0-9_-]{20,}$/.test(link)
    ) {
        return link;
    }


    return "";
}


/* ============================================================
   GOOGLE DRIVE / SERVER LINK DETECTION
   ============================================================ */

function checkInputLink(link, callback) {

    var folderLinkObj = {

        "DE_PW": "",

        "inLink": link,

        "url": "",

        "type": ""

    };


    link = String(link || "").trim();


    /*
        GOOGLE DRIVE
    */

    if (
        link.indexOf("drive.google.com") !== -1
        ||
        /^[a-zA-Z0-9_-]{20,}$/.test(link)
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
            Send the Google Drive folder ID
            to the Google Apps Script proxy.
        */

        folderLinkObj.url =
            GOOGLE_DRIVE_PROXY +
            "?folderId=" +
            encodeURIComponent(folderId);


        folderLinkObj.type =
            "GoogleDrive";

    }


    /*
        USER SERVER LINK
    */

    else {

        if (link.slice(-1) !== "/") {
            link += "/";
        }

        folderLinkObj.url = link;

        folderLinkObj.type =
            "userServerLink";
    }


    callback(folderLinkObj);
}


/* ============================================================
   API / CONFIGURATION
   ============================================================ */

var Gkey =
    "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";


var BitlyKey =
    "52e99e2d788d32ae8ea99007d96917ac4ba50a5a";


/*
    Google Apps Script proxy.

    This is the deployed /exec URL.
*/

var GOOGLE_DRIVE_PROXY =
    "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";


/* ============================================================
   PREPARE GOOGLE DRIVE FOLDER
   ============================================================ */

function prepareGFolder(folderLink) {

    console.log(
        "========================================"
    );

    console.log(
        "Design Explorer: loading Google Drive"
    );

    console.log(
        "Google Drive proxy URL:",
        folderLink.url
    );


    /*
        Reset the global object.

        IMPORTANT:
        Do not use a separate googleReturnObj object here.

        index.html -> makeUrl() directly reads:

        _googleReturnObj.csvFiles
        _googleReturnObj.imgFiles
        _googleReturnObj.jsonFiles
        _googleReturnObj.settingFiles
    */

    _googleReturnObj = {

        csvFiles: {},

        imgFiles: {},

        jsonFiles: {},

        settingFiles: {}

    };


    /*
        Ask the Apps Script proxy for the files.
    */

    d3.json(
        folderLink.url,

        function(data) {

            console.log(
                "Google Drive proxy response:",
                data
            );


            /*
                No response.
            */

            if (!data) {

                alert(
                    "Google Drive loading failed: " +
                    "The proxy returned no data."
                );

                console.error(
                    "Google Drive proxy returned no data."
                );

                return;
            }


            /*
                Error returned by Apps Script.
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
                Make sure the proxy returned files.
            */

            if (!Array.isArray(data.files)) {

                alert(
                    "Google Drive loading failed: " +
                    "The proxy response does not contain a files array."
                );

                console.error(
                    "Invalid Google Drive proxy response:",
                    data
                );

                return;
            }


            console.log(
                "Files returned by Google Drive proxy:",
                data.files.length
            );


            /*
                Process every file.
            */

            data.files.forEach(
                function(item) {

                    if (!item) {
                        return;
                    }


                    var name =
                        String(item.name || "").trim();


                    var lowerName =
                        name.toLowerCase();


                    var fileUrl =
                        String(item.url || "").trim();


                    var mimeType =
                        String(item.mimeType || "")
                            .toLowerCase();


                    /*
                        Skip files without a filename
                        or URL.
                    */

                    if (!name || !fileUrl) {

                        console.warn(
                            "Skipping file with missing name or URL:",
                            item
                        );

                        return;
                    }


                    console.log(
                        "Processing Google Drive file:",
                        name,
                        "=>",
                        fileUrl
                    );


                    /* =================================================
                       CSV
                       ================================================= */

                    if (
                        lowerName.endsWith(".csv")
                    ) {

                        _googleReturnObj
                            .csvFiles[name] =
                            fileUrl;

                    }


                    /* =================================================
                       IMAGE
                       ================================================= */

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


                    /* =================================================
                       JSON
                       ================================================= */

                    else if (

                        mimeType ===
                            "application/json"

                        ||

                        lowerName.endsWith(".json")

                    ) {

                        /*
                            Design Explorer treats files beginning
                            with "setting" as settings files.

                            All other JSON files are 3D model files.
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

                        else {

                            _googleReturnObj
                                .jsonFiles[name] =
                                fileUrl;

                        }

                    }

                }
            );


            /* =========================================================
               DEBUG OUTPUT
               ========================================================= */

            console.log(
                "========================================"
            );

            console.log(
                "Google Drive file map created."
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
                "Image file count:",
                Object.keys(
                    _googleReturnObj.imgFiles
                ).length
            );

            console.log(
                "3D JSON file count:",
                Object.keys(
                    _googleReturnObj.jsonFiles
                ).length
            );

            console.log(
                "CSV file count:",
                Object.keys(
                    _googleReturnObj.csvFiles
                ).length
            );

            console.log(
                "Setting file count:",
                Object.keys(
                    _googleReturnObj.settingFiles
                ).length
            );

            console.log(
                "========================================"
            );


            /* =========================================================
               FIND data.csv
               ========================================================= */

            var csvFile = null;


            /*
                First try the exact filename.
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
                If capitalization differs,
                search case-insensitively.
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
                                    .csvFiles[filename];

                            return true;
                        }

                        return false;

                    }
                );

            }


            /*
                Stop if data.csv does not exist.
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
                Make sure _folderInfo points to the
                Google Drive object.

                makeUrl() in index.html uses _folderInfo.
            */

            _folderInfo = folderLink;


            /*
                Start loading Design Explorer data.
            */

            readyToLoad(csvFile);

        }
    );
}


/* ============================================================
   GET URL VARIABLES
   ============================================================

   decodeUrlID() calls getUrlVars().

   This function was missing from the supplied modified file.
   ============================================================ */

function getUrlVars(url) {

    var vars = {};

    url = String(
        url || window.location.href
    );


    /*
        Get the query-string portion.
    */

    var query =
        url.split("?")[1];


    if (!query) {
        return vars;
    }


    /*
        Remove URL fragment.
    */

    query =
        query.split("#")[0];


    /*
        Parse each parameter.
    */

    query.split("&").forEach(
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
                    pieces.slice(1).join("=") || ""
                );


            if (key) {

                vars[key] = value;

            }

        }
    );


    return vars;
}


/* ============================================================
   LOAD GOOGLE ID / URL
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

            /*
                Set global folder information.

                makeUrl() in index.html uses this.
            */

            _folderInfo = d;


            if (
                d.type ===
                "userServerLink"
            ) {

                /*
                    User-hosted server.

                    Load data.csv directly.
                */

                readyToLoad(
                    d.url +
                    "data.csv"
                );

            }

            else {

                /*
                    Google Drive.

                    Load through Apps Script proxy.
                */

                prepareGFolder(d);

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

    // var link = btoa(url).slice(0, -1).replace('/','_').replace('+','-');

    var link =
        btoa(url);

    return link;
}


/* ============================================================
   DECODE URL
   ============================================================ */

function decodeUrl(encodedString) {

    // var url = atob(encodedString.replace('_','/').replace('-','+')+"=");

    var url = "";

    try {

        url =
            atob(encodedString);

    }

    catch(err) {

        console.log(
            err.message +
            " But fixed:>"
        );


        url =
            atob(
                encodedString
                    .replace("_", "/")
                    .replace("-", "+") +
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
   CREATE URL ID
   ============================================================ */

function makeUrlId(rawUrl, callback) {

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
                "long_url": longUrl
            }),

        headers: {

            "Authorization":
                BitlyKey,

            "Content-Type":
                "application/json"

        },

        error:
            function(e) {

                /*
                    If Bitly fails,
                    fall back to encoded URL.
                */

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

                var UrlID = "";


                if (
                    response.id != null
                ) {

                    /*
                        response.id example:

                        https://bit.ly/abc123
                    */

                    UrlID =
                        response.id.split("/");


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
   GET URL ID
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

function decodeUrlID(rawUrl, callback) {

    var serverFolderLink = "";


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
        GfolderORUrl !== undefined
    ) {

        /*
            If GFOLDER contains only an ID,
            convert it into a Google Drive folder URL.
        */

        if (
            GfolderORUrl.search("/") == -1
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
       ENCODED ID FORMAT
       ========================================================= */

    else if (
        DEID !== undefined
    ) {

        var linkID =
            DEID;


        /*
            Old Google URL shortener format.
        */

        if (
            linkID.length === 6
        ) {

            d3.json(

                "https://www.googleapis.com/urlshortener/v1/url?key=" +
                Gkey +
                "&shortUrl=http://goo.gl/" +
                linkID,

                function(d) {

                    if (
                        !d ||
                        !d.longUrl
                    ) {

                        console.error(
                            "Google URL shortener returned no longUrl:",
                            d
                        );

                        return;
                    }


                    var GID =
                        getUrlVars(
                            d.longUrl
                        ).ID;


                    if (
                        !GID
                    ) {

                        console.error(
                            "Could not extract ID from short URL:",
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
            linkID.startsWith("BL_")
        ) {

            getUrlID(

                linkID.replace(
                    "BL_",
                    ""
                ),

                function(d) {

                    if (!d) {

                        console.error(
                            "Bitly returned no URL."
                        );

                        return;
                    }


                    var GID =
                        getUrlVars(
                            d
                        ).ID;


                    if (!GID) {

                        console.error(
                            "Could not extract ID from Bitly URL:",
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
            Normal encoded URL.
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


    /* =========================================================
       NO RECOGNIZED URL PARAMETERS
       ========================================================= */

    else {

        console.warn(
            "No GFOLDER or ID parameter found in URL:",
            rawUrl
        );

    }
}
