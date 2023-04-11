// function() this keyword points to calling object
// this - references the userController object

let User = function(data) {
  this.data = data
}

// all instances can access this function
User.prototype.register = function() {
  
}

module.exports = User
