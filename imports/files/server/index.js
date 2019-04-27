import './files';
import './avatar-files';

Files.collection.before.insert(function(userId, doc) {
  _.extend(doc, {createdAt: new Date()});
});

const updateRelations = (message, type, fileIds) => {
  // 两种情况
  // 1 新消息：更改关系的messageId
  // 2 非新消息（转发等）：添加一条关系
  let count = Files.collection.update({
    _id: {$in: fileIds},
    "meta.relations.messageId": null
  }, {
    $set: {
      "meta.relations.$.threadId":  message.threadId,
      "meta.relations.$.messageId": message._id
    }
  }, {multi: true});

  if (count === 0) {
    Files.collection.update({
      _id: {$in: fileIds}
    }, {
      $push: {
        "meta.relations": {
          threadId:  message.threadId,
          messageId: message._id,
          userType:  message.userType,
          userId:    message.userId,
          type,
          createdAt: new Date()
        }
      }
    }, {multi: true});
  }
};

const removeFiles = (message) => {
  Files.find({_id: {$in: _.union(message.fileIds, message.inlineFileIds)}}).forEach((file) => {
    Files.collection.update(file._id, {$pull: {"meta.relations": {messageId: message._id}}});
    file = Files.findOne(file._id);
    if (file.meta && file.meta.relations && file.meta.relations.length == 0) {
      Files.remove(file._id);
    }
  });
};

Messages.after.insert(function(userId, doc) {
  let message = this.transform();
  if (!_.isEmpty(doc.fileIds)) {
    updateRelations(message, 'file', doc.fileIds);
  }
  if (!_.isEmpty(doc.inlineFileIds)) {
    updateRelations(message, 'inline', doc.inlineFileIds);
  }
});

Messages.after.remove(function(userId, doc) {
  removeFiles(doc);
});

Meteor.publish("files.pending", function() {
  return Files.find({"meta.relations": {$elemMatch: {threadId: null, userId: this.userId, messageId: null}}}).cursor;
});

Meteor.publish("thread.files.pending", function(threadId) {
  check(threadId, String);

  return Files.find({"meta.relations": {$elemMatch: {threadId, userId: this.userId, messageId: null}}}).cursor;
});

Meteor.publish("thread.files", function(threadId) {
  check(threadId, String);

  let query = {"meta.relations": {$elemMatch: {threadId, messageId: {$exists: true}}}};
  Counts.publish(this, `count-files-${threadId}`, Files.find(query).cursor);
  return Files.find(query, {sort: {createdAt: -1}, limit: 12}).cursor;
});

const MIN_FILES = 20;
const MAX_FILES = 200;
Meteor.publish("files", function(options) {
  check(options, Match.Maybe({
    limit: Match.Maybe(Number)
  }));

  Counts.publish(this, 'count-files', Files.find({}).cursor);
  let limit = options && options.limit || MIN_FILES;
  return Files.find({}, {sort: {createdAt: -1}, limit: Math.min(limit, MAX_FILES)}).cursor;
});

Meteor.methods({
  "files.updateFilename"(id, filename) {
    check(id, String);
    check(filename, String);
    Files.collection.update(id, {$set: {name: filename}});
  },
  "files.remove"(id) {
    check(id, String);
    Files.remove({_id: id, userId: this.userId}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("file removed: " + id);
      }
    });
  }
});
