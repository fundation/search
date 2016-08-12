'use strict';

var _ = require('lodash');
var sinon = require('sinon');
var assert = require('chai').assert;
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var testUtils = require('./testUtils');
var collection = require('./validation/collection.json');
var metadata = require('./validation/metadata.json');
var entry = require('./validation/entry.json');


describe('Search Plugin Tests', function () {

  /**********************************/
  // configuration

  describe(' - Config - ', function () {

    var plugin;

    before(function(done) {
      plugin = require('../models');
      done();
    });

    it('should return error if empty configs', function(done) {
      testUtils.errorExists(function() {
        var search = plugin({});
        expect(search).to.not.exist;
      });
      done();
    });

    it('should return error if app is not supplied', function(done) {
      testUtils.errorExists(function() {
        var search = plugin();
        expect(search).to.not.exist;
      });
      done();
    });

    it('should create search object if correct configs', function(done) {
      testUtils.noErrorExists(function() {
        var search = plugin(testUtils.app(), testUtils.fundation);
        expect(search).to.exist;
      });
      done();
    });
  });

  /**********************************/
  // get method

  describe(' - Get - ', function () {

    var search, stub;

    beforeEach(function() {
      search = proxyquire('../models', {
        'elasticsearch': _.merge({}, testUtils.elasticsearch)
      })(testUtils.app(), testUtils.fundation);
    });

    afterEach(function() {
      if(stub && _.isFunction(stub.restore)) {
        stub.restore();
      }
    });

    it('should return error if not correct params', function() {
      var config = {
        elasticsearch: {
          host: "domain:port"
        }
      };

      search = proxyquire('../models', {
        'elasticsearch': _.merge({}, testUtils.elasticsearch)
      })(testUtils.app(config), testUtils.fundation);

      return search.get({})
      .then(function(res) {
        expect(res).to.not.exist;
      })
      .catch(function(e) {
        expect(e).to.exist;
      });
    });

    it('should be able to page', function() {
      stub = testUtils.stubSearch(function(params) {
        var page = _.get(params, 'page');
        var hits = page && page === 1 ? collection.slice(0, 2) : collection.slice(3, 2);
        return hits;
      });

      var options = {
        type: 'article',
        query: {},
        page: 1
      };

      return search.get(options)
      .then(function(res1) {
        options.page = 2;
        return search.get(options)
        .then(function(res2) {
          expect(res1).to.exist;
          expect(res2).to.exist;
          expect(res1).to.not.deep.equal(res2);
          sinon.assert.calledTwice(stub);
        });
      });
    });

    // it should return correct formatted meta object
    it('should return formatted meta object and content', function() {
      stub = testUtils.stubSearch(function(params) {
        return collection;
      });

      var options = {
        type: 'article',
        query: {}
      };

      return search.get(options)
      .then(function(res) {
        expect(res).to.exist;
        expect(res.meta).to.exist;
        expect(res.meta).to.have.all.keys(_.keys(metadata));
        expect(res.hits).to.exist;
        expect(res.hits).to.be.a('array')
        expect(res.hits.length).to.be.above(0);
        expect(res.hits[0]).to.have.all.keys(_.keys(entry));
        sinon.assert.calledOnce(stub);
      })
    });

    it('should return empty hits if failed search', function() {
      stub = testUtils.stubSearch(function(params) {
        return [];
      })

      var options = {
        type: 'article',
        query: {}
      };

      return search.get(options)
      .then(function(res) {
        expect(res).to.exist;
        expect(res.hits.length).to.equal(0);
        sinon.assert.calledOnce(stub);
      })
    });

    it('should override index if passed in params', function() {
      stub = testUtils.stubSearch(function(params) {
        return (params.index === 'override') ? collection : [];
      });

      var options = {
        type: 'article',
        index: 'override',
        query: {}
      };

      return search.get(options)
      .then(function(res) {
        expect(res).to.exist;
        expect(res.hits.length).to.be.above(0);
        sinon.assert.calledOnce(stub);
      });
    });
  });

  describe('Index', function () {
    // Todo
  });

  describe('Delete', function () {
    // Todo
  });

  describe('Suggest', function () {
    // Todo
  });

  describe('Bulk', function () {
    // Todo
  });

  describe('DeleteIndex', function () {
    // Todo
  });

  describe('CreateIndex', function () {
    // Todo
  });

  describe('CreateMapping', function () {
    // Todo
  });

});
