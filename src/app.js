var UI = require('ui');
//var Vector2 = require('vector2');
// Initial variables above

// *  **************************************************************************************
// *  Salesforce1 Pebble Dashbaord Sample App
// *  See documentation and disclaimer that are on GitHub before use [Need to grab link]
// *  **************************************************************************************
      var sf_instance = "https://na00.salesforce.com";   //The is what the Org ID or Salesforce Instance will look like
      var sf_owner_id = "005o0000000gk5FAAQ";            //this is the UUID of the Salesforce user (you)
      var sf_known = false;                              // used to track if the connection to SF is established
      // these are the two arrays to store all the values for the reports 
      var reportName = ["Initial","Retrevial","Yet"];
      var reportValue = ["Data","Not","Complete"];
      //var menuItems = [];
// *  ***************************************************************************************
// *  ***************************************************************************************

//Set up a global Access Token to store the response from Salesforce - so it is available easily
//If you are debugging your code, use the below as a sample fo what the token should look like
var sf_access_token = "BEARER 00DG0000000jBCR!ARQ___sample_access_token_form_will_be_long___Z9Xx4VGP4DaN70_DanHca_on_GitHUB_susPIOEJJQKpVHEbZ1Ip";

// Show splash screen while waiting for data
// Create a simple Card
var splashCard = new UI.Card({
  title: 'SFDC1',
  subtitle: 'Welcome.',
  body: 'Loading.'
});

splashCard.show();

//============================================================================================= REST Requests
// This is the function to send the REST request to Salesforce
//============================================================================================= REST Requests
var restRequest = function(restRqst, respAction, restOutput) {
  console.log("==========================REST Request==========================" );

  //Sample REST queries that could be used to retrieve data
  //query?q=SELECT+Id,Description+FROM+Report+WHERE+DeveloperName='Pebble_Watch_Summary_1'
  //query?q=SELECT+Id+FROM+User
  //analytics/reports/00Oi0000004hHWoEAM?includeDetails=false
  var returnValue = 0;
  var url = sf_instance.concat("/services/data/v30.0/");
    
  try {
    url = url.concat(restRqst);
    console.log("Request URL: " + url);
    var csf = new XMLHttpRequest();
    csf.open("GET", url, true); //Switched from synchronous to asynchronus request, moved send above handler.
    csf.setRequestHeader('Authorization', sf_access_token);
    csf.setRequestHeader('Content-Type', 'application/json');
    csf.send();  //Sends the request to Salesforce.

    //----------------------------------------------------------------------------------------- REST Response Handler
    // This is the function that will be called when the REST response is receive from Salesforce
    // It is responsible for parsing the data and storing it locally on the phone
    csf.onreadystatechange = function () {
      // Now check to see if the requst has completed 'readyState' is 4
      if (csf.readyState == 4) {
        // console.log(csf.responseText); // Debugging the full response
        // Check the status for the request; '0' is connection failure; '200' is successful data
        switch (csf.status) {
          case 0:  // request is complete but unable to connect to Salesforce
            reportName[restOutput] = "LogIn to SF1 on Phone";
            reportValue[restOutput] = "Connection Failed";
            break;
          case 200: // request is complete and data was received.
            // Parse the JSON response
            var JSONresponse = JSON.parse(csf.responseText);
            switch (respAction) {
              case 'ReportName': 
                // There should only exactly one report return [0], otherwise there is an issue
                if (JSONresponse.totalSize == 1) {
                  //Store the data but make sure it will fit on the Pebble sceen
                  try {
                  var tempName = JSONresponse.records[0].Description;
                  reportName[restOutput] = tempName.substring(0,30);
                  var reportID = JSONresponse.records[0].Id;
                  var urd = "analytics/reports/"+reportID+"?includeDetails=false";
                  console.log(">>>>>>>>>>>>>>>>>>>>>>>Search Report Data<<<<<<<<<<<<<<<<<<<<<<<");
                  restRequest(urd, "ReportData", restOutput);
                  }
                  catch(err) {
                    reportName[restOutput] = "Invalid Total or Desc.";
                    reportValue[restOutput] = "Report Error";
                  }
                } else {
                  reportName[restOutput] = "Report Missing";
                  reportValue[restOutput] = "Unknown";
                }
                break;
              case 'ReportData': 
                // Pull the data from the report that is stored in the first [0] 'Total' element
                var reportSUM = JSONresponse.factMap["T!T"].aggregates[0].label;
                // Get the data but make sure it will fit on the Pebble screen
                reportValue[restOutput] = reportSUM.substring(0,30);
                console.log("ReportName for "+restOutput+" is "+reportName[restOutput]);
                console.log("ReportData for "+restOutput+" is "+reportValue[restOutput]);
                break;
              default: console.log("UNKNOWN respAction");
                reportName[restOutput] = "Check your phone";
                reportValue[restOutput] = "Unable to connect";
            } //End of Switch for respAction            
            break;
          case 403: //HTTP Forbidden
            reportName[restOutput] = "The REST API is not enabled for this Organization.";
            reportValue[restOutput] = "403 Forbidden";
            break;
          default: console.log("csf.status message not reconized.");
            console.log(csf.responseText); // Debugging the full response
            reportName[restOutput] = "Check your phone";
            reportValue[restOutput] = "No data received";
          } //End of Switch Case for csf.status
        } //End of ReadyState = 4 if block  
      }; //End of the function call that is tracking the csf.onreadystatechange
    //----------------------------------------------------------------------------------------- REST Response Handler    
  
  
  console.log("__________________________REST Complete________________________" );
  }
  catch(err) {
      reportName[restOutput] = "LogIn to SF1 on Phone";
      reportValue[restOutput] = "Connection Failed";
  }
  return returnValue;
};


