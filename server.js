var _ = require('underscore'),
    Backbone = require ('backbone'),
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient;

var Event = Backbone.Model.extend({
});

var Events = Backbone.Collection.extend({
  model: Event,
  initialize: function (options) {
    var events = this;

    events.mongodb = options.mongodb;
    events.remoteCollection = events.mongodb.collection('events');
  },
  sync: function (method, collection, options) {
    var events = this;

    console.log("Syncing ...");

    if (method == "read") {
      events._findEvents(options);
    }
  },
  _findEvents: function (options) {
    var events = this;

    events.remoteCollection.find({}).toArray(function (err, docs) {
      if (err) {
        options.error && options.error(err);
      } else {
        events.set(docs);
        options.success && options.success(docs);
      }
    });
  },
});

var mongoURL = "mongodb://assessment:assessmentEvents2014@ds037977.mongolab.com:37977/events";
MongoClient.connect(mongoURL, function (err, db) {
  assert.equal(null, err); // Full stop if we can't connect

  console.log("Connected to MongoDB at " + mongoURL);

  var events = new Events({ mongodb: db });
  events.fetch({
    success: function (collection, docs, options) {
      console.log("Fetched successfully!");
      console.dir(docs);
      db.close();
    },
    error: function (collection, err, options) {
      console.log("Error while fetching.");
      console.dir(err);
      db.close();
    }
  });

});

/*
var insertDocuments = function (db, callback) {
  var collection = db.collection('documents');
  collection.insert([
    {a: 1}, {a: 2}, {a: 3}
  ], function (err, result) {
    assert.equal(null, err);

    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted successfully!");
    callback(result);
  });
};

var updateDocuments = function (db, callback) {
  var collection = db.collection('documents');
  collection.update({ a : 2 },
    { $set: { b : 1 } },
    function (err, result) {
      assert.equal(null, err);

      assert.equal(1, result.result.n);
      console.log("Updated!");
      callback(result);
    }
  );
};

var findDocuments = function (db, callback) {
  var collection = db.collection('events');
  collection.find({}).toArray(function (err, docs) {
    assert.equal(null, err);

    //assert.equal(2, docs.length);

    console.log("Found docs!");
    console.dir(docs);
    callback(docs);
  });
};
var url = "mongodb://assessment:assessmentEvents2014@ds037977.mongolab.com:37977/events";
MongoClient.connect(url, function (err, db) {
  assert.equal(null, err);

  console.log("Connected!");

  insertDocuments(db, function () {
    updateDocuments(db, function () {
      findDocuments(db, function () {
        db.close();
      });
    });
  });
});
*/
