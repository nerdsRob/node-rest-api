const crypto = require('crypto');
const uniqid = require('uniqid');

function Token_Generator() {
  this.secret = process.env.API_SECRET;
}

Token_Generator.prototype.unique_id = function() {
  return uniqid('id-');
};

Token_Generator.prototype.token = function(email, password) {
  const token = crypto.createHmac('sha256', this.secret)
                   .update(email + password)
                   .digest('hex');
  return token;
};

module.exports = Token_Generator;
