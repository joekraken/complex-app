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
  return getFollowUsers([
    {$match: {followedUserId: userId}},
    {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
  ])
}

// return a list of user following this profile-user
Follow.getFollowingById = function(userId) {
  return getFollowUsers([
    {$match: {authorId: userId}},
    {$lookup: {from: "users", localField: "followedUserId", foreignField: "_id", as: "userDoc"}},
  ])
}

// return a count of followers for a profile user
Follow.countFollowersById = function(authorId) {
  return countFollowUser({followedUserId: authorId})
}

// return a count of user following a profile user
Follow.countFollowingById = function(authorId) {
  return countFollowUser({authorId: authorId})
}

// ** helper methods **
// retrieve list of users either followers or following
// depending on the pipeline argument
getFollowUsers = function(pipeline) {
  return new Promise(async (resolve, reject) => {
    try {
      pipeline.push({$project: {
        username: {$arrayElemAt: ["$userDoc.username", 0]},
        email: {$arrayElemAt: ["$userDoc.email", 0]}
      }})
      // retrieve and aggregate a set of follow and user docs from mongo
      let users = await followsCollection.aggregate(pipeline).toArray()
      // map array into objects
      users = users.map(item => {
        let user = new User(item, true)
        return {username: user.data.username, avatar: user.avatar}
      })
      resolve(users)
    } catch {
      reject()
    }
  })
}

// retrieve count of followers or following users
// depending on the filter argument
countFollowUser = function(filter) {
  return new Promise(async (resolve, reject) => {
    const count = await followsCollection.countDocuments(filter)
    resolve(count)
  })
}

module.exports = Follow