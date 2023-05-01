// const { ObjectId } = require('mongodb')
const usersCollection = require('../../db').db().collection('users')
const followsCollection = require('../../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectId

// constructor
let Follow = function(toFollowUsername, loggedInUserId) {
  this.followedUsername = toFollowUsername
  this.authorId = loggedInUserId
  this.errors = []
}

// sanitize data
Follow.prototype.cleanUp = function() {
  if (typeof(this.followedUsername) != 'string') {this.followedUsername = ''}
}

// verify user to follow exists in db
Follow.prototype.validate = async function() {
  let followedAccount = await usersCollection.findOne({username: this.followedUsername})
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push('You cannot follow non-existing user')
  }
}

// create the follow doc in mongodb
Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate()
    if (!this.errors.length) {
      await followsCollection.insertOne({followedUserId: this.followedId, authorId: new ObjectId(this.authorId)})
      resolve()
    } else {
      reject(errors)
    }
  })
}

// return true if visitor is following profile, else false
Follow.isVisitorFollowing = async function(followedUserId, visitorId) {
  let followDoc = await followsCollection.findOne({followedUserId: followedUserId, authorId: new ObjectId(visitorId)})
  // true if visitor is following profile user
  if (followDoc) {
    return true
  }
  return false
}


module.exports = Follow