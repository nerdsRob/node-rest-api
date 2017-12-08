const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const uniqid = require('uniqid');
const crypto = require('crypto');

function Authenticated_User(user_id, token) {
  this.user_id = user_id;
  this.token = token;
}

function generateTokenFromCredentials(email, password) {
  const secret = process.env.API_SECRET;
  const token = crypto.createHmac('sha256', secret)
                   .update(email+password)
                   .digest('hex');

  return token;
}

var pool = mysql.createPool({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASS,
    database        : process.env.DB_NAME,
    connectionLimit : 10
});

router.post('/new', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    var user_id = uniqid('bcg-');
    var email = request.body.email;
    var password = request.body.password;
    var token = generateTokenFromCredentials(email, password);

    pool.getConnection(function (error, connection) {
        if (error) {
            return response.status(500).send(error);
        }

        var query = 'INSERT INTO user(user_id, email, token) values(?, ?, ?)';
        connection.query(query, [user_id, email, token] , function(error, body) {
            if (error) {
                connection.release();
                return response.status(500).send(error);
            }

            response.json({status: 200, user: new Authenticated_User(user_id, token)});
            connection.release();
        });
    });
});

module.exports = router;
