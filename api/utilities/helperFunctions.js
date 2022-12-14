/** UTILITIES FUNCTIONS STARTS HERE **/
var successCode = "200";
var errorCode = "204";

var datetime = new Date();
var created_at = datetime.toISOString();

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');

var sql = allQuery["loginRegisterQry"];

var GOOGLE_API_KEY = "AIzaSyBVFdl8vcjkaHtCc69pOyqMW3SrbaRBXjI";

var atob = require('atob');
var btoa = require('btoa');
var cryptoPassword = "petro$m@rt";

// Includes crypto module 
const crypto = require('crypto');

// Defining algorithm 
const algorithm = 'aes-128-cbc';

let secret = "Petrosmart@1"


let helperFunctions = {

    cryptoEncrypt(text) {
        var mykey = crypto.createCipher(algorithm, secret);
        var mystr = mykey.update(text, 'utf8', 'hex')
        mystr += mykey.final('hex');

        return mystr;
    },

    cryptoDecrypt(text) {
        var mykey = crypto.createDecipher(algorithm, secret);
        var mystr = mykey.update(text, 'hex', 'utf8')
        mystr += mykey.final('utf8');

        return mystr;
    },

    randomString() {
        var length = 20;
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    userIdString() {
        var length = 15;
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    otpGenerate() {
        var length = 6;
        var chars = '0123456789';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    referenceGenerate() {
        var length = 10;
        var chars = '0123456789';
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    },

    generateInvoiceNumber() {
        var invNo = "P2/E/" + "" + Math.floor((Math.random() * 10000) + 1)
        return invNo;
    },

    //TO SENTENCE CASE
    toTitleCase(str) {
        if (str == "" || str == undefined) {
            return str
        } else {
            return str.replace(
                /\w\S*/g,
                function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }
    },

    //RETURN BOOLEAN VALUES
    getBoolean(value) {
        switch (value) {
            case true:
            case "true":
            case 1:
            case "1":
            case "on":
            case "yes":
                return true;
            default:
                return false;
        }
    },

    // thousand seperators
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    //round to 2 decimal place
    roundToTwo(num) {
        return +(Math.round(num + "e+2") + "e-2");
    },

    utoa(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },

    atou(str) {
        return decodeURIComponent(escape(atob(str)));
    },

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //:::                                                                         :::
    //:::  This routine calculates the distance between two points (given the     :::
    //:::  latitude/longitude of those points). It is being used to calculate     :::
    //:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
    //:::                                                                         :::
    //:::  Definitions:                                                           :::
    //:::    South latitudes are negative, east longitudes are positive           :::
    //:::                                                                         :::
    //:::  Passed to function:                                                    :::
    //:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
    //:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
    //:::    unit = the unit you desire for results                               :::
    //:::           where: 'M' is statute miles (default)                         :::
    //:::                  'K' is kilometers                                      :::
    //:::                  'N' is nautical miles                                  :::
    //:::                                                                         :::
    //:::                                                                         :::
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    distance(lat1, lon1, lat2, lon2, unit) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        else {
            var radlat1 = Math.PI * lat1 / 180;
            var radlat2 = Math.PI * lat2 / 180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta / 180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit == "K") { dist = dist * 1.609344 }
            if (unit == "N") { dist = dist * 0.8684 }
            return dist;
        }
    },

    // GET_USER_INFO_BY_ID(params) {
    //     console.log("paaaraammmsss--->>>", params)
    //     let userData = [];
    //     db.query(sql.userByUpsaId, params, function (err, result) {
    //         if (err) {
    //             return userData;
    //         } else {
    //             if (result.length == 0) {
    //                 return userData;
    //             }
    //             else {
    //                 console.log("User data retrived successfully");
    //                 return result
    //             }
    //         }
    //     });
    // },

    GET_CITY_FROM_GOOGLE_API(coordinates) {

        //here we are suppose to send the OTP to the driver by SMS
        //sending OTP VIA SMS to DRIVER 
        var request = require('request');
        
        var options = {
            'method': 'GET',
            'url': "https://maps.googleapis.com/maps/api/geocode/json?latlng="+coordinates+"&sensor=true&key="+GOOGLE_API_KEY,
            'headers': {
                
            }
        };
        request(options, function (error, response) {
            if (error) {
                console.log("error occured while getting city name from Google pay --->", error)
                // throw new Error(error);
                return false;
            }
            console.log("Google API get city response-->>> ", response.body);
            var responseBody = response.body;

        });

    },

}

module.exports = helperFunctions;