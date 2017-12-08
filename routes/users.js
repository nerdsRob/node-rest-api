const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const uniqid = require('uniqid');
const crypto = require('crypto');
const fs = require("fs");

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
              return response.status(400).send(error);
          }
          if (rows.length > 0) {
              response.json({status: 200, user: new User(rows[0].email, rows[0].avatar_url)});
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

            response.json({status: 200, user: new Authenticated_User(user_id, token)});
            connection.release();
        });
    });
});

router.get('/avatar/:userId', function(request, response, next) {
  var avatar_file_name = request.params.userId + ".png";
  var options = {
    root: 'avatars/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true,
      }
  };

  response.sendFile(avatar_file_name, options, function(error) {
    if (error) {
      return response.status(404).send(error);
    } else {
      return response.status(200);
    }
  });
});

router.post('/:userId/avatar', function(request, response) {
    response.setHeader('Content-Type', 'application/json');
    var user_id = request.params.userId;
    var token = request.body.token;
    var avatar_base64_data = request.body.avatar.replace(/^data:image\/\w+;base64,/, "");
    var avatar_url = 'localhost:3000/users/avatar/' + user_id;

    if (!token) {
      return response.json({status: 400, message: "Missing token parameter"});
    } else if (!avatar_base64_data) {
      return response.json({status: 400, message: "No valid base64 encoded image data provided"});
    }

    pool.getConnection(function (error, connection) {
        if (error) {
            return response.status(500).send(error);
        }

        var query = 'UPDATE user SET avatar_url=? WHERE user_id=? AND token=?';
        connection.query(query, [avatar_url, user_id, token] , function(error, body) {
            if (error) {
                connection.release();
                return response.status(500).send(error);
            }

            if (body.affectedRows == 0) {
              connection.release();
              return response.json({status: 401, message: "Unauthorized"});
            } else {
              connection.release();
              var image = new Buffer(avatar_base64_data, 'base64');
              fs.writeFileSync('avatars/' + user_id + '.png', image);
              return response.json({status: 200, message: "Your avatar got updated!"});
            }
        });
    });
});

module.exports = router;
