// function() this keyword points to calling object
// this - references the userController object

const bcrypt = require('bcryptjs') // hashing text
const usersCollection = require('../../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')

let User = function(data, doGetAvatar) {
  this.data = data
  this.errors = []
  if (doGetAvatar == undefined) {doGetAvatar == false}
  if (doGetAvatar) (this.getAvatar())
}

// clean up user input, so inputs are string
// no arrays, no code snippets, etc
User.prototype.cleanUp = function () {
  // check inputs are strings
  if (typeof(this.data.username) != 'string') {this.data.username = ''}
  if (typeof(this.data.email) != 'string') {this.data.email = ''}
  if (typeof(this.data.password) != 'string') {this.data.password = ''}

  // purify data, remove bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

// validate user input
User.prototype.validate = function() {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == '') {this.errors.push('Username must be provided')}
    if (this.data.username && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username can only contain letters and numbers')}
    if (this.data.username && !validator.isLength(this.data.username, {min: 3, max: 30})) {this.errors.push('Username must be 3 to 30 characters long')}
    if (!validator.isEmail(this.data.email)) {this.errors.push('Valid email must be provided')}
    if (this.data.password == '') {this.errors.push('Password must be provided')}
    if (this.data.password && !validator.isLength(this.data.password, {min: 12, max: 50})) {this.errors.push('Password must be 12 to 50 characters long')}
    // if username is valid, check username exists
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await usersCollection.findOne({username: this.data.username})
      if (usernameExists) {this.errors.push('Username is already taken')}
    }
    // if email is valid, check email exists
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({email: this.data.email})
      if (emailExists) {this.errors.push('Email is already taken')}
    }
    resolve()
  })
}

// login an existing user
User.prototype.login = function() {
  // send a Promise, with an arrow function to maintain this keyword
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    // get user from database
    const getExistingUser = await usersCollection.findOne({username: this.data.username})
    // check user exists and password is valid
    if (getExistingUser && bcrypt.compareSync(this.data.password, getExistingUser.password)) {
      this.data = getExistingUser
      this.getAvatar()
      resolve(`Success! User ${this.data.username} logged in`)
    } else {
      reject('Oops! Invalid username and/or password')
    }
  })

}

// register a new user
User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    // validate user input
    this.cleanUp()
    await this.validate()

    // if no validation errors, then save user data to db
    if (this.errors.length == 0) {
      // hash text
      let salt = bcrypt.genSaltSync(10) // generate salt
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

// get user profile icon
User.prototype.getAvatar = function() {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username) {
  return new Promise((resolve, reject) => {
    if (typeof(username) != 'string') {
      reject()
      return
    }
    usersCollection.findOne({username: username}).then((userDoc) => {
      // check user exists
      if (userDoc) {
        userDoc = new User(userDoc, true) // get user avatar
        // clean up user doc, remove email & password
        userDoc = {
          _id: userDoc.data._id,
          username: userDoc.data.username,
          avatar: userDoc.avatar
        }
        resolve(userDoc)
      } else {
        reject()
      }
    }).catch(() => {
      reject()
    })
  })
}

User.doesEmailExist = function(email) {
  return new Promise(async (resolve, reject) => {
    // check if email exists
    if (typeof(email) != 'string') {
      reject()
      return
    }
    const count = await usersCollection.countDocuments({email: email})
    // true email exists count > 0, else false
    if (count) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

module.exports = User
