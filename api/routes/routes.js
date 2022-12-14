'use strict';
var mainRoute = "/api/upsa/ct"
module.exports = function (app) {
    var loginTask = require('../controllers/loginController');
    var bookingTask = require('../controllers/bookingController');
    var symptomsTask = require('../controllers/symptomsController');

    /**
    * login and register Routes
    */
    app.route('/')
        .get(loginTask.welcome)

    app.route(mainRoute + '/login')
        .post(loginTask.login_user)

    app.route(mainRoute + '/register')
        .post(loginTask.register_user)

    app.route(mainRoute + '/otp/validate')
        .post(loginTask.validate_user_otp)

    app.route(mainRoute + '/otp/resend')
        .post(loginTask.resend_user_otp)

    app.route(mainRoute + '/location/save')
        .post(loginTask.save_user_location)

    /**
    * booking routes
    */
    app.route(mainRoute + '/booking/check')
        .post(bookingTask.check_user_booking)

    app.route(mainRoute + '/booking/register')
        .post(bookingTask.register_booking)

    app.route(mainRoute + '/booking/test/results')
        .post(bookingTask.get_user_test_results)

    app.route(mainRoute + '/booking/contacts/traced')
        .post(bookingTask.list_contacts_traced_per_user_location)


    /**
     * symptoms routes
     */
    app.route(mainRoute + '/symptoms/list')
        .post(symptomsTask.get_symptoms_list)

    app.route(mainRoute + '/isolation/days')
        .post(symptomsTask.get_isolation_days_count)

    app.route(mainRoute + '/symptoms/check/pending/booking/isolation')
        .post(symptomsTask.check_pending_booking_and_isolation)

    app.route(mainRoute + '/symptoms/register/isolate')
        .post(symptomsTask.register_symptoms_and_isolate)

};