const User = require('./User')
// related to mongodb 
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
Follow.prototype.validate = async function(action) {
  let followedAccount = await usersCollection.findOne({username: this.followedUsername})
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push('You cannot follow non-existing user')
  }
  let doesFollowingExist = await followsCollection.findOne({followedUserId: this.followedId, authorId: new ObjectId(this.authorId)})
  // check action type and if already following user
  if (action == 'create') {
    if (doesFollowingExist) {this.errors.push('You are already following user profile')}
  }
  if (action == 'delete') {
    if (!doesFollowingExist) {this.errors.push('You are not following user profile and cannot stop following')}
  }
  // shouldn't follow yourself
  if (this.followedId.equals(this.authorId)) {this.errors.push('You cannot follow yourself')}
}

// create the follow doc in mongodb
Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('create')
    if (!this.errors.length) {
      await followsCollection.insertOne({followedUserId: this.followedId, authorId: new ObjectId(this.authorId)})
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

// remove the follow doc in mongodb
Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('delete')
    if (!this.errors.length) {
      await followsCollection.deleteOne({followedUserId: this.followedId, authorId: new ObjectId(this.authorId)})
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

// return a list of followers this user is following
Follow.getFollowersById = function(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      // retrieve and aggregate a set of follow and user docs from mongo
      let followers = await followsCollection.aggregate([
        {$match: {followedUserId: userId}},
        {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$userDoc.username", 0]},
          email: {$arrayElemAt: ["$userDoc.email", 0]}
        }}
      ]).toArray()
      // map array into objects
      followers = followers.map(follower => {
        let user = new User(follower, true)
        return {username: follower.username, avatar: user.avatar}
      })
      resolve(followers)
    } catch {
      reject()
    }
  })
}

module.exports = Follow