/*global exports*/
/**
 * Author:
 *      Siddiq
 *
 * github:
 *      https://github.com/siddiq/couch-getsetgo/
 *
 */

var request = require('request');
var db = {};


/**
 * Remembers a db name for future calls
 *
 * @param {Object} cfg
 * cfg.url The url that points to database e.g. http://somerandomdb123.iriscouch.com/mydb/
 * cfg.mode (optional) If set to "insert", the driver is optimised for fast inserts
 * If set to "update", the driver is optimised for fast updates (default is "update")
 */
exports.connect = function (cfg) {
    if (cfg.debug) {
        db.debug = cfg.debug;
    }

    if (cfg.mode === 'update') {
        db.mode = 'fast-update-mode';
    } else if (cfg.mode === 'insert' || cfg.mode === '') {
        db.mode = 'fast-insert-mode';
    } else {
        console.log('WARNING: Invalid db mode specified ' + cfg.mode + '. Using insert mode.');
        db.mode = 'fast-update-mode';
    }

    if (cfg.url) {
        db.url = cfg.url;
        // Add a trailing slash
        db.url = db.url + (/\/$/.test(db.url) ? '' : '/');
        if (db.debug) {
            var url = db.url.substr(db.url.indexOf('@') + 1);
            console.log('Database url: ' + url);
        }
    } else {
        console.log('ERROR: db url must be specified');
    }
};


/**
 * Reads a document from database
 *
 * @param {String|Object} cfg
 * cfg._id The id of the document to read
 * You can also directly pass id as a string e.g. db.get('mydocid123', cb);
 *
 * @param {Function} callback
 * callback recieves two params: error, doc
 *
 * @param {Object} scope
 */
exports.get = function (cfg, callback, scope) {
    var url;

    scope = scope || this;
    callback = callback || function () {};
    if (typeof (cfg) === 'string') {
        cfg = {_id: cfg};
    }

    url = db.url + cfg._id;

    if (db.debug) {
        console.log('db.get() ' + url);
    }
    request(url, function (error, response, body) {
        if (db.debug >= 2) {
            console.log('error', error);
            console.log('body', body);
        }
        if (!error && response.statusCode == 200) {
            try {
                error = null;
                body = JSON.parse(body);
            } catch (e) {
                error = {
                    error: 'Broken response',
                    response: body
                };
                body = null;
            }
            callback.call(scope, error, body);
        } else {
            callback.call(scope, error, null);
        }
    });
};


/**
 * Removed/deletes a document from database
 *
 * @param {String|Object} cfg
 * cfg._id The id of the document to delete
 * You can also directly pass id as a string e.g. db.get('mydocid123', cb);
 *
 * @param {Function} callback
 * callback recieves only one param: error
 * If error is null the function is successful else its failed
 *
 * @param {Object} scope
 */
exports.remove = function (cfg, callback, scope) {
    scope = scope || this;
    callback = callback || function () {};
    if (typeof (cfg) === 'string') {
        cfg = {_id: cfg};
    }

    var deletef = function (obj, callback, scope) {
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                if (p !== '_id' && p !== '_rev') {
                    delete obj[p];
                }
            }
        }
        obj._deleted = true;
        exports.set(obj, callback, scope); // set and remove have same callback arguments
    };

    if (cfg._rev) {
        deletef(cfg, callback, scope);
    } else {
        exports.get(cfg._id, function (error, doc) {
            if (doc) {
                deletef(doc, callback, scope);
            } else {
                callback.call(scope, {error: "Not found"});
            }
        });
    }
};


/**
 * Saves a document to database
 *
 * @param {Object} obj
 * obj._id The id of the document to write
 * obj._rev The revision of the document to write (optional)
 *
 * @param {Function} callback
 * callback recieves only one param: error
 * If error is null the function is successful else its failed
 *
 * @param {Object} scope
 */
exports.set = function (obj, callback, scope) {
    scope = scope || this;
    callback = callback || function () {};

    var put = function (obj2, callback, scope) {
        request({
            method: 'PUT',
            uri: db.url + obj2._id,
            multipart: [{
                'content-type': 'application/json',
                body: JSON.stringify(obj2)
            }, {
                body: 'attachment'
            }]
        }, function (error, response, body) {
            if (response && (response.statusCode == 200 || response.statusCode == 201)) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    body = {
                        error: 'Broken response'
                    };
                    console.log('Broken response', body);
                }
                if (body.ok && obj2._id === body.id) {
                    // Success
                    obj2._rev = body.rev;
                    callback.call(scope, null);
                } else {
                    // Error. body.ok is not true.
                    callback.call(scope, body);
                }
            } else if (error) {
                // Error
                callback.call(scope, error);
            } else {
                // Error
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    body = {
                        error: response.statusCode
                    };
                }
                callback.call(scope, body);
            }
        });
    };

    // fast updates vs fast inserts. two different modes.
    if (db.mode === 'fast-update-mode') {
        // This is fast update sequence
        if (obj._rev) {
            put(obj, callback, scope);
        } else {
            exports.get(obj._id, function (err, doc) {
                if (doc) {
                    obj._rev = doc._rev;
                    put(obj, callback, scope);
                } else if (err) {
                    callback.call(scope, err);
                } else {
                    // err and doc both are null because doc does not exist
                    put(obj, callback, scope);
                }
            });
        }
    } else if (db.mode === 'fast-insert-mode') {
        // This is fast insert sequence
        put(obj, function (error) {
            if (error && error.error === 'conflict' && error.reason === 'Document update conflict.') {
                // Conflict to handle
                exports.get(obj._id, function (err, doc) {
                    if (doc) {
                        obj._rev = doc._rev;
                        put(obj, callback, scope);
                    } else if (err) {
                        callback.call(scope, err);
                    } else {
                        // This should not happen. The doc was there but now its not there.
                        callback.call(scope, {error: "This should not happen."});
                    }
                });
            } else if (error) {
                // Other error
                callback.call(scope, error);
            } else {
                // Success
                callback.call(scope, null);
            }
        });
    } else {
        // Can never occur
        callback.call(scope, {error: "Invalid db write mode"});
    }
};


/**
 * Shows help
 */
exports.go = function () {
    console.log('Where to go for help:');
    console.log('https://github.com/siddiq/couch-getsetgo/');
};
