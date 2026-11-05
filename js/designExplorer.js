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

    d3.select("div#thumbnails-btm_container").select("div#sorting").selectAll("*").remove(); // remove sorting drop-down
    d3.select("div#thumbnails-btm_container").select("div#sorting").text("");
    d3.select("div#thumbnails-btm_container").select("div#thumbnails-btm").selectAll("*").remove(); // remove thumbnail images

    d3.select("div#thumbnails-side_container").select("div#sorting").selectAll("*").remove(); // remove thumbnail images
    d3.select("div#thumbnails-side_container").select("div#sorting").text("");
    d3.select("div#thumbnails-side_container").select("div#thumbnails-side").selectAll("*").remove(); // remove thumbnail images

    d3.select("div#zoomed").selectAll("*").remove(); //remove zoomed image if any
    d3.select("div#viewer3d").selectAll("*").remove(); //remove any object inside 3D viewer

}

function calWidthAndHeight() {
    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,
    cleanHeight = windowHeight - 115, // 2
    cleanWidth = windowWidth - 100,
    graphHeight = (cleanHeight / 3)-24, //remove 22+2 top tool button
    zoomedHeight = (cleanHeight*2 / 3); //remove 22+2 top tool button

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
	googleFolderLink="";

    inputDataKeys =[];
    outputDataKeys =[];
    imageLinkKeys = [];


    _userSetting = {
        studyInfo: {
            name:"",
            date:""
        },
        dimScales:{},
        dimTicks:{},
        dimMark:{}
    };

    rcheight = height = d3.select("#graph").style("height").replace("px", "");

    selectedDataFormatted = [];

    firstRating = true; // variable for star rating

    //set up heights of divs ro default
    calWidthAndHeight();

    pcHeight = d3.select("#graph").style("height").replace("px", "");
    // hide zoomed area
    d3.selectAll(".zoomed").style("height", "0px");
    // show btm thumbnail
    d3.select("#thumbnails-btm_container").style("height", zoomedHeight + "px");
    

    // re-set the viewer to 2D
    currentView = "2D";
    // set view toggle to 2D
    d3.select("input#toggleView").property("checked", "true");

    initit3DViewer = true;
    d3.select("#zoomed").classed("hidden", false);
    d3.select("#viewer3d").classed("hidden", true);
}
var _googleReturnObj = {

    csvFiles: {},

    imgFiles: {},

    jsonFiles: {},

    settingFiles: {}

};
function getGFolderID(link) {

    var m = String(link || "")
        .match(/\/folders\/([a-zA-Z0-9_-]+)/);

    if (m) {
        return m[1];
    }

    m = String(link || "")
        .match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (m) {
        return m[1];
    }

    if (
        /^[a-zA-Z0-9_-]{20,}$/.test(
            String(link || "")
        )
    ) {
        return link;
    }

    return "";
}


