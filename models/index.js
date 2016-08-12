'use strict';

var elasticsearch = require('elasticsearch');
var _ = require('lodash');

/*
  For in-depth, elasticsearch api examples, reference:
  https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
*/

module.exports = function(app, fundation) {

  /****************************/
  // Set up

  var config = require('../config')(app);
  var server = _.get(config, 'elasticsearch');
  var options = _.get(config, 'plugins.search');

  if(!server) {
    throw new Error("Supply elasticsearch host in config file.");
  }

  var client = new elasticsearch.Client(server);

  /****************************/
  // Helper functions

  function normalize(params) {
    params.index = params.index || options.index;
    params.type = params.type || options.type;
    params.countPerPage = params.countPerPage || options.countPerPage;
    params.fields = params.fields || options.fields;
    params.searchType = params.searchType || options.searchType;
    return params;
  }

  function isMissing(params, required) {
    if(!params || !_.isObject(params)) {
      return "Supply params object.";
    }

    if(!required || !_.isArray(required)) {
      return "Supply array of required fields.";
    }

    for(var i = 0; i < required.length; i++) {
      var key = required[i];
      if(!_.get(params, key, false)) {
        return "Supply '" + key + "' param.";
      }
    }

    return false;
  }

  isMissing.either = function(params, fields1, fields2) {
    if(!params || !_.isObject(params)) {
      return "Supply params object.";
    }

    var fields1Exist = _.every(fields1, _.partial(_.has, params));
    var fields2Exist = _.every(fields2, _.partial(_.has, params));

    if(!fields1Exist && !fields2Exist) {
      return "Supply either '" + fields1 + "' or '" + fields2 + "' in params.";
    }

    return false;
  };

  /****************************/
  // Search Methods

  var Search = function(options) {
    var name = options.modelName;
    fundation.model[name] = this;
  };

  Search.prototype.get = function(params) {
    var error = isMissing(normalize(params), ['index', 'countPerPage']);
    if (error) return Promise.reject(error);

    error = isMissing.either(normalize(params), ['query'], ['input', 'fields']);
    if (error) return Promise.reject(error);

    try {
      params.page = params.page || 1;
      params.page = parseInt(params.page);
    } catch(e) {
      return Promise.reject(e);
    }

    var defaultQuery = {
      multi_match: {
        query: params.input,
        operator: "or",
        fields: params.fields
      }
    };

    return client.search({
      index: params.index,
      type: params.type,
      searchType: params.searchType,
      body: {
        from: (params.page - 1) * params.countPerPage,
        size: params.countPerPage,
        query: params.query || defaultQuery
      }
    })
    .then(function(result) {
      var hits = _.map(result.hits.hits, function(hit) {
        return hit._source;
      });
      var meta = {
        total_pages: Math.floor(result.hits.total / params.countPerPage),
        current_page: params.page,
        total_hits: result.hits.total
      };
      return {
        hits: hits,
        meta: meta
      }
    });
  };

  Search.prototype.index = function(params) {
    var error = isMissing(normalize(params, this), ['index', 'type', 'body']);
    if (error) return Promise.reject(error);

    var object = {
      index: params.index,
      type: params.type,
      body: params.body
    };

    var id = _.get(params, "body.id");
    if (id) object.id = id;

    return client.index(object);
  };

  Search.prototype.delete = function(params) {
    var error = isMissing(normalize(params, this), ['index', 'type', 'id']);
    if (error) return Promise.reject(error);

    var object = {
      index: params.index,
      type: params.type,
      id: params.id
    }

    return client.delete(object);
  };

  Search.prototype.suggest = function(params) {
    var error = isMissing(normalize(params, this), ['index']);
    if (error) return Promise.reject(error);

    error = isMissing.either(normalize(params), ['suggest'], ['input', 'field']);
    if (error) return Promise.reject(error);

    var defaultSuggest = {
      text: params.input,
      completion: {
        field: params.field,
        size: params.size,
        fuzzy: true
      }
    };

    var options = {
      index: params.index,
      type: params.type,
      body: {
        autocomplete: params.suggest || defaultSuggest
      }
    };

    return client.suggest(options)
    .then(function(result) {
      return result.autocomplete[0].options;
    });
  };

  Search.prototype.bulk = function(params) {
    var error = isMissing(normalize(params, this), ['index', 'type', 'action', 'items'])
    if (error) return Promise.reject(error);

    var body = [];

    _.forEach(params.items, function(item) {
      var action = {
        _index: params.index,
        _type: params.type,
        _id: item.id
      };

      var task = {};
      task[params.action] = action;
      body.push(task);

      if(!_.isEqual(params.action, 'delete')) {
        body.push(item);
      }
    });

    return client.bulk({ body: body });
  };

  Search.prototype.deleteIndex = function(index) {
    if(!index) {
      throw new Error("Must supply index parameter.");
    }
    return client.indices.exists({
      index: index
    })
    .then(function(exists) {
      if(exists) {
        return client.indices.delete({
          index: index
        });
      }
    });
  };

  Search.prototype.createIndex = function(index) {
    return this.deleteIndex(index)
    .then(function() {
      return client.indices.create({
        index: index
      });
    });
  };

  Search.prototype.createMapping = function(mapping) {
    return client.indices.putMapping(mapping);
  };

  Search.prototype.client = client;
  return new Search(options);

}
