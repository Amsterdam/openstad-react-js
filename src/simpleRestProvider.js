import { stringify } from 'query-string';
import { fetchUtils } from 'ra-core';

import { importChoicesGuide } from './resources/choicesGuide/import.jsx'

/**
 * Maps react-admin queries to a simple REST API
 *
 * This REST dialect is similar to the one of FakeRest
 *
 * @see https://github.com/marmelab/FakeRest
 *
 * @example
 *
 * getList     => GET http://my.api.url/posts?sort=['title','ASC']&range=[0, 24]
 * getOne      => GET http://my.api.url/posts/123
 * getMany     => GET http://my.api.url/posts?filter={id:[123,456,789]}
 * update      => PUT http://my.api.url/posts/123
 * create      => POST http://my.api.url/posts
 * delete      => DELETE http://my.api.url/posts/123
 *
 * @example
 *
 * import React from 'react';
 * import { Admin, Resource } from 'react-admin';
 * import simpleRestProvider from 'ra-data-simple-rest';
 *
 * import { PostList } from './posts';
 *
 * const App = () => (
 *     <Admin dataProvider={simpleRestProvider('http://path.to.my.api/')}>
 *         <Resource name="posts" list={PostList} />
 *     </Admin>
 * );
 *
 * export default App;
 */

const formatResourceUrl = (resource,) => {

}

