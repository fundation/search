'use strict';

var express = require('express');

/*
  https://github.com/krakenjs/meddleware/issues/57
  https://github.com/krakenjs/express-enrouten/issues/72

  This explains the technique of popping the mounted subapp off the stack.
  Basically, it gives you access to the parent app without having to pass it in.
*/

function FundationSearch (fundation) {
  var app = express();

  app.once('mount', function (parent) {

    // Remove sacrificial express app
    parent._router.stack.pop();

    // Middleware
    require('./models')(parent, fundation);
    require('./controllers')(parent, fundation);

  });

  return app;
}

module.exports = FundationSearch;
