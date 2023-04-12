// function() this keyword points to calling object
// this - references the userController object

const validator = require('validator')

let User = function(data) {
  this.data = data
  this.errors = []
}
User.prototype.validate = function() {
  if (this.data.username == '') {this.errors.push('Username must be provided')}
  if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username can only contain letters and numbers')}
  if (!validator.isEmail(this.data.email)) {this.errors.push('Valid email must be provided')}
  if (this.data.password == '') {this.errors.push('Password must be provided')}
  if (!validator.isLength(this.data.password, {min: 12, max: 100})) {this.errors.push('Password must be 12 to 100 characters long')}
  if (!validator.isLength(this.data.username, {min: 3, max: 30})) {this.errors.push('Username must be 3 to 30 characters long')}
}

// all instances can access this function
User.prototype.register = function() {
  // 1 : validate user input
  this.validate()

  // 2 : if no validation errors, then save user data to db
}

module.exports = User
