'use strict';

var path = require('path');
var _ = require('lodash');

module.exports = function (app, fundation) {

  var config = require('../config')(app);
  var options = _.get(config, "plugins.search");
  var search = fundation.model[options.modelName];

  var sampleSwig = path.resolve(__dirname, '../views/index.swig');
  var pathToSwig = options.viewFile ? path.resolve(app.get('views') + '/' + options.viewFile) : sampleSwig;

  if(options.route) {
    app.route(options.mountPath)
    .get(function (req, res, next) {
      search.get({
        input: req.query.q,
        page: req.query.page
      })
      .then(function(results) {
        var activeUrl = req.url.split('?').shift() + "?q=" + req.query.q;
        res.render(pathToSwig, {
          query: req.query.q,
          articles: results.hits,
          meta: results.meta,
          activeUrl: activeUrl,
          paginate: true
        });
      })
      .catch(function(err) {
        res.render(pathToSwig, {
          query: req.query.q,
          articles: [],
          meta: {}
        });
      });
    });
  }

}