export default (apiUrl, httpClient = fetchUtils.fetchJson) => (
  {
    toggle: (resource, params) => {
      const url = `${apiUrl}/${resource}/${params.value}/toggle`;

      return httpClient(url).then(({ json }) => ({ data: json }))
    },
    getList: (resource, params) => {

      const { page, perPage } = params.pagination;
      const { field, order } = params.sort;
      
      const query = {
        sort: JSON.stringify([field, order]),
        page: (page -1),
        pageSize: perPage,
        range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
        filter: JSON.stringify(params.filter),
        includeUser: 1,
      };

      if ( resource == 'idea' ) {
        query.includeVoteCount = 1;
        query.includeTags = 1;
        // query.includeArguments = 1;
      }

      const url = `${apiUrl}/${resource}?${stringify(query)}`;

      return httpClient(url).then(({ headers, json }) => {

        let result = {
          data: json,
          total: json.length
        };;
        
        if ( resource != 'choicesGuide' ) {
          // no paging in the api for choicesGuides
          result = {
            data: json.records,
            total: json.metadata.totalCount
          };
        }
        return result;
      });
    },
    getOne: (resource, params) => {
      let url;


      // In case of current request make a call to the root that's where the siteData is found
      // All other resources are children of the site
      if (resource === 'site') {
        url = apiUrl;
      } else {
        // add include tags always
        url = `${apiUrl}/${resource}/${params.id}?includeTags=1&includeVoteCount=1`;
      }

      return httpClient(url)
        .then(({ json }) => {

          // in case of references our api returns complete object, react admin looks for ids, we need to find proper general solution
          //here only solution so editing tags works
          json = {
            ...json,
            tags: json.tags ? json.tags.map(tag => tag.id) : [],
          }

          return { data: json }
        });
    },
    getMany: (resource, params) => {

      // ik denk dat get many hier alleen door de imort knop wordt gebruikt en dat ik er daarom wel mee wegkom, maar dit slaat natuurlijk nergens op - zie ook createMany
      if ( resource == 'choicesGuide' ) {
        alert('Importeren van keuzewijzers als update is niet geimplementeerd')
        return Promise.reject();
      }
      
      const { page, perPage } = params.pagination ? params.pagination : {};

      const query = {
        filter: JSON.stringify({ id: params.ids }),
        page: page || 0,
        pageSize: perPage|| 100,
      };
      const url = `${apiUrl}/${resource}?${stringify(query)}`;

      return httpClient(url).then(({ json }) => {

        // in case of references our api returns complete object, react admin looks for ids, we need to find proper general solution
        //here only solution so editing tags works
        json.record = json.records ? json.records.map((record) => {
          return {
            tags: record.tags ? record.tags.map(tag => tag.id) : [],
            ...record
          }
        }) : [];

        return { data: json.records }
      });
    },
    getManyReference: (resource, params) => {
      const { page, perPage } = params.pagination;
      const { field, order } = params.sort;
      const query = {
        sort: JSON.stringify([field, order]),
        range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
        filter: JSON.stringify(Object.assign(Object.assign({}, params.filter), { [params.target]: params.id })),
        includeVoteCount: 1
      };
      const url = `${apiUrl}/${resource}?${stringify(query)}`;

      return httpClient(url).then(({ headers, json }) => {
        /*            if (!headers.has('content-range')) {
                      throw new Error('The Content-Range header WADDDUP is missing in the HTTP Response. The simple REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?');
                      }*/

        return {
          data: json.records,
          total: json.metadata ? json.metadata.totalCount : 0
        };
      });
    },
    update: (resource, params) => {
      let url;
      // In case of current request make a call to the root that's where the siteData is found
      // All other resources are children of the site
      if (resource === 'site') {
        url = apiUrl;
      } else {
        url = `${apiUrl}/${resource}/${params.id}`;
      }

      return httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      }).then(({ json }) => ({ data: json }))
    },
    // simple-rest doesn't handle provide an updateMany route, so we fallback to calling update n times instead
    updateMany: (resource, params) => Promise.all(params.ids.map(id => httpClient(`${apiUrl}/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }))).then(responses => ({ data: responses.map(({ json }) => json.id) })),
    create: (resource, params ) => {
      return httpClient(`${apiUrl}/${resource}`, {
        method: 'POST',
        body: JSON.stringify(params.data),
      }).then(({ json }) => ({
        data: Object.assign(Object.assign({}, params.data), { id: json.id }),
      }))
    },
    createMany: (resource, params) => {
      if ( resource == 'choicesGuide' ) {
        // dit is niet de plaats om dit te doen, maar ik heb nog geen andere hook kyunnen vinden
        return importChoicesGuide(apiUrl, httpClient, params)
      }
      return httpClient(`${apiUrl}/${resource}`, {
        method: 'POST',
        body: JSON.stringify(params.data),
      }).then(({ json }) => ({
        data: Object.assign(Object.assign({}, params.data), { id: json.id }),
      }))
    },
    delete: (resource, params) => httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),
    // simple-rest doesn't handle filters on DELETE route, so we fallback to calling DELETE n times instead
    deleteMany: (resource, params) => Promise.all(params.ids.map(id => httpClient(`${apiUrl}/${resource}/${id}`, {
      method: 'DELETE',
    }))).then(responses => ({ data: responses.map(({ json }) => json.id) })),

    // Ideas-with-Arguments specific calls ----------------------------------------------------------------------------------------------------

    getIdeasWithArguments: (params) => {
      const url = `${apiUrl}/idea?includeVoteCount=1&includeArguments=1&includeUser=1&includeTags=1`;
      return httpClient(url).then(({ headers, json }) => {
        let result = {
          data: json,
          total: json.length
        };
        return result;
      });
    },
    
    // end Ideas-with-Arguments specific calls ----------------------------------------------------------------------------------------------------

    // ChoicesgGuide specific calls ----------------------------------------------------------------------------------------------------

    getCompleteChoicesgGuide: (params) => {
      const url = `${apiUrl}/choicesguide/${params.id}?&includeChoices=1&includeQuestions=1`;
      return httpClient(url).then(({ headers, json }) => {
        let result = {
          data: json,
          total: json.length
        };;
        return result;
      });
    },

    getChoicesgGuideResults: (params) => {
      const url = `${apiUrl}/choicesguide/${params.id}/result`;
      return httpClient(url).then(({ headers, json }) => {
        let result = {
          data: json,
          total: json.length
        };;
        return result;
      });
    },

    // end ChoicesgGuide specific calls ----------------------------------------------------------------------------------------------------
    
  });
