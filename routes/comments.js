var express = require('express');
var router = express.Router();
var mysql = require('mysql');
require('dotenv').config();

var pool = mysql.createPool({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASS,
    database        : process.env.DB_NAME,
    connectionLimit : 10
});

router.get('/:publication_id', function(request, response, next) {
  response.setHeader('Content-Type', 'application/json');
  var publication_id = request.params.publication_id;
  var query = 'SELECT * FROM comments WHERE publication_id=?';
  pool.getConnection(function (error, connection) {
      if (error) {
          return response.send(400);
      }

      connection.query(query, publication_id, function(error, rows) {
          if (error) {
              connection.release();
              return response.send(400, 'Couldnt get a connection');
          }

          response.json({status: 200, error: null, comments: rows});
          connection.release();
      });
    });
});

router.get('/', function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  var query = 'SELECT * FROM comments';
  pool.getConnection(function (error, connection) {
      if (error) {
          return res.send(400);
      }

      connection.query(query, function(error, rows) {
          if (error) {
              connection.release();
              return res.send(400, 'Couldnt get a connection');
          }

          res.json({status: 200, error: null, comments: rows});
          connection.release();
      });
    });
});

router.post('/', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var user_id = req.body.user_id;
    var comment = req.body.comment;
    var publication_id = req.body.publication_id;
    var user_avatar_url = req.body.user_avatar_url;

    pool.getConnection(function (error, connection) {
        if (error) {
            return res.send(400);
        }

        connection.query('INSERT INTO comments(user_id, comment, publication_id, user_avatar_url) values(?, ?, ?, ?)', [user_id, comment, publication_id, user_avatar_url] , function(error, body) {
            if (error) {
                connection.release();
                return res.status(500).send(error);
            }

            return res.status(200).send(body);
            connection.release();
        });
    });
});

module.exports = router;
