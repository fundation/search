'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var config = app.get('config');

  var defaults = {
    plugins: {
      search: {
        countPerPage: 24,
        mountPath: "/search",
        modelName: "search",
        route: true
      }
    }
  };

  return _.merge({}, defaults, config);
}
