'use strict';

var successCode = "200";
var pendingCode = "201";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');
var sql = allQuery["loginRegisterQry"];
var sqlBooking = allQuery["bookingQry"];
var sqlSymptoms = allQuery["symptomsQry"];
var sqlIsolation = allQuery["isolationQry"];
var helperFunctions = require('../utilities/helperFunctions');

//logger
var util = require('util');


/**
 * get symptoms list
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.get_symptoms_list = function (req, res) {
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
            //get symptoms list
            var params = [];
            db.query(sqlSymptoms.getSymptomsList, params, function (err, symptomsData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (symptomsData.length == 0) {
                    //check if user still has some isolation days left
                    res.json({
                        "code": errorCode,
                        "message": "No symptoms added. Kindly check again sometime soon",
                    })
                    return;

                } else {
                    var refinedSymptoms = [];
                    for (var i = 0; i < symptomsData.length; i++) {
                        var mainData = symptomsData[i];
                        let newData = {};
                        newData["id"] = mainData["id"];
                        newData["label"] = mainData["label"];
                        newData["description"] = mainData["description"];
                        newData["isChecked"] = false;
                        refinedSymptoms.push(newData);
                    }
                    res.json({
                        "code": successCode,
                        "message": "Successfully pulled symptoms list",
                        "data": refinedSymptoms
                    })
                    return;
                }
            });
        }

    });
}

/**
 * Check pending bookings and Isolation days count by User ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.check_pending_booking_and_isolation = function (req, res) {
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
            var params = [userData[0]["id"]];
            db.query(sqlBooking.pendingBooking, params, function (err, pendingBookingData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (pendingBookingData.length == 0) {
                    //check if user still has some isolation days left
                    var params = [userData[0]["id"], userData[0]["id"]];
                    db.query(sqlIsolation.getIsolationByUser, params, function (err, isolationData) {

                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (isolationData.length == 0) {
                            //check if user still has some isolation days left

                            res.json({
                                "code": successCode,
                                "message": "No pending bookings or Isolation"
                            })
                            return;

                        }
                        else {
                            //lets check if Isolation days counter is not 0, user cannot check for symptoms
                            var isolationDaysCount = isolationData[0]["isolation_days_counter"];
                            if (parseInt(isolationDaysCount) > 0) {
                                res.json({
                                    "code": errorCode,
                                    "message": "You still have " + parseInt(isolationDaysCount) + " days to Isolate."
                                })
                                return;
                            } else {
                                res.json({
                                    "code": successCode,
                                    "message": "No pending bookings or Isolation. Kindly check your symptoms"
                                })
                                return;

                            }
                        }

                    });

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
 * Register symptoms by User ID and symptoms selected
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.register_symptoms_and_isolate = function (req, res) {
    // create an array of errors to return
    var errors = []

    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }

    if (!req.body.selectedSymptoms) {
        errors.push("No selected symptoms specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId,
        selectedSymptoms: req.body.selectedSymptoms,
        selectedContacts: req.body.selectedContacts
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
            var params = [userData[0]["id"]];
            db.query(sqlBooking.pendingBooking, params, function (err, pendingBookingData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (pendingBookingData.length == 0) {
                    //check if user still has some isolation days left
                    var params = [userData[0]["id"], userData[0]["id"]];
                    db.query(sqlIsolation.getIsolationByUser, params, function (err, isolationData) {

                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        }

                        if (isolationData.length == 0) {

                            //save the symptoms here

                            var datetime = new Date();
                            var reported_date = datetime.toISOString();

                            var severity_condition = "";
                            var isolationDays = 0;

                            if (data.selectedSymptoms.length > 1) {
                                severity_condition = "HIGH";
                                isolationDays = 14;
                            } else {
                                severity_condition = "LOW";
                                isolationDays = 7
                            }


                            var params = [data.selectedSymptoms.toString(), severity_condition, data.selectedContacts.toString(), isolationDays, "YES", userData[0]["id"], reported_date]

                            db.query(sqlIsolation.registerSymptomsAndIsolate, params, function (err, result) {

                                if (err) {
                                    res.status(400).json({ "error": err.message })
                                    console.log("errroororr-->>>", err)
                                    return;
                                } else {

                                    if (data.selectedContacts.length == 0) {
                                        //Symptoms saved
                                        res.json({
                                            "code": successCode,
                                            "message": "Your symptoms condition is critically " + severity_condition + ". Kindly isolate yourself for " + isolationDays + "days. "

                                        })
                                        return;
                                    }

                                    var lastContactsData = data.selectedContacts;

                                    //alert all last contact ids of isolation as well

                                    var operationCounter = 0;
                                    var allContactIds = [];

                                    for (var i = 0; i < lastContactsData.length; i++) {
                                        var mainData = lastContactsData[i];

                                        //replace this user UPSA ID with the reporter's own when creating 
                                        var index = lastContactsData.indexOf(mainData);
                                        if (index !== -1) {
                                            lastContactsData[index] = parseInt(userData[0]["id"]);
                                        }

                                        var params = [data.selectedSymptoms, severity_condition, lastContactsData, isolationDays, "NO", lastContactsData[i], reported_date];
                                        db.query(sqlIsolation.registerSymptomsAndIsolate, params, function (err, result) {

                                            if (err) {
                                                res.status(400).json({ "error": err.message })
                                                return;

                                            }

                                        });

                                        //push the ID to an array
                                        allContactIds.push(mainData["user_id"]);

                                        ++operationCounter;
                                    }

                                    //if forloop has finished executing
                                    if (operationCounter === lastContactsData.length) {

                                        //we can send all the users involved an SMS to notify them to isolate immediately
                                        res.json({
                                            "code": successCode,
                                            "message": "Your symptoms condition is critically " + severity_condition + ". Kindly isolate yourself for " + isolationDays + "days. All the last persons you were in contact with have been notified to Isolate as well "

                                        })
                                        return;
                                    }

                                }

                            });
                        }
                        else {
                            //lets check if Isolation days counter is not 0, user cannot check for symptoms
                            var isolationDaysCount = isolationData[0]["isolation_days_counter"];
                            if (parseInt(isolationDaysCount) > 0) {
                                res.json({
                                    "code": errorCode,
                                    "message": "You still have " + parseInt(isolationDaysCount) + " days to Isolate."
                                })
                                return;
                            } else {

                                //save the symptoms here

                                var datetime = new Date();
                                var reported_date = datetime.toISOString();

                                var severity_condition = "";
                                var isolationDays = 0;

                                if (data.selectedSymptoms.length > 1) {
                                    severity_condition = "HIGH";
                                    isolationDays = 14;
                                } else {
                                    severity_condition = "LOW";
                                    isolationDays = 7
                                }

                                var params = [data.selectedSymptoms.toString(), severity_condition, data.selectedContacts.toString(), isolationDays, "YES", userData[0]["id"], reported_date]

                                db.query(sqlIsolation.registerSymptomsAndIsolate, params, function (err, result) {

                                    if (err) {
                                        res.status(400).json({ "error": err.message })
                                        return;
                                    } else {

                                        if (data.selectedContacts.length == 0) {
                                            //Symptoms saved
                                            res.json({
                                                "code": successCode,
                                                "message": "Your symptoms condition is critically " + severity_condition + ". Kindly isolate yourself for " + isolationDays + "days. "

                                            })
                                            return;
                                        }

                                        var lastContactsData = data.selectedContacts;

                                        //alert all last contact ids of isolation as well

                                        var operationCounter = 0;
                                        var allContactIds = [];

                                        for (var i = 0; i < lastContactsData.length; i++) {
                                            var mainData = lastContactsData[i];

                                            //replace this user UPSA ID with the reporter's own when creating 
                                            var index = lastContactsData.indexOf(mainData);
                                            if (index !== -1) {
                                                lastContactsData[index] = parseInt(userData[0]["id"]);
                                            }

                                            var params = [data.selectedSymptoms, severity_condition, lastContactsData, isolationDays, "NO", lastContactsData[i], reported_date];
                                            db.query(sqlIsolation.registerSymptomsAndIsolate, params, function (err, result) {

                                                if (err) {
                                                    res.status(400).json({ "error": err.message })
                                                    return;

                                                }

                                            });

                                            //push the ID to an array
                                            allContactIds.push(mainData["user_id"]);

                                            ++operationCounter;
                                        }

                                        //if forloop has finished executing
                                        if (operationCounter === lastContactsData.length) {

                                            //we can send all the users involved an SMS to notify them to isolate immediately
                                            res.json({
                                                "code": successCode,
                                                "message": "Your symptoms condition is critically " + severity_condition + ". Kindly isolate yourself for " + isolationDays + "days. All the last persons you were in contact with have been notified to Isolate as well "

                                            })
                                            return;
                                        }

                                    }

                                });

                            }
                        }

                    });

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
 * get isolation count days
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.get_isolation_days_count = function (req, res) {
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
            //get isolation days list
            var params = [userData[0]["id"], userData[0]["id"]];
            db.query(sqlIsolation.getIsolationDays, params, function (err, isolationData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (isolationData.length == 0) {
                    //check if user still has some isolation days left
                    res.json({
                        "code": successCode,
                        "message": "You don't have any isolation info",
                        "data": isolationData
                    })
                    return;

                } else {

                    res.json({
                        "code": successCode,
                        "message": "You have " + isolationData[0]["isolation_days_counter"] + " days to isolate yourself",
                        "data": isolationData
                    })
                    return;
                }
            });
        }

    });
}