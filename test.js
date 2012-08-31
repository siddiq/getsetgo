/*global exports*/
/**
 * Author:
 *      Siddiq
 *
 * github:
 *      https://github.com/siddiq/couch-getsetgo/
 *
 */

var db = require('./couch-getsetgo.js');

var dburl = 'http://getsetgo.cloudant.com/test';

var sessionId = Math.round(Math.random() * 1000000).toString(16);


// ----------------------- Test cases ----------------------- //

var testCases = {
    connection_insert_optimized: function (callback) {
        db.connect({url: dburl, mode: 'insert'});
        callback(true);
    },
    simple_set: function (callback) {
        var myId = sessionId + '-obj1';
        db.set({_id: myId, name: "myName", score: "myScore"}, function (err) {
            if (err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    },
    simple_get: function (callback) {
        var myId = sessionId + '-obj1';
        db.get(myId, function (err, doc) {
            if (doc) {
                callback(true);
            } else {
                callback(false);
            }
        });
    },
    get_something_that_does_not_exist: function (callback) {
        var myId = 'stupid-id-that-does-not-exist';
        db.get(myId, function (err, doc) {
            console.log(err, doc);
            if (doc) {
                // should not happen
                callback(false);
            } else {
                // Correct behavior
                callback(true);
            }
        });
    },
    set_get_sequence: function (callback) {
        var myId = sessionId + '-obj2',
            myName = Math.round(Math.random() * 1000000).toString(16),
            myScore = Math.round(Math.random() * 1000000),
            obj = {
                _id: myId,
                name: myName,
                score: myScore
            };

        db.set(obj, function (err) {
            if (err) {
                console.log('Cant save doc with id', myId);
                callback(false);
            } else {
                db.get(myId, function (err, doc) {
                    if (doc) {
                        // check if its same obj
                        if (doc.name === myName && doc.score === myScore && doc._id === myId) {
                            callback(true);
                        } else {
                            console.log('Object not same');
                            callback(false);
                        }
                    } else {
                        console.log('No doc found with id ' + myId);
                        callback(false);
                    }
                });
            }
        });
    },
    update_existing: function (callback) {
        var myId = sessionId + '-obj3',
            obj = {
                _id: myId,
                name: "first name"
            };

        db.set(obj, function (err) {
            if (err) {
                console.log('Cant save doc with id', myId);
                callback(false);
            } else {
                obj.name = "second name";
                db.set(obj, function (err) {
                    if (err) {
                        console.log('Cant save doc with id. Overwrite doesnt work?', myId);
                        console.log(obj);
                        console.log(err);
                        callback(false);
                    } else {
                        db.get(myId, function (err, doc) {
                            if (doc) {
                                if (doc.name === "second name" && doc._id === myId) {
                                    callback(true);
                                } else {
                                    console.log('Object not same');
                                    callback(false);
                                }
                            } else {
                                console.log('No doc found with id ' + myId);
                                callback(false);
                            }
                        });
                    }
                });
            }
        });
    },
    remove_objects: function (callback) {
        var arr = [sessionId + '-obj1',
                    sessionId + '-obj2',
                    sessionId + '-obj3'],
            delfunc,
            allSuccess = true,
            counter = 0,
            length = arr.length;

        delfunc = function () {
            var item = arr.pop();
            if (item) {
                console.log((++counter) + '/' + length + ' -> ' + item);

                db.remove(item, function (err) {
                    if (err) {
                        console.log('err', err);
                        console.log('this testcase will be failed');
                        allSuccess = false;
                    }

                    delfunc();
                });
            } else {
                callback(allSuccess);
            }
        };

        // start deleting
        delfunc();
    },
    connection_update_optimized: function (callback) {
        db.connect({url: dburl, mode: 'update'});
        callback(true);
    },
};

// Duplicate some of the testcases to run in the update optimized mode
testCases.simple_set_u = testCases.simple_set;
testCases.set_get_sequence_u = testCases.set_get_sequence;
testCases.update_existing_u = testCases.update_existing;
testCases.remove_objects_u = testCases.remove_objects;


// ----------------------- Test case runner ----------------------- //
var t,
    testCaseArr = [],
    suiteSuccess = true;
for (t in testCases) {
    if (testCases.hasOwnProperty(t)) {
        testCaseArr.push(t);
    }
}

console.log(testCaseArr);


var runTestCases = function (testCaseArr, testNum) {
    testNum = testNum || 0;
    if (testNum >= testCaseArr.length) {
        // Finish
        console.log("Test Suite: " + (suiteSuccess ? "SUCCESS": "FAIL"));
        return;
    }

    var name = testCaseArr[testNum];
    console.log(name);
    testCases[name](function (success) {
        // suiteSuccess
        suiteSuccess = suiteSuccess && success;

        // Print report
        console.log(success ? "SUCCESS": "FAIL");
        console.log("");

        // Call next testcase
        runTestCases(testCaseArr, testNum + 1);
    });
};

runTestCases(testCaseArr);

// ----------------------- End ----------------------- //
