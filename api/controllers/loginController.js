'use strict';

var successCode = "200";
var errorCode = "204";

var db = require('../models/model'); //database model loaded here
var allQuery = require('../models/queryList');
var sql = allQuery["loginRegisterQry"];
var helperFunctions = require('../utilities/helperFunctions');

//logger
var util = require('util');

/**
 * Welcome User
 */
exports.welcome = function (req, res) {
    res.json({ "message": "Connected" })
};

/**
 * Login user by mobile number
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.login_user = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    // check if phone number contains only digits
    let isnum = /^\d+$/.test(req.body.mobile);

    if (isnum == false) {
        errors.push("Only numbers are allowed for phone number");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile
    }

    // lets check if the number exists
    var params = [data.mobile]
    db.query(sql.loginByPhoneNumber, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly sign up."
            })
            return;
        }

        // since the user exists lets send the OTP
        else {

            var otp = helperFunctions.otpGenerate();
            var userType = userData[0]["personality"];

            // we need to send the OTP here to the user by SMS

            //also update the DB to reflect the new OTP sent
            var params = [otp, "YES", data.mobile]
            db.query(sql.updateUserOtp, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {

                    //send new OTP via SMS
                    res.json({
                        "code": successCode,
                        "message": "You will receive an OTP to confirm your login",
                        "otp": otp,
                        "userType": userType,
                        "data": userData
                    })
                    return;
                }
            });

        }
    });
}

/**
 * Register user by Usertype, phone number and User ID
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.register_user = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.userType) {
        errors.push("No user type specified");
    }
    if (req.body.userType.toUpperCase() != "STAFF" && req.body.userType.toUpperCase() != "STUDENT") {
        errors.push("Only staff and student should be specified as personality");
    }
    if (!req.body.userId) {
        errors.push("No UPSA ID specified");
    }
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    // check if phone number contains only digits
    let isnum = /^\d+$/.test(req.body.mobile);

    if (isnum == false) {
        errors.push("Only numbers are allowed for phone number");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        userId: req.body.userId,
        userType: req.body.userType,
        mobile: req.body.mobile,
    }

    // lets check if the number exists
    var params = [data.mobile]
    db.query(sql.userByPhoneNumber, params, function (err, userNoData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userNoData.length == 0) {

            //lets check if User ID also exists
            var params = [data.userId]
            db.query(sql.userByUpsaId, params, function (err, userIdData) {

                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                }

                if (userIdData.length == 0) {

                    //since both phone number and user ID does not exist, lets go and register the user
                    var datetime = new Date();
                    var created_at = datetime.toISOString();
                    var otp = helperFunctions.otpGenerate();
                    var params = [data.userId, data.mobile, data.userType.toUpperCase(), created_at, data.mobile, otp, "NO"]

                    db.query(sql.registerUser, params, function (err, result) {

                        if (err) {
                            res.status(400).json({ "error": err.message })
                            return;
                        } else {

                            // we need to send the OTP here to the user by SMS
                            res.json({
                                "code": successCode,
                                "message": "You will receive an OTP to confirm your registration",
                                "otp": otp,
                                "userType": data.userType
                            })
                            return;
                        }
                    });
                }

                // since the user ID exists
                else {

                    res.json({
                        "code": errorCode,
                        "message": "This UPSA ID is already registered"
                    })
                    return;
                }
            });
        }

        else {
            res.json({
                "code": errorCode,
                "message": "This phone number is already registered"
            })
            return;
        }

    });
}


/**
 * Validate OTP
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.validate_user_otp = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    if (!req.body.otp) {
        errors.push("No otp specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile,
        otp: req.body.otp
    }

    // lets check if the user is registered on the APP
    var params = [data.mobile]
    db.query(sql.userByPhoneNumber, params, function (err, userData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly sign up"
            })
            return;
        } else {
            // now lets compare the OTP
            var dbOtp = userData[0]["user_otp"]
            if (data.otp.toString() == dbOtp.toString()) {
                var params = [data.otp, "YES", data.mobile]
                db.query(sql.updateUserOtp, params, function (err, result) {
                    if (err) {
                        res.status(400).json({ "error": err.message })
                        return;
                    } else {

                        res.json({
                            "code": successCode,
                            "message": "OTP confirmed Successfully",
                            "data": userData
                        })
                        return;
                    }
                });

            } else {
                res.json({
                    "code": errorCode,
                    "message": "OTP is incorrect, try again"
                })
                return;
            }
        }
    });
}


/**
 * Resend OTP to user
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.resend_user_otp = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    // check if PIN contains only digits
    let isnum = /^\d+$/.test(req.body.mobile);

    if (isnum == false) {
        errors.push("Only numbers are allowed for phone number");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        mobile: req.body.mobile
    }

    // lets check if the user is registered on the APP
    var params = [data.mobile]
    db.query(sql.userByPhoneNumber, params, function (err, userData) {
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly sign up"
            })
            return;
        } else {

            // update the new OTP in the DB
            var otp = helperFunctions.otpGenerate();

            var params = [otp, userData[0]["signup_confirmed"], data.mobile]
            db.query(sql.updateUserOtp, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {

                    //resend OTP via SMS
                    res.json({
                        "code": successCode,
                        "message": "OTP was resent successfully",
                        "data": userData
                    })

                    return;
                }
            });

        }
    });
}

/**
 * save user location to db
 * Request - POST
 * Params {jsonBodyItems}
 */
