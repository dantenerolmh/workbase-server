import { Index, MongoDBEngine } from 'meteor/easy:search';

ThreadsIndex = new Index({
  collection: Threads,
  fields: ['subject'],
  defaultSearchOptions: {limit: 15},
  engine: new MongoDBEngine({
    sort: () => { updatedAt: -1 },
    clientSort: () => { updatedAt: -1 },
    permission: (options) => options.userId,
    selector(searchObject, options, aggregation) {
      // retrieve the default selector
      const selector = this.defaultConfiguration().selector(searchObject, options, aggregation);

      selector.category = {$nin: ['Account', 'Shared']};
      selector.scope = {$ne: 'admin'};
      // options.search.userId contains the userId of the logged in user
      let threadIds = ThreadUsers.find({userType: 'Users', userId: options.search.userId}).map((tu) => tu.threadId);
      selector._id = {$in: threadIds};
      // console.log(selector['$or'][0].subject);
      return selector;
    },
    // selectorPerField(field, searchString) {
    //   if (field === 'subject') {
    //     return {
    //       subject: {$regex: '.*' + searchString + '.*', '$options': 'i'}
    //     }
    //   }
    //   return this.defaultConfiguration().selectorPerField(field, searchString);
    // },
    beforePublish(action, doc) {
      // always return the document
      if (doc.lastMessageId) {
        doc.lastMessage = Messages.findOne(doc.lastMessageId);
      }

      return doc;
    },
    transform(doc) {
      doc.read = true; // TEMP
      return Threads._transform(doc);
      // return doc;
    }
  })
});

MessagesIndex = new Index({
  collection: Messages,
  fields: ['content'],
  defaultSearchOptions: {limit: 15},
  engine: new MongoDBEngine({
    sort: () => { createdAt: -1 },
    clientSort: () => { createdAt: -1 },
    selector(searchObject, options, aggregation) {
      const selector = this.defaultConfiguration().selector(searchObject, options, aggregation);
      if (options.search.props.threadId) {
        selector.threadId = options.search.props.threadId;
      }
      return selector;
    },
    transform(doc) {
      return Messages._transform(doc);
    }
  })
});
