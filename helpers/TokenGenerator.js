const crypto = require('crypto');
const uniqid = require('uniqid');

function TokenGenerator() {
  this.secret = process.env.API_SECRET;
}

TokenGenerator.prototype.unique_id = function() {
  return uniqid('id-');
};

TokenGenerator.prototype.token = function(email, password) {
  const token = crypto.createHmac('sha256', this.secret)
                      .update(email + password)
                      .digest('hex');
  return token;
};

module.exports = TokenGenerator;