// Tried to update this to use a for loop to populate the arrays for reportName and reportValue, collected in the menuItems array
//============================================================================================= App Message
// Review the incoming message, Only interested in knowing which Dashboard to reload
//============================================================================================= App Message
function reportUpdate(count) {
  for(var i = 0; i < count; i++) {
    // Define the REST command to send to Salesforce1
    var url = "query/?q=SELECT+Id,Description+FROM+Report+WHERE+DeveloperName='Pebble_Watch_Summary_"+i+"'";
    //var url = "query/?explain=SELECT+Id,Description+FROM+Report+WHERE+DeveloperName='Pebble_Watch_Summary_"+i+"'";
    console.log(">>>>>>>>>>>>>>>>>>>>>>Find the Report Name<<<<<<<<<<<<<<<<<<<<<<");
    console.log("Dashboard ID: "+i);
    restRequest(url, "ReportName", i);
  }
}

var menuBuilder = function(count) {
  var items = [];
  for(var i = 0; i < count; i++) {
    var title = reportName[i];
    var value = reportValue[i];
    
    items.push({
      title:title,
      subtitle:value
    });
  }
    //Return the array
    return items;
};

var reportsMenu = function () {
  //var menuItems = reports(3);
  var menuItems = menuBuilder(3);
  var menu = new UI.Menu({
    sections: [{
      title: 'Capacity and Hours',
      items: menuItems
    }]
  });
  menu.on('select', function(e) {
    splashCard.show();
    menu.hide();
    reportUpdate(3);
    reportsMenu(); 
  });
  menu.show();
  splashCard.hide();
};


//============================================================================================= App Message
//============================================================================================= Configuration Screen
// Here is the code that manages the Salesforce Login and OAuth process
//============================================================================================= Configuration Screen
Pebble.addEventListener("showConfiguration", function() {
  // The client_id is common for all Salesforce Orgs so this line does NOT need to change
  // The redirect_uri is how the Salesforce OAuth page knows to send control back to the Pebble App on the phone
  var url = "https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=3MVG9xOCXq4ID1uFyJvkJNKu5Anux281NUkPc5vR4RK.Nag9SkojiNS0us2fUJgTLVeSFwhFsqvCYNi08uEtG&redirect_uri=pebblejs%3A%2F%2Fclose";
  // This opens the Salesforce OAuth page on the phone then continues processing.
  // The response from the OAuth page is handled by 'webviewclose'
  Pebble.openURL(url);
});

//============================================================================================= Configuration Screen
//============================================================================================= OAuth Response
// Here is the code that manages the Salesforce Login and OAuth process
//============================================================================================= OAuth Response
Pebble.addEventListener("webviewclosed", function(e) {
  // The Salesforce OAuth window is closed; now parse the response string, 
  // there may be other parse options but this works and is flexible.
  try {
    var oauthlist = e.response.split("&");
    var accesslist = oauthlist[0].split("=");
    sf_access_token = accesslist[1];
    // Now create the structure for all future calls ... needs to start with 'Bearer'
    var t_bearer = "Bearer ";
    sf_access_token = t_bearer.concat(sf_access_token);

    // The OAuth response also contains other valuable details to log, capture it now
    // The instance name is needed to direct all api connections to the right SF URL
    var instancelist = oauthlist[2].split("=");
    sf_instance = instancelist[1];
  
    // The Users' UUID is good to have but not used in this sample code.
    // You will need if you are creating records or want to get more details about the user.
    // Additionally you could get the refresh token to extend the connection if the token expires
    var ownerlist = oauthlist[3].split("/");
    sf_owner_id = ownerlist[5];
    console.log("Login Done.");
    sf_known = true;
    // Use 'localStorage' to make the data persistent so you can leave the app and return 
    // without login in every time.
    localStorage.saved = true;
    localStorage.token = sf_access_token;
    localStorage.owner = sf_owner_id;
    localStorage.instance = sf_instance;
  
    // It was a successful login so tell the watch to start the load process for first dashboard
    reportsMenu();
  }
  catch(err) {
    console.log("NOT LOGGED ON - Canceled or invalid OAuth result"); 
    sf_known = false;
    sf_access_token = "no access token - please log in";
    sf_owner_id = "no user identified";
    sf_instance = "not connected";
    localStorage.saved = false;
    localStorage.token = sf_access_token;
    localStorage.owner = sf_owner_id;
    localStorage.instance = sf_instance;
  }
});
//============================================================================================= OAuth Response

//============================================================================================= REST Requests
//============================================================================================= Ready
// This is the function to listen to the first initialization event from the Pebble watch
//============================================================================================= Ready
var ready = function() {
  console.log("SF1 PB: Initialized");
  sf_known = localStorage.saved;
  if (sf_known=='true') {
    console.log("Token from memory");
    sf_access_token = localStorage.token;
    sf_owner_id = localStorage.owner;
    sf_instance = localStorage.instance;
    splashCard.body('Login Complete');
    reportUpdate(3); // Update this to run a query to count number of Pebble_Watch_Summary_ reports available.
  } else {
    console.log("No Token");
    splashCard.body('Check OAuth in Pebble App > Settings');
    //reportName = ["Log In","on your phone","in SETTINGS"];
    //reportValue = ["to Salesforce1","to manage OAuth","in the Pebble App"];
    //reportsMenu();
    //var url = "https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=3MVG9xOCXq4ID1uFyJvkJNKu5Anux281NUkPc5vR4RK.Nag9SkojiNS0us2fUJgTLVeSFwhFsqvCYNi08uEtG&redirect_uri=pebblejs%3A%2F%2Fclose";
    //Pebble.openURL(url);
  }
};
//============================================================================================= Ready

splashCard.on('click', 'select', function(e) {
  reportsMenu();
});

ready();
