var express = require('express');
var router = express.Router();
var mysql = require('mysql');
require('dotenv').config();

function Comment(comment, publication_id, user_avatar_url, publication_title, username, ownerUsername, ts) {
  this.comment = comment;
  this.publication_id = publication_id;
  this.user_avatar_url = user_avatar_url;
  this.publication_title = publication_title;
  this.username = username;
  this.ownerUsername = ownerUsername;
  this.ts = ts;
}

var pool = mysql.createPool({
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASS,
    database        : process.env.DB_NAME,
    connectionLimit : 10
});

router.get('/:ownerUsername', function(request, response, next) {
  response.setHeader('Content-Type', 'application/json');
  var ownerUsername = request.params.ownerUsername;

  var query = 'SELECT * FROM comments WHERE ownerUsername=? ORDER BY ts DESC';
  pool.getConnection(function (error, connection) {
      if (error) {
          return response.send(400);
      }

      connection.query(query, [ownerUsername], function(error, rows) {
          if (error) {
              connection.release();
              return response.send(400, 'Couldnt get a connection');
          }

          var comments = [];
          for (var i=0; i<rows.length; i++) {
            comments.push({feedback: new Comment(rows[i].comment, rows[i].publication_id, rows[i].user_avatar_url, rows[i].publication_title, rows[i].username, rows[i].ownerUsername, rows[i].ts)});
          }

          response.json({status: 200, error: null, collection: comments});
          connection.release();
      });
    });
});

router.post('/add', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var comment = req.body.comment;
    var publication_id = req.body.publication_id;
    var user_avatar_url = req.body.user_avatar_url;
    var publication_title = req.body.publication_title;
    var username = req.body.username;
    var ownerUsername = req.body.ownerUsername;

    pool.getConnection(function (error, connection) {
        if (error) {
            return res.status(500).send(error);
        }

        connection.query('INSERT INTO comments(comment, publication_id, user_avatar_url, publication_title, username, ownerUsername) values(?, ?, ?, ?, ?, ?)', [comment, publication_id, user_avatar_url, publication_title, username, ownerUsername] , function(error, body) {
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
