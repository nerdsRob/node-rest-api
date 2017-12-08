var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var uniqid = require('uniqid');
var crypto = require('crypto');

require('dotenv').config();

function User(email, avatar_url) {
  this.email = email;
  this.avatar_url = avatar_url;
}

function Authenticated_User(user_id, token) {
  this.user_id = user_id;
  this.token = token;
}

var pool = mysql.createPool({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASS,
    database        : process.env.DB_NAME,
    connectionLimit : 10
});

function generateTokenFromCredentials(email, password) {
  const secret = process.env.API_SECRET;
  const token = crypto.createHmac('sha256', secret)
                   .update(email+password)
                   .digest('hex');

  return token;
}

router.get('/:userId', function(request, response, next) {
  response.setHeader('Content-Type', 'application/json');
  var user_id = request.params.userId;
  var token = request.headers['token'];

  if (!token) {
    return response.json({status: 400, message: "Missing token parameter"});
  }

  var query = 'SELECT * FROM user WHERE user_id=? AND token=?';
  pool.getConnection(function (error, connection) {
      if (error) {
          return response.send(400);
      }

      connection.query(query, [user_id, token], function(error, rows) {
          if (error) {
              connection.release();
              return response.send(400, error);
          }
          if (rows.length > 0) {
              response.json({status: 200, error: null, user: new User(rows[0].email, rows[0].avatar_url)});
              connection.release();
          } else {
            connection.release();
            return response.json({status: 401, message: "Unauthorized"});
          }
      });
    });
});

router.post('/sessions/new', function(request, response) {
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

            response.json({status: 200, error: null, user: new Authenticated_User(user_id, token)});
            connection.release();
        });
    });
});

module.exports = router;