exports.save_user_location = function (req, res) {
    // create an array of errors to return
    var errors = []
    if (!req.body.latitude) {
        errors.push("No latitude specified");
    }
    if (!req.body.longitude) {
        errors.push("No longitude specified");
    }
    if (!req.body.mobile) {
        errors.push("No mobile number specified");
    }

    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }

    var data = {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        mobile: req.body.mobile
    }

    // lets check if the number exists
    var params = [data.mobile]
    db.query(sql.loginByPhoneNumber, params, function (err, userData) {

        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }

        if (userData.length == 0) {
            res.json({
                "code": errorCode,
                "message": "Unable to find user with mobile number" + " " + data.mobile + ". Kindly sign up."
            })
            return;
        }

        // since the user exists lets send the OTP
        else {
            //get user table id
            var upsaId = userData[0]["id"];
            
            var datetime = new Date();
            var created_at = datetime.toISOString();

            var dailyDate = datetime.toISOString().split("T");

            //lets get the city of the coordinates

            // var coordinates = data.latitude+","+data.longitude;
            // console.log("latitude to be checked-->>", data.latitude);
            // console.log("longitude to be checked-->>", data.longitude);
            // var getCityFromGoogle = helperFunctions.GET_CITY_FROM_GOOGLE_API(coordinates);


            //before saving lets check if the latitude or longitude is the same as that already saved for this user for the same day sent else no save will happen
            var params = [data.latitude, data.longitude, dailyDate[0], upsaId]
            db.query(sql.checkIfDailyCoordinatesExist, params, function (err, dailyCheckData) {
                if (err) {
                    res.status(400).json({ "error": err.message })
                    return;
                } else {

                    if (dailyCheckData.length == 0) {
                        // save the user location info in the DB
                        var params = [upsaId, data.latitude, data.longitude, "UPSA Hostel", created_at, data.mobile]
                        db.query(sql.saveUserDeviceCoordinates, params, function (err, deviceData) {
                            if (err) {
                                res.status(400).json({ "error": err.message })
                                return;
                            } else {
                                console.log("User -->> " + data.mobile + " device coordinates saved successfully at this time-->>" + created_at);
                                res.json({
                                    "code": successCode,
                                    "message": "User -->> " + data.mobile + " device coordinates saved successfully at this time-->>" + created_at
                                })

                                return;
                            }
                        });
                    }

                    //dont perform any save operation
                    else {
                        res.json({
                            "code": errorCode,
                            "message": "User -->> " + data.mobile + " device coordinates already exists for today-->>"
                        })

                        return;
                    }
                }
            });
        }
    });
}