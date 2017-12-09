const express = require('express');
const router = express.Router();
const DB_Controller = require('../helpers/DB_Controller.js');

var db_controller = new DB_Controller();

router.post('/new', function(request, response) {
    db_controller.create_user(request, response);
});

module.exports = router;
