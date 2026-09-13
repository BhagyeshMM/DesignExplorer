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
var Gkey = "AIzaSyCSrF08UMawxKIb0m4JsA1mYE5NMmP36bY";
var BitlyKey = "52e99e2d788d32ae8ea99007d96917ac4ba50a5a";
var GOOGLE_DRIVE_PROXY = "https://script.google.com/macros/s/AKfycbxEruF0sKiO2G1l4VeKf2CGpfruiTg6JapvNdShx2qF0zt4UyoZeld1wBD08CuORsbl/exec";

function prepareGFolder(folderLink) {

    googleReturnObj = {

        csvFiles: {},

        imgFiles: {},

        jsonFiles: {},

        settingFiles: {}

    };


    d3.json(
        folderLink.url,
        function(data) {


            if (!data || data.error) {

                var msg =
                    data && data.error
                        ? data.error
                        : "Unknown error";


                alert(
                    "Google Drive loading failed: " +
                    msg
                );

                return;
            }


            (data.files || [])
                .forEach(function(item) {

                    var name =
                        item.name || "";

                    var lower =
                        name.toLowerCase();

                    var fileUrl =
                        item.url;


                    // CSV
                    if (
                        lower.endsWith(".csv")
                    ) {

                        googleReturnObj
                            .csvFiles[name] =
                            fileUrl;
                    }


                    // IMAGE
                    else if (

                        (item.mimeType || "")
                            .indexOf("image/") === 0

                        ||

                        /\.(png|jpg|jpeg|gif|webp)$/i
                            .test(name)

                    ) {

                        googleReturnObj
                            .imgFiles[name] =
                            fileUrl;
                    }


                    // JSON
                    else if (

                        (item.mimeType || "") ===
                            "application/json"

                        ||

                        lower.endsWith(".json")

                    ) {

                        if (
                            lower.indexOf(
                                "setting"
                            ) === 0
                        ) {

                            googleReturnObj
                                .settingFiles[name] =
                                fileUrl;

                        } else {

                            googleReturnObj
                                .jsonFiles[name] =
                                fileUrl;
                        }
                    }

                });


            _googleReturnObj =
                googleReturnObj;


            var csvFile =
                googleReturnObj
                    .csvFiles["data.csv"];


            if (!csvFile) {

                alert(
                    "Could not find data.csv " +
                    "in the Google Drive folder."
                );

                return;
            }


            readyToLoad(csvFile);

        }
    );
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
    // var link = btoa(url).slice(0, -1).replace('/','_').replace('+','-');
    var link = btoa(url);
    return link;
}

function decodeUrl(encodedString) {
    // var url = atob(encodedString.replace('_','/').replace('-','+')+"=");
    var url = "";
    try{
        url = atob(encodedString);
    }catch(err) {
        console.log(err.message+" But fixed:>");
        url = atob(encodedString.replace('_','/').replace('-','+')+"=");
    }
    
    return url;
}

function CopyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

 function makeUrlId(rawUrl,callback) {
     var longUrl=rawUrl;

     $.ajax({
          type: 'POST',
          contentType: 'application/json',
          url: "https://api-ssl.bitly.com/v4/shorten",
          data: JSON.stringify({
            "long_url": longUrl
        }),
          headers: {
            'Authorization': BitlyKey,
            'Content-Type':'application/json'
        },
          error: function(e) {
            callback(encodeUrl(longUrl));
          },
          dataType: 'json',
          success: function(response) {
            var UrlID ="";
            if(response.id != null)
            {
                //response.id:  https://goo.gl/bMOO
                UrlID = response.id.split("/");
                UrlID = UrlID[UrlID.length-1];  //UrlID: bMOO
                
            }
            callback("BL_"+UrlID);
        	}
        });  
 }

function getUrlID(urlID,callback) {
    $.ajax({
        url: "https://api-ssl.bitly.com/v4/expand",
        type: 'POST',
        dataType: 'json',
        data:JSON.stringify({
            "bitlink_id": "bit.ly/"+urlID
        }),
        headers: {
            'Authorization': BitlyKey
        },
        contentType: 'application/json',
        success: function (result) {
            callback(result.long_url);
        },
        error: function (error) {
            
        }
    });
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
            d3.json("https://www.googleapis.com/urlshortener/v1/url?key="+ Gkey+"&shortUrl=http://goo.gl/"+linkID, 
                function(d){
                    var GID = (getUrlVars(d.longUrl).ID);
                    serverFolderLink = decodeUrl(GID);
                    callback(serverFolderLink);
                }
            )
        }else if(linkID.startsWith("BL_")){
            getUrlID(linkID.replace("BL_",""), function (d) {
                var GID = (getUrlVars(d).ID);
                serverFolderLink = decodeUrl(GID);
                callback(serverFolderLink);
            })
        } else {
            serverFolderLink = decodeUrl(linkID);
            callback(serverFolderLink);
        }
        

    }else {

    }


}
