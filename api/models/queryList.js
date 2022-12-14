'use strict';

let loginRegisterQry = {
    "loginByPhoneNumber": "select * from app_users_list where phone_number = ? AND signup_confirmed = 'YES' ",
    
    "userByPhoneNumber": "select * from app_users_list where phone_number = ?",

    "userByUpsaId": "select * from app_users_list where upsa_id = ?",

    "userByTableId": "select * from app_users_list where id = ?",

    "registerUser": "INSERT INTO app_users_list (upsa_id, phone_number, personality, registered_date, device_id, user_otp, signup_confirmed) VALUES (?,?,?,?,?,?,?)",
   
    "updateUserOtp": "UPDATE app_users_list set user_otp = COALESCE(?,user_otp), signup_confirmed = COALESCE(?,signup_confirmed) WHERE phone_number = ?",

    "checkIfDailyCoordinatesExist": "SELECT * FROM auto_contact_tracing_users_list WHERE latitude = ? AND longitude = ? AND DATE(traced_date) = ? AND upsa_id = ?",
   
    "saveUserDeviceCoordinates": "INSERT INTO auto_contact_tracing_users_list (upsa_id, latitude, longitude, last_seen_location, traced_date, device_id) VALUES (?,?,?,?,?,?)",
};

let bookingQry = {
    "pendingBooking": "select * from booking_list where upsa_id  = ? AND visited_status = 'NO' ",

    "getBookingTestResults": "select * from booking_list where upsa_id  = ? AND visited_status = 'YES' AND test_result_status IS NOT NULL",

    "registerBooking": "INSERT INTO booking_list (upsa_id, booked_date, visited_status, booking_code) VALUES (?,?,?,?)",

    "contactsTracedBygps": "select * from auto_contact_tracing_users_list",

};

let symptomsQry = {
    "getSymptomsList": "select * from symptoms_list ORDER BY id ASC",
};

let isolationQry = {
    "getIsolationByUser": "select * from isolated_persons_list where upsa_id = ? OR last_contact_users_id in (?)",

    "getIsolationDays": "select isolation_days_counter, severity_condition from isolated_persons_list where upsa_id = ? OR last_contact_users_id in (?)",

    "registerSymptomsAndIsolate": "INSERT INTO isolated_persons_list (symptoms_list_checked, severity_condition, last_contact_users_id, isolation_days_counter, already_checked_symptoms_status, upsa_id, reported_date) VALUES (?,?,?,?,?,?,?)",
}

module.exports = { loginRegisterQry, bookingQry, symptomsQry, isolationQry };