app.service('Persistence', function($q, $ionicPlatform, $cordovaSQLite){

  self = this;

  persistence.store.cordovasql.config(
    persistence,
    'ePoem.db',
    '1.0',                  // DB version
    'ePoem DB',             // DB display name
    5 * 1024 * 1024,        // DB size (WebSQL fallback only)
    0,                      // SQLitePlugin Background processing disabled
    2                       // DB location (iOS only), 0 (default): Documents (iTunes+iCloud), 1: Library (NO iTunes + iCloud), 2: Library/LocalDatabase (NO iTunes + NO iCloud)
  );

  var entities = {};

  entities.Poem = persistence.define('Poem', {
    title: 'TEXT',
    text: 'TEXT',
    date: 'DATE',
    wishlist: 'BOOL',
    heart: 'BOOL',
    saved: 'BOOL'
  });

  entities.Author = persistence.define('Author', {
    name: 'TEXT',
    bio: 'TEXT',
    picture: 'TEXT',
    birth: 'DATE',
    death: 'DATE',
    saved: 'BOOL'
  });

  entities.Author.hasMany('poems', entities.Poem, 'author');

  entities.Poem.hasOne('author', entities.Author, 'poems');

  entities.Poem.index('wishlist');
  entities.Poem.index('heart');
  entities.Poem.index('saved');
  // avoid duplicates during dev, when in prod should probably be ['title', 'author']
  entities.Poem.index('title', {unique: true});
  entities.Author.index('name', {unique: true});

  var schemaSynced = $q.defer();
  persistence.schemaSync(function() {
    schemaSynced.resolve();
  });

  self.schemaSynced = schemaSynced.promise;

  self.Entities = entities;

  self.add = function(entity) {
    var finished = $q.defer();
    persistence.add(entity);
    persistence.flush(function() {
      finished.resolve();
    });
    return finished.promise;
  };

  var preloaded = $q.defer();

  self.preload = function() {
    var promises = [];
    for (var i = 0; i < poems.length; i++) {
      var poemEntity = new self.Entities.Poem(poems[i]);
      promises.push(self.add(poemEntity));
    }
    return $q.all(promises).then(function(){
      preloaded.resolve();
    });
  };

  self.preloaded = preloaded.promise;


  /*
   * A wrapper for executing custom queries through persistence.js
   */
  self.query = function (query, parameters) {
    parameters = parameters || [];
    var q = $q.defer();

    var ready = $q.defer();

    $q.all([self.schemaSynced, self.preloaded]).then(function(){
      persistence.db.conn.transaction(function(sqlt){
        sqlt.executeSql(
          query,
          parameters,
          function(result){ q.resolve(result); },
          function(error){ q.reject(error); }
        );
      });
    });
    return q.promise;
  };

  var authors = [
    new self.Entities.Author({
      name: 'Charles Baudelaire',
      bio: 'Charles était un type d\'enfer.',
      picture: null,
      birth: '2015-03-02',
      death: '2015-03-12',
      saved: true
    }),
    new self.Entities.Author({
      name: 'Boris Vian',
      bio: 'Anagramme de Bison Ravi, Boris Vian le Transcendant Satrape savait rigoler.',
      picture: null,
      birth: '2015-02-02',
      death: '2015-06-02',
      saved: false
    }),
  ];

  var poems = [
    {
      title: 'Je voudrais pas crever',
      text: 'Je voudrais pas crever avant d\'avoir connu les chiens noirs du Mexique, qui dorment sans rêver...',
      date: null,
      wishlist: false,
      heart: true,
      saved: true,
      author: authors[1]
    },
    {
      title: 'Une Charogne',
      text: 'Rappelez-vous l\'objet que nous vîmes, mon âme, ce beau matin d\'été si doux...',
      date: null,
      wishlist: false,
      heart: true,
      saved: true,
      author: authors[0]
    },
    {
      title: 'La mer',
      text: 'Honnête homme, toujours tu chériras la mer...',
      date: null,
      wishlist: true,
      heart: false,
      saved: false,
      author: authors[0]
    },
  ];
});
