require('dotenv').config();

const mysql = require('mysql');
const fs = require('fs');
const Token_Generator = require('./Token_Generator.js');

var gravatar = require('gravatar-api');
var User = require('../models/User.js');
var Authenticated_User = require('../models/Authenticated_User.js');

function DB_Controller() {
  this.token_generator = new Token_Generator();
  this.pool = mysql.createPool({
      host            : process.env.DB_HOST,
      user            : process.env.DB_USER,
      password        : process.env.DB_PASS,
      database        : process.env.DB_NAME,
      connectionLimit : 10
  });
}

DB_Controller.prototype.create_user = function(request, response) {
  response.setHeader('Content-Type', 'application/json');
  var email = request.body.email;
  var password = request.body.password;
  var user_id = this.token_generator.unique_id();
  var token = this.token_generator.token(email, password);

  var gravatar_options = {
    email: email,
    parameters: { "size": "400" },
    secure: true
  }
  var avatar = gravatar.imageUrl(gravatar_options);

  this.pool.getConnection(function (error, connection) {
      if (error) {
          return response.status(500).send(error);
      }

      var query = 'INSERT INTO user(user_id, email, token, avatar_url) values(?, ?, ?, ?)';
      connection.query(query, [user_id, email, token, avatar] , function(error, body) {
          if (error) {
              connection.release();
              return response.status(500).send(error);
          }
          var auth_user = new Authenticated_User(user_id, token);
          response.status(200).send(auth_user);
          connection.release();
      });
  });
};

DB_Controller.prototype.fetch_user = function(request, response) {
  response.setHeader('Content-Type', 'application/json');
  var user_id = request.params.userId;
  var token = request.headers['token'];

  if (!token) {
    return response.json({status: 400, message: "Missing token parameter"});
  }

  this.pool.getConnection(function (error, connection) {
      if (error) {
          return response.status(400).send(error);
      }

      var query = 'SELECT * FROM user WHERE user_id=? AND token=?';
      connection.query(query, [user_id, token], function(error, rows) {
          if (error) {
              connection.release();
              return response.status(400).send(error);
          }
          if (rows.length > 0) {
              var user = new User(rows[0].email, rows[0].avatar_url);
              response.status(200).send(user);
              connection.release();
          } else {
            response.json({status: 401, message: "Unauthorized"});
            connection.release();
          }
      });
    });
};

DB_Controller.prototype.fetch_user_avatar = function (request, response) {
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
      return response.json({status: 404, message: "Oops, your avatar could not be found"});
    } else {
      return response.status(200);
    }
  });
};

DB_Controller.prototype.update_user_avatar = function(request, response) {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'public, max-age=120')
  var user_id = request.params.userId;
  var token = request.body.token;
  var base_url = request.body.base_url
  var avatar_base64_data = request.body.avatar;
  var avatar_url = base_url + '/users/avatar/' + user_id;

  if (!token) {
    return response.json({status: 400, message: "Missing token parameter"});
  } else if (!avatar_base64_data) {
    return response.json({status: 400, message: "No valid base64 encoded image data provided"});
  }

  this.pool.getConnection(function (error, connection) {
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
            var stripped_image_content_type = avatar_base64_data.replace(/^data:image\/\w+;base64,/, "");
            var image = new Buffer(stripped_image_content_type, 'base64');
            fs.writeFileSync('avatars/' + user_id + '.png', image);
            return response.json({avatar_url: avatar_url});
          }
      });
  });
};

module.exports = DB_Controller;