function checkInputLink(link, callback) {

    var folderLinkObj = {

        "DE_PW": "",

        "inLink": link,

        "url": "",

        "type": ""

    };


    // GOOGLE DRIVE
    if (
        String(link).indexOf(
            "drive.google.com"
        ) !== -1
        ||
        /^[a-zA-Z0-9_-]{20,}$/.test(
            String(link || "")
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


        folderLinkObj.url =
            GOOGLE_DRIVE_PROXY +
            "?folderId=" +
            encodeURIComponent(folderId);


        folderLinkObj.type =
            "GoogleDrive";


    }

    // SERVER LINK
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
/*
 * No API keys live in this file.
 * Drive folders are read through a Google Apps Script web app (see drive-proxy.gs):
 *   GET <proxy>?folderId=ID  ->  { files: [ { name, mimeType, url } ] }
 */
var GOOGLE_DRIVE_PROXY = "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";

function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// fetch with 3 tries (rate limits / hiccups) and errors that name the file
function fetchWithRetry(url, asJson, label) {
    var attempt = 0;
    function go() {
        attempt++;
        return fetch(url).then(function (r) {
            if (r.ok) { return asJson ? r.json() : r.text(); }
            if ((r.status === 429 || r.status >= 500) && attempt < 3) { return wait(600 * attempt).then(go); }
            throw new Error(label + ": HTTP " + r.status);
        }, function (e) {
            if (attempt < 3) { return wait(600 * attempt).then(go); }
            throw new Error(label + ": network/CORS error (" + e.message + ")");
        });
    }
    return go();
}

// lookups by file name also work with different letter case or without the extension
function tolerantMap(map) {
    var index = {};
    Object.keys(map).forEach(function (n) {
        var l = n.toLowerCase(), b = l.replace(/\.[^.]+$/, "");
        index[l] = map[n];
        if (!(b in index)) { index[b] = map[n]; }
    });
    if (typeof Proxy === "undefined") { return map; }
    return new Proxy(map, {
        get: function (t, k) {
            if (typeof k !== "string" || k in t) { return t[k]; }
            var l = k.toLowerCase();
            return index[l] !== undefined ? index[l] : index[l.replace(/\.[^.]+$/, "")];
        }
    });
}

function prepareGFolder(folderLink) {

    var maps = { csvFiles: {}, imgFiles: {}, jsonFiles: {}, settingFiles: {} };

    fetchWithRetry(folderLink.url, true, "Google Drive folder listing")
        .then(function (data) {

            if (!data || data.error) {
                throw new Error(data && data.error ? data.error : "Unknown error");
            }

            (data.files || []).forEach(function (item) {
                var name = item.name || "";
                var lower = name.toLowerCase();
                var fileUrl = item.url;

                if (lower.endsWith(".csv")) {
                    maps.csvFiles[name] = fileUrl;

                } else if ((item.mimeType || "").indexOf("image/") === 0 ||
                    /\.(png|jpg|jpeg|gif|webp)$/i.test(name)) {
                    maps.imgFiles[name] = fileUrl;

                } else if ((item.mimeType || "") === "application/json" || lower.endsWith(".json")) {
                    if (lower.indexOf("setting") === 0) {
                        maps.settingFiles[name] = fileUrl;
                    } else {
                        maps.jsonFiles[name] = fileUrl;
                    }
                }
            });

            var csvName = maps.csvFiles["data.csv"] ? "data.csv" : Object.keys(maps.csvFiles)[0];
            if (!csvName) {
                throw new Error("Could not find data.csv in the Google Drive folder (" + (data.files || []).length + " files listed).");
            }

            maps.imgFiles = tolerantMap(maps.imgFiles);
            maps.jsonFiles = tolerantMap(maps.jsonFiles);
            window.googleReturnObj = maps;
            _googleReturnObj = maps;

            return fetchWithRetry(maps.csvFiles[csvName], false, csvName);
        })
        .then(function (csvText) {
            // hand the cleaned csv to the viewer as a local blob (drops a UTF-8 BOM that breaks the first column name)
            var blob = new Blob([csvText.replace(/^\uFEFF/, "")], { type: "text/csv" });
            readyToLoad(URL.createObjectURL(blob));
        })
        .catch(function (e) {
            console.error(e);
            alert("Google Drive loading failed: " + e.message);
        });
}


function MP_getGoogleIDandLoad(dataMethod) {
    var serverFolderLink;
    
    document.getElementById('csv-file').value = "";

    if (dataMethod === "URL") {
        
        document.getElementById("folderLink").value = "";

        var inUrl = window.location.href;
        decodeUrlID(
            inUrl, 
            function(d){
                loadFromUrl(d);
            }
        );


    } else {
        serverFolderLink = document.getElementById("folderLink").value;
        loadFromUrl(serverFolderLink);
    }

    

}

function loadFromUrl(rawUrl) {

    checkInputLink(rawUrl, function (d) {
        _folderInfo = d; //set global foler obj

        if (d.type === "userServerLink") {
            //this is a user's server link, and load csv directly
            readyToLoad(d.url + "data.csv");
        }else {
            //this is from Google or MS
            prepareGFolder(d);
        }

        //console.log(link);
    })
}

function changeLabelSize(size) {
    if (size == "largeLabel") {
        d3.selectAll(".label")
            .style("font-size", "95%");
    } else if (size == "mediumLabel") {
        d3.selectAll(".label")
            .style("font-size", "85%");
    } else if (size == "smallLabel") {
        d3.selectAll(".label")
            .style("font-size", "75%");
    }
}

function encodeUrl(url) {
    // url-safe base64 without padding, so the id survives inside ?ID=...
    return btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeUrl(encodedString) {
    // accepts old (plain base64) and new (url-safe) ids
    var s = String(encodedString).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) { s += "="; }
    try {
        return atob(s);
    } catch (err) {
        console.log("Could not decode the study id: " + err.message);
        return "";
    }
}

function CopyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

// The Bitly / goo.gl shorteners needed secret tokens in browser code, so static links now carry the folder itself.
function makeUrlId(rawUrl, callback) {
    callback(encodeUrl(rawUrl));
}

function decodeUrlID(rawUrl, callback) {
    var serverFolderLink="";
    var urlVars = getUrlVars(rawUrl);
    var GfolderORUrl = urlVars.GFOLDER;
    var DEID = urlVars.ID;

    //old GFOLDER
    if (GfolderORUrl !== undefined) {

        if (GfolderORUrl.search("/") == -1) {
            //GfolderORUrl is google folder ID
            serverFolderLink = "https://drive.google.com/drive/folders/" + GfolderORUrl;
        } else {
            serverFolderLink = GfolderORUrl;
        }

        callback(serverFolderLink);

    } else if(DEID !== undefined) {

        //linkID = rawUrl.split("/");
        //linkID = linkID[linkID.length - 1];
        linkID = DEID;
        //console.log(linkID)
        
        if (linkID.length === 6) {
            alert("This short link used the discontinued goo.gl service and can no longer be opened.\nPlease use a link with ?GFOLDER=<Google Drive folder ID>.");
        } else if (linkID.startsWith("BL_")) {
            alert("Bitly short links are no longer resolved by this page.\nPlease use the full link or ?GFOLDER=<Google Drive folder ID>.");
        } else {
            serverFolderLink = decodeUrl(linkID);
            callback(serverFolderLink);
        }
        

    }else {

    }


}
