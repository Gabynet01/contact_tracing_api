'use strict';

var successCode = "200";
var pendingCode = "201";
var errorCode = "204";

//radius to search contacts traced in Kilometers
var radiusKM = 0.1;

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');
var sql = allQuery["loginRegisterQry"];
var sqlBooking = allQuery["bookingQry"];
var helperFunctions = require('../utilities/helperFunctions');

//logger
var util = require('util');


/**
 * Check user bookings by User ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.check_user_booking = function (req, res) {
    // create an array of errors to return
    var errors = []

    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId
    }

    // lets check if the userID exists
    var params = [data.userId]
    db.query(sql.userByUpsaId, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "This UPSA ID is not found, kindly signup"
            })
            return;
        }

        else {
            //get bookings for this user
            var params = userData[0]["id"];
            db.query(sqlBooking.pendingBooking, params, function (err, pendingBookingData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (pendingBookingData.length == 0) {
                    //since no pending booking, send 201 so that app can show calendar for user to book again
                    res.json({
                        "code": pendingCode,
                        "message": "No pending bookings. Kindly book",
                    })
                    return;

                } else {
                    res.json({
                        "code": successCode,
                        "message": "You have an appointment awaiting your visit to the school clinic.",
                        "data": pendingBookingData
                    })
                    return;
                }
            });
        }

    });
}

/**
 * Register bookings by User ID and date selected
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.register_booking = function (req, res) {
    // create an array of errors to return
    var errors = []

    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }

    if (!req.body.selectedDate) {
        errors.push("No selected date specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId,
        selectedDate: req.body.selectedDate
    }


    // lets check if the userID exists
    var params = [data.userId]
    db.query(sql.userByUpsaId, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "This UPSA ID is not found, kindly signup"
            })
            return;
        }

        else {

            //get bookings for this user
            var params = userData[0]["id"];
            db.query(sqlBooking.pendingBooking, params, function (err, pendingBookingData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (pendingBookingData.length == 0) {
                    //since user ID exist, lets go and register the booking
                    var datetime = new Date(data.selectedDate);
                    var booked_date = datetime.toISOString();

                    var otp = helperFunctions.otpGenerate();
                    var params = [userData[0]["id"], booked_date, "NO", otp]

                    db.query(sqlBooking.registerBooking, params, function (err, result) {

                        if (err) {
                            console.log("errr", err)
                            console.log("userId", data.userId)
                            res.status(400).json({ "error": err.message })
                            return;
                        } else {
                            // we need to send the booking info here to the user by SMS
                            res.json({
                                "code": successCode,
                                "message": "Your booking has been confirmed. An SMS will be sent shortly",
                                "otp": otp,
                                "userType": data.userType
                            })
                            return;
                        }

                    });

                } else {
                    res.json({
                        "code": errorCode,
                        "message": "You have an appointment awaiting your visit to the school clinic.",
                        "data": pendingBookingData
                    })
                    return;
                }
            });
        }

    });
}

/**
 * Get user test results by User ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.get_user_test_results = function (req, res) {
    // create an array of errors to return
    var errors = []

    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId
    }

    // lets check if the userID exists
    var params = [data.userId]
    db.query(sql.userByUpsaId, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "This UPSA ID is not found, kindly signup"
            })
            return;
        }

        else {
            //get bookings for this user
            var params = userData[0]["id"];
            db.query(sqlBooking.getBookingTestResults, params, function (err, testResultsData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (testResultsData.length == 0) {
                    //since no pending booking, send 201 so that app can show calendar for user to book again
                    res.json({
                        "code": errorCode,
                        "message": "No test results for yours bookings. Kindly check again sometime soon",
                    })
                    return;

                } else {
                    res.json({
                        "code": successCode,
                        "message": "Your test results are ready",
                        "data": testResultsData
                    })
                    return;
                }
            });
        }

    });
}

/**
 * List all contacts tracing by User ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.list_contacts_traced_per_user_location = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }
    if (!req.body.latitude) {
        errors.push("No latitude specified");
    }
    if (!req.body.longitude) {
        errors.push("No longitude specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
    };

    // lets check if the userID exists
    var params = [data.userId]
    db.query(sql.userByUpsaId, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "This UPSA ID is not found, kindly signup"
            })
            return;
        }

        else {

            //lets get all the contacts traced in the system
            var newQuery = "SELECT * FROM auto_contact_tracing_users_list WHERE upsa_id <> " + userData[0]["id"];
            var params = []
            db.query(newQuery, params, function (err, allContactsTraced) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (allContactsTraced.length == 0) {
                    res.json({
                        "code": errorCode,
                        "message": "No contacts registered in the system at this time. Kindly check again some time soon"
                    })
                    return;
                } else {
                    var poslat = Number(data.latitude);
                    var poslng = Number(data.longitude);

                    console.log("Latitude-->>" + poslat + "---Longitude-->>" + poslng);

                    var refinedContactsTracedData = [];
                    var tracedUserIdsArray = [];

                    for (var r = 0; r < allContactsTraced.length; r++) {
                        let mainData = allContactsTraced[r];
                        let coordinates = {};

                        console.log("User data retrived successfully");

                        coordinates["latitude"] = mainData["latitude"];
                        coordinates["longitude"] = mainData["longitude"];
                        coordinates["location_name"] = mainData["last_seen_location"];

                        tracedUserIdsArray.push(mainData["upsa_id"]);
                        coordinates["upsa_id"] = mainData["upsa_id"];

                        coordinates["traced_date"] = mainData["traced_date"];
                        coordinates["device_id"] = mainData["device_id"];
                        refinedContactsTracedData.push(coordinates)

                    }

                    console.log("refinedContactsTracedData--->>", refinedContactsTracedData);

                    var nearestContactsTracedData = [];

                    for (var i = 0; i < refinedContactsTracedData.length; i++) {
                        let nearestData = {};
                        // if this location is within 0.1KM of the user, add it to the list
                        if (helperFunctions.distance(poslat, poslng, refinedContactsTracedData[i].latitude, refinedContactsTracedData[i].longitude, "K") <= radiusKM) {
                            nearestData["location_name"] = refinedContactsTracedData[i]["location_name"];
                            nearestData["upsa_id"] = refinedContactsTracedData[i]["upsa_id"];
                            nearestData["traced_date"] = refinedContactsTracedData[i]["traced_date"];
                            nearestData["device_id"] = refinedContactsTracedData[i]["device_id"];
                            nearestData["latitude"] = refinedContactsTracedData[i]["latitude"];
                            nearestData["longitude"] = refinedContactsTracedData[i]["longitude"];

                            nearestContactsTracedData.push(nearestData);
                        }
                    }

                    console.log("Final nearest contacts traced data are-->>>", nearestContactsTracedData);

                    res.json({
                        "code": successCode,
                        "message": "All contacts traced for " + radiusKM + " KM location Retrieved",
                        "data": nearestContactsTracedData,
                        "tracedUserIds": tracedUserIdsArray
                    })
                    return;
                }

            });
        }

    });

};
