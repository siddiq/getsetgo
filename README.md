couch-getsetgo
==============

Easy to use couchdb driver.
Couchdb becomes a simple keystore.

Connecting:
=========
```
db.connect({url: 'http://getsetgo-test.iriscouch.com/test'});
```

Write:
=========
Inserts new doc or update existing.
```
db.set({_id: '12345', name: 'Siddiq', score: 1000});
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

db.set({_id: '12345', name: 'Siddiq', score: 2000}, function (err) {
  if (!err) {
     //Successfully saved
    db.get('12345', function (err, doc) {
      if (doc) {
        // Success
        console.log(doc);
      }
    });
  }
});
```

Relax:
=====