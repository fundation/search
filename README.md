# fundation-search
A search plugin for fundation that includes elasticsearch functionality right out of the box.

## Table of Contents
- **[Installation](#installation)** 
- **[Basic Usage](#basic-usage)**
- **[Custom Usage](#custom-usage)**
- **[Configs](#configs)** 
- **[Model API](#model-api)**
- **[Elasticsearch Client](#elasticsearch-client)**

***

## Installation
```
npm install fundation-search

// or

npm install git://github.com/fundation/search.git
```

***

## Basic Usage
1. Inside app.js, add fundation-search to the list of plugins
    ```javascript
    // app.js
    app.use(fundation.init(null, [
        require('fundation-search')
    ]));
    ```

2. Inside config.js, add the elasticsearch configs
    ```javascript
    // config.js
    module.exports = {
        // ...
        elasticsearch: {
            host: 'test.domain.com:9200'
        }
    }
    ```

3. Inside of config.js, add the following heirarchy if it didn't already exist (config.plugins.search). For the default controller to work, the required params are ['index', 'fields']. Note that if you decide to use a custom controller, these parameters are not required as explained further below.
    ```javascript
    // config.js
    module.exports = {
        // ...
        plugins: {
            search: {
                index: 'website',
                fields: ['field1', 'field2']
            }
        }
    }
    ```

3. Make sure that Elasticsearch is populated with the proper indices, types, mappings, and actual entries. If needed, the search model apis can be used to do this initialization. If you are new to Elasticsearch, I recommend referencing the [Elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) to understand how to organize the index/type relationships and what to include in the mappings.
    ```javascript
    // node.js import script
    var search = require('fundation').model.search;
    search.createIndex('website')
    .then(function() {
        var articleMapping = { 
            index: 'website',
            type: 'article',
            body: { /*...*/ }
        };
        return search.createMapping(articleMapping);
    })
    .then(function() {
        var articles = [ /*...*/ ]; 
        return search.bulk({
            index: 'website',
            type: 'article',
            action: 'index',
            items: articles
        });
    });
    ```
    
4. Going through the above process should get the search plugin working and results successfully returning. However, you will notice that the default view is pretty bare bones. It will be up to you to replace it with a custom, better-looking swig template for production. Additionally, the default controller should be sufficient in basic search cases, but will likely not be sufficient for more complex searches. In these cases, you can easily create your own search controller using the search model api as described below.

***

## Custom Usage
In some cases, users may want to override the provided default options.

#### View
The default swig template provides an example of how to present the search results. It is for testing only and not to be used in production.

1. To override the default view, use the `viewFile` config which should contain the swig template filename inside of the `views/` folder.  
    
    ```javascript
    // config.plugins.search
    {
        viewFile: 'search.swig'
    }
    ```

#### Controller
The default controller performs a simple search using the ['index', 'fields'] values from the config.js. 

1. By default, the controller mounts the route on the '/search' url path. To override this, pass a new url path to the `mountPath` config.
    
    ```javascript
    // config.plugins.search
    {
        mountPath: '/new-search-url'
    }
    ```
    ```javascript
    // browser
    localhost:8080/new-search-url
    ```

2. To prevent the controller from adding any route at all, use the `route` config. (Use this when defining your own controller/route)  
    ```javascript
    // config.plugins.search
    {
        route: false
    }
    ```

#### Model
The model is attached to the 'search' field of the fundation.model object and accessed normally (ex. `require('fundation').model.search`). It uses the elasticsearch npm module and provides the core functionality of the plugin.

1. To change the name used to access the search model, use the `modelName` config.  
    
    ```javascript
    // config.plugins.search
    {
        modelName: 'searcher'
    }
    ```
    ```javascript
    // controller.js
    var search = require('fundation').model.searcher;
    ```

***

## Configs
This is a list of all the possible options that can be provided in the fundation-search plugin configs.

#### > `index`
**Value**: String  
**Purpose**: To determine which 'index' in Elasticsearch to insert/update/search by.  
**Note**: This value is required for the default controller and optional for custom controllers.  

#### > `type`
**Value**: String  
**Purpose**: To determine which 'type' in Elasticsearch to insert/update/search by.  
**Note**: This value is optional.

#### > `fields`
**Value**: [String]  
**Purpose**: To determine which fields (originally defined in the object mapping) to search by.  
**Note**: This value is required for the default controller and optional for custom controllers.   

#### > `countPerPage`
**Value**: Integer  
**Default**: 12    
**Purpose**: To determine how many items should be returned on each page.  
**Note**: This value is optional. 

#### > `searchType`  
**Value**: String  
**Default**: 'query_then_fetch'  
**Purpose**: To determine what type of search to make (ex. 'query_then_fetch', 'count', 'scan', etc.)   
**Note**: This value is optional.  

#### > `modelName`
**Value**: String  
**Default**: 'search'  
**Purpose**: To override the default name of the search model.  
**Note**: This value is optional.  

#### > `mountPath`
**Value**: String  
**Default**: '/search'  
**Purpose**: To override the path of the default controller route.  
**Note**: This value is optional.  

#### > `viewFile`
**Value**: String  
**Purpose**: To override the swig file being rendered by the default controller.  
**Note**: This value is optional.  

#### > `route`
**Value**: Boolean  
**Default**: true  
**Purpose**: To indicate whether or not the default controller route should be attached to the Express instance. (enables/disables the default controller)  
**Note**: This value is optional.  

***

## Model API

#### => get(`Object`)  
**Description**: Search for entries in the Elasticsearch database.  
**Param**: Object that can contain the following keys  

1. `index`   
  * Purpose: To indicate which index to search by  
  * Notes: Passing it in here will override the `index' value provided in the configs (Must be in at least one of the two)
2. `type`
  * Purpose: To indicate which type to search by    
  * Notes: Passing it in here will override the `type` value provided in the configs (Must be in at least one of the two)   
3. `countPerPage`  
  * Purpose: To determine how many items should be returned on each page.
  * Notes:  Passing it in here will override the `countPerPage`value provided in the configs (Must be in at least one of the two)
4. `input`
  * Purpose: To indicate the string to match in the query
  * Notes: This parameter is coupled with the `fields` parameter to form a complete query
5. `fields`
  * Purpose: To indicate the fields of the object mapping to match the input by in the query
  * Notes: This parameter is coupled with the `input` parameter to form a complete query
6. `query`
  * Purpose: To have the flexibility to represent any complex query
  * Notes: This is an [Elasticsearch DSL JSON Object](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html). This parameter will replace/override the basic query provided by the `input` and `fields` params. Must provide either both a (`fields` and `input`) param or a single (`query`) param.
7. `page`
  * Purpose: To indicate the page offset for the returned search results
  * Notes: This parameter is optional
8. `searchType`
  * Purpose: To determine what type of search to make (ex. 'query_then_fetch', 'count', 'scan', etc.)   
  * Notes: This parameter is optional. Passing it in here will override the `searchType`value provided in the configs.  
  
**Return**: An Object with pagination meta data and an array of hits.  
```javascript   
{ 
    meta: { 
        total_pages: 6,
        current_page: 2,
        total_hits: 155
    }, 
    hits: [
        {...}, // this is whatever was inserted into Elasticsearch and matched the search query
        {...},
        // ...
    ] 
}  
```
    
**Example**:  

```javascript
search.get({
    type: "article",
    fields: ["title^2", "tags"],
    input: "something",
    page: req.query.page
})
.then(function(result) {
    console.log(result.hits);
    console.log(result.meta);
});
```
  
***  
    
#### => index(`Object`)
**Description**: Insert or Update objects into Elasticsearch   
**Param**: Object that can contain the following keys

1. `index`   
  * Purpose: To indicate which index to search by  
  * Notes: Passing it in here will override the `index' value provided in the configs (Must be in at least one of the two)  
2. `type`
  * Purpose: To indicate which type to search by    
  * Notes: Passing it in here will override the `type` value provided in the configs (Must be in at least one of the two)    
3. `body`
  * Purpose: To provide the actual JavaScript Object that is going to be stored in Elasticsearch
  * Notes: This value is required. The fields of this object should be influenced by the mapping of the object that should have occured previously. You can index the entire object in elasticsearch but only fields included in the mapping can be searchable. Additional fields can be mapped and indexed for features like [term suggestions/auto completion/etc](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters-completion.html).

**Return**: `Response Object`

**Example**:

```javascript
var article = {
    id: 3,
    title: 'test article',
    path: '/article/test-article'
};
var index = search.index({
    index: "website",
    type: "article",
    body: {
        id: article.id,
        title: article.title,
        path: article.path,
        suggest: {
            input: article.title,
            output: article.title,
            payload: {"path" : article.path}
        }
    }
});
```

***

#### => delete(`Object`)
**Description**: Delete objects in Elasticsearch   
**Param**: Object that can contain the following keys

1. `index`   
  * Purpose: To indicate which index to search by  
  * Notes: Passing it in here will override the `index' value provided in the configs (Must be in at least one of the two)
2. `type`
  * Purpose: To indicate which type to search by    
  * Notes: Passing it in here will override the `type` value provided in the configs (Must be in at least one of the two)   
3. `id`
  * Purpose: To indicate which exact object to delete in Elasticsearch
  * Notes: This value is required.  
 
**Return**: `Response Object`  

**Example**:

```javascript
search.delete({
    index: 'website',
    type: 'article',
    id: 2
});
```

***

#### => suggest(`Object`)
**Description**: Get autocomplete suggestions from Elasticsearch. This method depends on a correct initial mapping (which should include a configured suggest completion field), and a correct indexing of the object (which should provide a suggest field indicating what to search by and what to return). Before using this method, you should probably read more on [how suggest works](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters-completion.html).  
**Param**: Object that can contain the following keys

1. `index`   
  * Purpose: To indicate which index to search by  
  * Notes: Passing it in here will override the `index' value provided in the configs (Must be in at least one of the two)
2. `type`
  * Purpose: To indicate which type to search by    
  * Notes: Passing it in here will override the `type` value provided in the configs (Must be in at least one of the two)    
3. `input`
  * Purpose: To indicate the string(s) to match in the suggestion query    
  * Notes: This parameter is coupled with the `fields` parameter to form a complete suggestion query. It can either be a String or Array of Strings.
4. `field`
  * Purpose: To indicate the field of the object mapping to match the input by in the suggestion query    
  * Notes: This parameter is coupled with the `input` parameter to form a complete suggestion query.
5. `size`
  * Purpose: To indicate the number of results returned by the suggestion query    
  * Notes: This parameter is optional. It only affects the return count when using the [`input` and `field`] method for suggestions. It defaults to 5.
6. `suggest`
  * Purpose: To have the flexibility to represent any complex suggestion query   
  * Notes: This is an [Elasticsearch Suggestion Object](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html). This parameter will replace/override the basic query provided by the `input` and `field` params. Must provide either both a (`fields` and `input`) param or a single (`suggest`) param.  
 
**Return**: `[Object]`  

**Example**:

```javascript
  // basic example of creating initial index/mapping for suggestions
  search.createIndex("test")
  .then(function(){
    var mapping = {
      index: "test",
      type: "article",
      body: {
        properties: {
          title: { type: "string" },
          id: { type: "integer" },
          suggest: {
            type: "completion",
            analyzer: "simple",
            search_analyzer: "simple",
            payloads: true
          }
        }
      }
    }
    return search.createMapping(mapping);
  })
  .then(function() {
    var promises = [];
    for(var i = 0; i < 10; i++) {
      var name = "something " + i;
      var index = search.index({
        index: "test",
        type: "article",
        body: {
          id: i,
          title: name,
          suggest: {
            input: name.split(" "),
            output: name,
            payload: {"path" : "/path/to/file"}
          }
        }
      });
      promises.push(index);
    }
    return Promise.all(promises);
  });
  
  // execute suggest in some controller
  search.suggest({
    type: "article",
    input: "some text",
    field: "suggest",
    size: 10
  });
```

***

#### => bulk(`Object`)
**Description**: Bulk Update/Insert/Delete objects from Elasticsearch   
**Param**: Object that can contain the following keys

1. `index`   
  * Purpose: To indicate which index to search by  
  * Notes: Passing it in here will override the `index' value provided in the configs (Must be in at least one of the two)
2. `type`
  * Purpose: To indicate which type to search by    
  * Notes: Passing it in here will override the `type` value provided in the configs (Must be in at least one of the two)   
3. `action` 
  * Purpose: To indicate what type of action to perform on the passed in items
  * Notes: This value is required. It can be 'index', 'update', or 'delete'
  
**Return**: `Response Object`   

**Example**:

```javascript
  var items = [];

  for(var i = 1; i < 50; i++){
    var name = "title " + i;
    items.push({
      id: i,
      title: name,
      suggest: {
        input: name.split(" "),
        output: name,
        payload: {"path" : "/article/" + i}
      }
    });
  }

  search.bulk({
    index: "test",
    type: "article",
    action: "index",
    items: items
  });
```

***

#### => deleteIndex(`String`)
**Description**: Delete an index from Elasticsearch   
**Param**: Single `String` argument

1. `index`   
  * Purpose: To indicate which index to delete
  * Notes: This value is required.
 
**Return**: `Response Object`

**Example**:

```javascript
search.deleteIndex('website');
```

***

#### => createIndex(`String`)
**Description**: Create an index in Elasticsearch   
**Param**: Single `String` argument

1. `index`   
  * Purpose: To indicate the name of the index to create  
  * Notes: This value is required. If the index already exists, it first deletes the existing index, then recreates it.
 
**Return**: `Response Object`  

**Example**:

```javascript
search.createIndex('website');
```

***

#### => createMapping(`Object`)
**Description**: Generate a Mapping (which is kind of like an Elasticsearch Schema)   
**Param**: Mapping `Object`
  * Purpose: To describe the mapping of a particular set of objects in Elasticsearch  
  * Notes: This value is required. Do more research to understand what the [Mapping Object](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-indices-putmapping) should look like.
 
**Return**: `Response Object`

**Example**:

```javascript
    var mapping = {
      index: "test",
      type: "article",
      body: {
        properties: {
          title: { type: "string" },
          id: { type: "integer" },
          suggest: {
            type: "completion",
            analyzer: "simple",
            search_analyzer: "simple",
            payloads: true
          }
        }
      }
    }
    
    search.createMapping(mapping);
```

## Elasticsearch Client
If the provided model api does not provide the desired functionality, the actual Elasticsearch.js client can be used. This client is officially supported by Elasticsearch and is used by the search model internally. [Here is the documentation for the Elasticsearch npm module](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html).
```javascript
//instead of 
var search = require('fundation').model.search;

//get the underlying client for the most control
var client = require('fundation').model.search.client;
```
