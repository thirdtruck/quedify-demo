var _ = require('underscore'),
    Backbone = require ('backbone'),
    assert = require('assert'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    express = require('express'),
    BodyParser = require('body-parser'),
    async = require('async');

var Event = Backbone.Model.extend({
  idAttribute: "_id",
  defaults: {
    "title": null,
    "from": null,
    "to": null,
    "location": null,
    "description": null,
    "participants": [],
  },
});

var startServer = function (events) {
  var app = express();
  app.use(BodyParser.json());
  app.use(express.static('public'));

  app.get('/events', function (req, res) {
    var searchQuery = { owner: "James" };

    var titleStartsWith = req.query.titleStartsWith;

    if (titleStartsWith) {
      searchQuery.title = { $regex: '^' + titleStartsWith, $options: 'i' };
    };

    events.remoteCollection.find(searchQuery).toArray(function (err, result) {
      if (err) {
        console.log("Unable to fetch events: ", err);
        res.send("Error: " + err);
      } else {
        console.log("Fetched events");
        console.dir(result)
        res.json(result);
      }
    });
  });

  app.post('/events', function (req, res) {
    var newEvent = req.body;
    newEvent.owner = "James";
    events.remoteCollection.insert(newEvent, function (err, result) {
      if (err) {
        console.log("Unable to create event: ", err);
        res.send("Error: " + err);
      } else {
        var id = result.ops[0]._id;
        console.log("Created event with ID " + id);
        res.send("Created new event with ID: " + id);
      }
    });
  });

  var createEvent = function (newAttributes, onSuccess, onError) {
    delete newAttributes._id; // We don't want it inserting a record with a null ID
    newAttributes.owner = "James";

    events.remoteCollection.insert(
      newAttributes,
      function (err, result) {
        if (err) {
          console.log("Unable to create event: ", err);
          onError(err);
        } else {
          console.log("Created event");
          onSuccess(result);
        }
      });
  };

  var updateEvent = function (updatedAttributes, onSuccess, onError) {
    var id = updatedAttributes._id;
    events.remoteCollection.find({ owner: "James", _id: id }).toArray(function (err, result) {
      if (err) {
        console.log("Error while finding event with ID " + id);
        onError(err);
      } else if (result.length === 0) {
        console.log("Found no record with ID " + id + " to update");
        onError("Found no record with ID " + id + " to update");
      } else {
        events.remoteCollection.update(
          { _id: id },
          { $set: updatedAttributes },
          function (err, result) {
            if (err) {
              console.log("Unable to update event: ", err);
              onError(err);
            } else {
              console.log("Update event with ID " + id);
              onSuccess(result);
            }
          });
      }
    });
  };

  app.put('/events', function (req, res) {
    // TODO: Make this a batch operation
    var onComplete = function (err, results) {
      if (err) {
        console.log("Unable to update events: ", err);
        res.send("Error: " + err);
      } else {
        console.log("Updated events");
        res.send("Updated events");
      }
    };

    var onEachEvent = function (updatedAttributes, callback) {
      if (updatedAttributes._id) { // Existing event
        updatedAttributes._id = new ObjectID(updatedAttributes._id);
        updateEvent(updatedAttributes,
          function (err) { callback(err); },
          function (result) { callback(null, result) }
        );
      } else { // New event
        createEvent(updatedAttributes,
          function (err) { callback(err); },
          function (result) { callback(null, result) }
        );
      }
    };

    async.map(req.body, onEachEvent, onComplete);
  });

  app.put('/events/:id', function (req, res) {
    var updatedAttributes = req.body;
    updatedAttributes._id = new ObjectID(req.params.id);
    updateEvent(updatedAttributes,
      function (err) { res.send("Error: " + err); },
      function (result) { res.send("Updated event with ID: " + id); }
    );
  });

  app.delete('/events/:id', function (req, res) {
    var id = new ObjectID(req.params.id);
    events.remoteCollection.remove(
      { _id: id },
      function (err, result) {
        if (err) {
          console.log("Unable to delete event with ID " + id + ":", err);
          res.send("Error: " + err);
        } else {
          console.log("Deleted event with ID " + id);
          res.send("Deleted event with ID " + id);
        }
      });
  });

  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Listening at http://%s:%s.", host, port);
  });
};

var mongoURL = "mongodb://assessment:assessmentEvents2014@ds037977.mongolab.com:37977/events";
MongoClient.connect(mongoURL, function (err, db) {
  assert.equal(null, err); // Full stop if we can't connect

  console.log("Connected to MongoDB at " + mongoURL);

  startServer({
    mongodb: db,
    remoteCollection: db.collection('events'),
  });
});
