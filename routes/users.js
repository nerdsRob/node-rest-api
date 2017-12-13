const express = require('express');
const router = express.Router();
const DatabaseController = require('../helpers/DatabaseController.js');

var db_controller = new DatabaseController();

router.get('/:userId', function(request, response, next) {
  db_controller.fetch_user(request, response);
});

router.get('/avatar/:userId', function(request, response, next) {
  db_controller.fetch_user_avatar(request, response);
});

router.post('/:userId/avatar', function(request, response) {
  db_controller.update_user_avatar(request, response);
});

module.exports = router;
