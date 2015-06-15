var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

var insertDocuments = function (db, callback) {
  var collection = db.collection('documents');
  collection.insert([
    {a: 1}, {b: 2}, {c: 3}
  ], function (err, result) {
    assert.equal(null, err);

    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted successfully!");
    callback(result);
  });

};

var url = "mongodb://assessment:assessmentEvents2014@ds037977.mongolab.com:37977/events";
MongoClient.connect(url, function (err, db) {
  assert.equal(null, err);

  console.log("Connected!");

  insertDocuments(db, function () {
    db.close();
  });
});
