couch-getsetgo
==============

Easy to use couchdb driver.
Couchdb becomes a simple keystore.

Install:
=======
```
npm install couch-getsetgo
```

Verify:
======
```
cd node_modules/couch-getsetgo/
node test.js
```

Examples:
=========
```
db.connect({url: 'http://getsetgo-test.iriscouch.com/test'});
```

Write:
=========
Inserts new doc or update existing.
```
doc = {_id: '12345', x: 1, y: 2};

db.set( doc );
```

Read:
=========
```
db.get('12345', function (err, doc) {
  if (doc) {
    // Success
  }
});
```

Full Example:
=========
```
db.connect({url: 'http://getsetgo-test.iriscouch.com/test'});

doc1 = {_id: '12345', x: 1, y: 2};

db.set(doc1, function (err) {
  if (!err) {
     //Successfully saved
    db.get('12345', function (err, doc2) {
      if (doc2) {
        // Success
        console.log(doc2);
      }
    });
  }
});
```

Relax !
=====