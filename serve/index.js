function auth(req, res, next) {
  if (~['GET', 'HEAD'].indeOf(req.method.toUpperCase())) {
    next();
  }
}

var utils = require('./utils');

module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

  app.all('/*', utils.navbar);

  app.get('/', function(req, res, next) {
    res.render('index');
  });
  app.post('/', function(req, res, next) {
    var uid = utils.url2uid(req.body.uid);
    if (!uid) res.redirect('/');
    res.redirect('/people/' + uid + '/');
  });

  app.post('/queue', utils.getUser({
    redir: '/',
  }), function(req, res, next) {
    var uid = res.data.uid;
    var user = res.data.people;

    if (!user) {
      res.redirect('/people/' + uid + '/');
      return;
    }

    var uid = user.uid || user.id;

    tasks.interest.collect_book({
      user: user, 
      force: 'force' in req.body,
      success: function(people) {
        tasks.compute({
          user: people,
          force: true
        });
      }
    });

    user.reset(function() {
      res.redirect('/people/' + uid + '/');
    });
  });

  ['people', 'api', 'misc'].forEach(function(item) {
    require('./' + item)(app, central);
  });

  //var raven = require('raven');
  //app.use(raven.middleware.express(central.raven.client));
  app.use(utils.errorHandler({ dump: central.conf.debug }));
  app.use(utils.errorHandler.notFound);
};
