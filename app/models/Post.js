const ObjectId = require('mongodb').ObjectId
const postsCollection = require('../../db').db().collection('posts')
const followsCollection = require('../../db').db().collection('follows')
const User = require('./User')
const sanitizeHTML = require('sanitize-html')
// uncomment following to create index in mongo
// postsCollection.createIndex({title: "text", body: "text"})

let Post = function(data, userId, postId) {
  this.data = data
  this.requestedPostId = postId
  this.userId = userId
  this.errors = []
}

Post.prototype.cleanUp = function() {
  // check post data are strings
  if(typeof(this.data.title) != 'string') {this.data.title = ''}
  if(typeof(this.data.body) != 'string') {this.data.body = ''}
  // purify data, remove bogus properties
  // sanitize title and body, by removing HTML, ok for markdown
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: []}),
    body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: []}),
    createdDate: new Date(),
    author: new ObjectId(this.userId)
  }
}

// check post doesn't have empty fields
Post.prototype.validate = function() {
  if (this.data.title == '') {this.errors.push('Title must be provided')}
  if (this.data.body == '') {this.errors.push('Post content must not be empty')}
}

// save valid post to database
Post.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    // if no errors, then save post to database
    if (!this.errors.length) {
      // save post to db
      postsCollection.insertOne(this.data).then((info) => {
      resolve(info.insertedId)
      }).catch(() => {
        this.errors.push('Please try again later')
        reject(this.errors)
      })
    } else {
      reject(this.errors)
    }
  })
}

// updated a post, check user/visitor is owner
Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userId)
      // check user authored the post
      if (post.isVisitorOwner) {
        // update database
        let status = await this.updateDb()
        resolve(status)
      } else {
        // invalid user
        reject()
      }
    } catch {
      reject()
    }
  })
}

// send post update to mongo database
Post.prototype.updateDb = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    // check validation errors
    if (!this.errors.length) {
      // document fields to update
      const updateDoc = {$set: {title: this.data.title, body: this.data.body}}
      // request mongo to update
      await postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, updateDoc)
      resolve('success')
    } else {
      resolve('failure')
    }
  })
}

Post.getFeed = async function(currentUserId) {
  // get list of user ids that current user is following
  let followedUsers = await followsCollection.find({authorId: new ObjectId(currentUserId)})
    .project({_id:0, authorId:0}).toArray()
    // map each item from object to id
  followedUsers = followedUsers.map(user => user.followedUserId)
  // get posts for authors in list of following user ids
  return Post.queryPosts([
    {$match: {author: {$in: followedUsers}}},
    {$sort: {createdDate: -1}}
  ])
}

// reusable method to query database
// opsArray - unique mongo matching operations
// visitorId - when needed to verify user owns posts
// finalOps - unique mongo sorting operations (note: $sort must go after $project)
Post.queryPosts = function(opsArray, visitorId, finalOps = []) {
  return new Promise(async (resolve, reject) => {
    let aggregateOps = opsArray.concat([
      {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorInfo'}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: '$author',
        author: {$arrayElemAt: ['$authorInfo', 0]}
      }}
    ]).concat(finalOps)
    // retrieve the post associated with the id and author
    let posts = await postsCollection.aggregate(aggregateOps).toArray()
    // clean up author property in post object
    // set author property to have username and gravatar icon
    // .map() creates a new array
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.authorId = undefined
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    resolve(posts)
  })
}

Post.findSingleById = function(postId, visitorId) {
  return new Promise(async (resolve, reject) => {
    // validate id is a not string or invalid mongo _id
    if (typeof(postId) != 'string' || !ObjectId.isValid(postId)) {
      reject()
      return
    }
    let posts = await Post.queryPosts([{$match: {_id: new ObjectId(postId)}}], visitorId)
    // check post is not empty
    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = function(authorId) {
  return Post.queryPosts([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

// delete post from database
Post.delete = function(postId, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postId, currentUserId)
      // check user owns post to delete
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({_id: new ObjectId(postId)})
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

// search request to database
Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    // check search is string
    if (typeof(searchTerm) == 'string') {
      let posts = await Post.queryPosts([
        // find text that contains the search term
        {$match: {$text: {$search: searchTerm}}}
      ],
      undefined, // empty visitor id
      // sort by relevance
      [{$sort: {score: {$meta: 'textScore'}}}]
    )
      resolve(posts)
    } else {
      reject()
    }
  })
}

// return count of posts by author
Post.countPostsByAuthor = function(authorId) {
  return new Promise(async (resolve, reject) => {
      const count = await postsCollection.countDocuments({author: authorId})
      resolve(count)
  })
}

module.exports = Post