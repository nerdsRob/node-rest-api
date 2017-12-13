const express = require('express');
const router = express.Router();
const DatabaseController = require('../helpers/DatabaseController.js');

var db_controller = new DatabaseController();

router.post('/new', function(request, response) {
    db_controller.create_user(request, response);
});

module.exports = router;
