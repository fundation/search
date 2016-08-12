'use strict';

var _ = require('lodash');
var expect = require('chai').expect;
var sinon = require('sinon');

/**********************************/
// config mock

var config = {
  elasticsearch: {
    host: 'test.domain.com:9200',
  },
  plugins: {
    search: {
      index: 'cookies',
      countPerPage: 3
    }
  }
};

var app = function(options) {
  return {
    get: function(key) {
      if(key === 'config') {
        return options || config;
      }
      else return undefined;
    }
  };
}

/**********************************/
// elasticsearch mock

var elasticsearch = {
  Client: function(server) {
    expect(server).to.contain.all.keys(['host']);
  }
};

elasticsearch.Client.prototype.search = function() { };
elasticsearch.Client.prototype.suggest = function() { };
elasticsearch.Client.prototype.index = function() { };

/**********************************/
// fundation mock

var fundation = { model: { } };

/**********************************/
// preparing utils

module.exports = {

  // custom mocks
  elasticsearch: elasticsearch,
  fundation: fundation,
  app: app,

  // helper functions
  errorExists: function(callback) {
    try {
      callback()
    } catch (e) {
      expect(e).to.exist;
    }
  },
  noErrorExists: function(callback) {
    try {
      callback()
    } catch (e) {
      expect(e).to.not.exist;
    }
  },
  stubSearch: function(callback) {
    var subject = sinon.stub(elasticsearch.Client.prototype, 'search', function (params) {
      return new Promise(function(resolve, reject) {
        try {
          var results = {};
          results.hits = {};
          results.hits.hits = callback(params);
          results.hits.hits = _.map(results.hits.hits, function(hit) { return { _source: hit }});
          results.hits.total = results.hits.hits.length;
          resolve(results);
        } catch (e) {
          reject(e);
        }
      });
    });
    return subject;
  }
};
