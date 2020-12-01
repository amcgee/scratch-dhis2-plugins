/* eslint-disable */
const { useRef, useState, useEffect, useCallback, useContext } = React;
import { useConfig } from './app-service-config.js';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

const getMutationFetchType = mutation => mutation.type === 'update' ? mutation.partial ? 'update' : 'replace' : mutation.type;

const resolveDynamicQuery = ({
  resource,
  id,
  data,
  params
}, variables) => ({
  resource,
  id: typeof id === 'function' ? id(variables) : id,
  data: typeof data === 'function' ? data(variables) : data,
  params: typeof params === 'function' ? params(variables) : params
});

class InvalidQueryError extends Error {
  constructor(errors) {
    super("Invalid query\n".concat(errors.map(e => ' - ' + e).join('\n')));

    _defineProperty(this, "type", 'invalid-query');

    _defineProperty(this, "details", void 0);

    this.details = errors;
  }

}

const validQueryKeys = ['resource', 'id', 'params', 'data'];
const validTypes = ['read', 'create', 'update', 'replace', 'delete'];
const getResourceQueryErrors = (type, query) => {
  if (!validTypes.includes(type)) {
    return ["Unknown query or mutation type ".concat(type)];
  }

  if (typeof query !== 'object') {
    return ['A query or mutation must be a javascript object'];
  }

  const errors = [];

  if (!query.resource || typeof query.resource !== 'string') {
    errors.push('Property resource must be a string');
  }

  if (type === 'create' && query.id) {
    errors.push("Mutation type 'create' does not support property 'id'");
  }

  if (query.id && typeof query.id !== 'string') {
    errors.push('Property id must be a string');
  }

  if (query.params && typeof query.params !== 'object') {
    errors.push('Property params must be an object');
  }

  if (type === 'delete' && query.data) {
    errors.push("Mutation type 'delete' does not support property 'data'");
  }

  const invalidKeys = Object.keys(query).filter(k => !validQueryKeys.includes(k));
  invalidKeys.forEach(k => {
    errors.push("Property ".concat(k, " is not supported"));
  });
  return errors;
};
const validateResourceQueries = (queries, names = []) => {
  if (names.length !== queries.length) {
    for (let i = names.length; i < queries.length; ++i) {
      names.push('query#' + i);
    }
  }

  const errors = queries.reduce((errors, query, i) => errors.concat(getResourceQueryErrors('read', query).map(e => "[".concat(names[i], "] ").concat(e))), []);

  if (errors.length) {
    throw new InvalidQueryError(errors);
  }
};
const validateResourceQuery = (type, query) => {
  const errors = getResourceQueryErrors(type, query);

  if (errors.length) {
    throw new InvalidQueryError(errors);
  }
};

const reduceResponses = (responses, names) => responses.reduce((out, response, idx) => {
  out[names[idx]] = response;
  return out;
}, {});

class DataEngine {
  constructor(link) {
    _defineProperty(this, "link", void 0);

    this.link = link;
  }

  query(query, {
    variables = {},
    signal,
    onComplete,
    onError
  } = {}) {
    const names = Object.keys(query);
    const queries = names.map(name => query[name]).map(q => resolveDynamicQuery(q, variables));
    validateResourceQueries(queries, names);
    return Promise.all(queries.map(q => {
      return this.link.executeResourceQuery('read', q, {
        signal
      });
    })).then(results => {
      const data = reduceResponses(results, names);
      onComplete && onComplete(data);
      return data;
    }).catch(error => {
      onError && onError(error);
      throw error;
    });
  }

  mutate(mutation, {
    variables = {},
    signal,
    onComplete,
    onError
  } = {}) {
    const query = resolveDynamicQuery(mutation, variables);
    const type = getMutationFetchType(mutation);
    validateResourceQuery(type, query);
    const result = this.link.executeResourceQuery(type, query, {
      signal
    });
    return result.then(data => {
      onComplete && onComplete(data);
      return data;
    }).catch(error => {
      onError && onError(error);
      throw error;
    });
  }

}

class FetchError extends Error {
  constructor({
    message,
    type,
    details = {}
  }) {
    super(message);

    _defineProperty(this, "type", void 0);

    _defineProperty(this, "details", void 0);

    this.type = type;
    this.details = details;
  }

}

class CustomDataLink {
  constructor(customData, {
    failOnMiss = true,
    loadForever = false
  } = {}) {
    _defineProperty(this, "failOnMiss", void 0);

    _defineProperty(this, "loadForever", void 0);

    _defineProperty(this, "data", void 0);

    this.data = customData;
    this.failOnMiss = failOnMiss;
    this.loadForever = loadForever;
  }

  async executeResourceQuery(type, query, options) {
    if (this.loadForever) {
      return new Promise(() => undefined);
    }

    const customResource = this.data[query.resource];

    if (!customResource) {
      if (this.failOnMiss) {
        throw new Error("No data provided for resource type ".concat(query.resource, "!"));
      }

      return Promise.resolve(null);
    }

    switch (typeof customResource) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'object':
        return customResource;

      case 'function':
        {
          const result = await customResource(type, query, options);

          if (typeof result === 'undefined' && this.failOnMiss) {
            throw new Error("The custom function for resource ".concat(query.resource, " must always return a value but returned ").concat(result));
          }

          return result || null;
        }
    }
  }

}

class ErrorLink {
  constructor(errorMessage) {
    _defineProperty(this, "errorMessage", void 0);

    this.errorMessage = errorMessage;
  }

  executeResourceQuery() {
    console.error(this.errorMessage);
    return Promise.reject(this.errorMessage);
  }

}

const parseContentType = contentType => {
  return contentType ? contentType.split(';')[0].trim().toLowerCase() : null;
};
const parseStatus = async response => {
  const accessError = response.status === 401 || response.status === 403 || response.status === 409;

  if (accessError) {
    let message;
    let details = {};

    try {
      details = await response.json();
      message = details.message;
    } catch (e) {} // Do nothing
    // Set a message in case of invalid json, or json without 'message' property


    if (!message) {
      message = response.status === 401 ? 'Unauthorized' : 'Forbidden';
    }

    throw new FetchError({
      type: 'access',
      message,
      details
    });
  }

  if (response.status < 200 || response.status >= 400) {
    const message = "An unknown error occurred - ".concat(response.statusText, " (").concat(response.status, ")");
    let details = {};

    try {
      details = await response.json();
    } catch (e) {// We can leave details as is if parsing fails
    }

    throw new FetchError({
      type: 'unknown',
      message,
      details
    });
  }

  return response;
};
function fetchData(url, options = {}) {
  return fetch(url, _objectSpread2(_objectSpread2({}, options), {}, {
    credentials: 'include',
    headers: _objectSpread2({
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json'
    }, options.headers)
  })).catch(err => {
    throw new FetchError({
      type: 'network',
      message: 'An unknown network error occurred',
      details: err
    });
  }).then(parseStatus).then(async response => {
    if (parseContentType(response.headers.get('Content-Type')) === 'application/json') {
      return await response.json(); // Will throw if invalid JSON!
    }

    return await response.text();
  });
}

const joinPath = (...parts) => {
  const realParts = parts.filter(part => !!part);
  return realParts.map(part => part.replace(/^\/+|\/+$/g, '')).join('/');
};

/*
 * Requests that expect a "text/plain" Content-Type have been collected by scanning
 * the developer documentation:
 * https://docs.dhis2.org/master/en/developer/html/dhis2_developer_manual_full.html
 *
 * Note that currently it is not allowed to include an id property on a "create"
 * mutation object. This means that currently the `id` will always be included in
 * the resource property (string). If we decide to allow the `id` property for
 * "create" mutation-objects, we will have to include additional checks below.
 */
// POST to `messageConversations/${id}` (reply to a messagConversation)
const isReplyToMessageConversation = (type, {
  resource
}) => {
  const pattern = /^messageConversations\/[a-zA-Z0-9]{11}$/;
  return type === 'create' && pattern.test(resource);
}; // POST to 'messageConversations/feedback' (create a feedback message)

const isCreateFeedbackMessage = (type, {
  resource
}) => type === 'create' && resource === 'messageConversations/feedback'; // POST or PUT to `interpretations/${objectType}/${id}` (add or update an interpretation)

const isCreateOrUpdateInterpretation = (type, {
  resource,
  id
}) => {
  if (type !== 'create' && type !== 'replace') {
    return false;
  }

  let resourcePattern;

  if (type === 'replace' && id) {
    resourcePattern = /^interpretations\/(?:reportTable|chart|visualization|map|eventReport|eventChart|dataSetReport)$/;
    const idPattern = /^[a-zA-Z0-9]{11}$/;
    return resourcePattern.test(resource) && idPattern.test(id);
  }

  resourcePattern = /^interpretations\/(?:reportTable|chart|visualization|map|eventReport|eventChart|dataSetReport)\/[a-zA-Z0-9]{11}$/;
  return resourcePattern.test(resource);
}; // POST to `interpretations/${id}/comments` (comment on an interpretation)

const isCommentOnInterpretation = (type, {
  resource
}) => {
  const pattern = /^interpretations\/[a-zA-Z0-9]{11}\/comments$/;
  return type === 'create' && pattern.test(resource);
}; // PUT to `interpretations/${interpretationId}/comments/${commentId}`
// (update an interpretation comment)

const isInterpretationCommentUpdate = (type, {
  resource,
  id
}) => {
  if (type !== 'replace') {
    return false;
  }

  if (id) {
    const idPatternLong = /^[a-zA-Z0-9]{11}\/comments\/[a-zA-Z0-9]{11}$/;
    const idPatternShort = /^[a-zA-Z0-9]{11}$/;
    const resourcePattern = /^interpretations\/[a-zA-Z0-9]{11}\/comments$/;
    return resource === 'interpretations' && idPatternLong.test(id) || resourcePattern.test(resource) && idPatternShort.test(id);
  }

  const pattern = /^interpretations\/[a-zA-Z0-9]{11}\/comments\/[a-zA-Z0-9]{11}$/;
  return pattern.test(resource);
}; // POST to `systemSettings/${settingKey}` or `userSettings/${settingKey}`
// (add or update a single system or user setting)

const isAddOrUpdateSystemOrUserSetting = (type, {
  resource
}) => {
  // At least 4 chars because the all start with 'key' (i.e. keyStyle)
  const pattern = /^(?:systemSettings|userSettings)\/[a-zA-Z]{4,}$/;
  return type === 'create' && pattern.test(resource);
}; // POST to `configuration/${configurationProperty}`
// (add or update a single configuration property)

const addOrUpdateConfigurationProperty = (type, {
  resource
}) => {
  // NOTE: The corsWhitelist property does expect "application/json"
  const pattern = /^(configuration)\/([a-zA-Z]{1,50})$/;
  const match = resource.match(pattern);
  return type === 'create' && !!match && match[2] !== 'corsWhitelist';
}; // POST to 'synchronization/metadataPull' (install a metadata package)

const isMetadataPackageInstallation = (type, {
  resource
}) => type === 'create' && resource === 'synchronization/metadataPull';

var textPlainMatchers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  isReplyToMessageConversation: isReplyToMessageConversation,
  isCreateFeedbackMessage: isCreateFeedbackMessage,
  isCreateOrUpdateInterpretation: isCreateOrUpdateInterpretation,
  isCommentOnInterpretation: isCommentOnInterpretation,
  isInterpretationCommentUpdate: isInterpretationCommentUpdate,
  isAddOrUpdateSystemOrUserSetting: isAddOrUpdateSystemOrUserSetting,
  addOrUpdateConfigurationProperty: addOrUpdateConfigurationProperty,
  isMetadataPackageInstallation: isMetadataPackageInstallation
});

/*
 * Requests that expect a "multipart/form-data" Content-Type have been collected by scanning
 * the developer documentation:
 * https://docs.dhis2.org/master/en/developer/html/dhis2_developer_manual_full.html
 */
// POST to 'fileResources' (upload a file resource)
const isFileResourceUpload = (type, {
  resource
}) => type === 'create' && resource === 'fileResources'; // POST to 'messageConversations/attachments' (upload a message conversation attachment)

const isMessageConversationAttachment = (type, {
  resource
}) => type === 'create' && resource === 'messageConversations/attachments'; // POST to `staticContent/${key}` (upload staticContent: logo_banner | logo_front)

const isStaticContentUpload = (type, {
  resource
}) => {
  const pattern = /^staticContent\/(?:logo_banner|logo_front)$/;
  return type === 'create' && pattern.test(resource);
}; // POST to 'apps' (install an app)

const isAppInstall = (type, {
  resource
}) => type === 'create' && resource === 'apps';

var multipartFormDataMatchers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  isFileResourceUpload: isFileResourceUpload,
  isMessageConversationAttachment: isMessageConversationAttachment,
  isStaticContentUpload: isStaticContentUpload,
  isAppInstall: isAppInstall
});

const resourceExpectsTextPlain = (type, query) => Object.values(textPlainMatchers).some(textPlainMatcher => textPlainMatcher(type, query));

const resourceExpectsMultipartFormData = (type, query) => Object.values(multipartFormDataMatchers).some(multipartFormDataMatcher => multipartFormDataMatcher(type, query));

const FORM_DATA_ERROR_MSG = 'Could not convert data to FormData: object does not have own enumerable string-keyed properties';

const convertToFormData = data => {
  const dataEntries = Object.entries(data);

  if (dataEntries.length === 0) {
    throw new Error(FORM_DATA_ERROR_MSG);
  }

  return dataEntries.reduce((formData, [key, value]) => {
    formData.append(key, value);
    return formData;
  }, new FormData());
};

const requestContentType = (type, query) => {
  if (!query.data) {
    return null;
  }

  if (resourceExpectsTextPlain(type, query)) {
    return 'text/plain';
  }

  if (resourceExpectsMultipartFormData(type, query)) {
    return 'multipart/form-data';
  }

  return 'application/json';
};
const requestHeadersForContentType = contentType => {
  /*
   * Explicitely setting Content-Type to 'multipart/form-data' produces
   * a "multipart boundary not found" error. By not setting a Content-Type
   * the browser will correctly set it for us and also apply multipart
   * boundaries if the request body is an instance of FormData
   * See https://stackoverflow.com/a/39281156/1143502
   */
  if (!contentType || contentType === 'multipart/form-data') {
    return undefined;
  }

  return {
    'Content-Type': contentType
  };
};
const requestBodyForContentType = (contentType, {
  data
}) => {
  if (typeof data === 'undefined') {
    return undefined;
  }

  if (contentType === 'application/json') {
    return JSON.stringify(data);
  }

  if (contentType === 'multipart/form-data') {
    return convertToFormData(data);
  } // 'text/plain'


  return data;
};

const getMethod = type => {
  switch (type) {
    case 'create':
      return 'POST';

    case 'read':
      return 'GET';

    case 'update':
      return 'PATCH';

    case 'replace':
      return 'PUT';

    case 'delete':
      return 'DELETE';
  }
};

const queryToRequestOptions = (type, query, signal) => {
  const contentType = requestContentType(type, query);
  return {
    method: getMethod(type),
    body: requestBodyForContentType(contentType, query),
    headers: requestHeadersForContentType(contentType),
    signal
  };
};

const encodeQueryParameter = param => {
  if (Array.isArray(param)) {
    return param.map(encodeQueryParameter).join(',');
  }

  if (typeof param === 'string') {
    return encodeURIComponent(param);
  }

  if (typeof param === 'number' || typeof param === 'boolean') {
    return String(param);
  }

  if (typeof param === 'object') {
    throw new Error('Object parameter mappings not yet implemented');
  }

  throw new Error('Unknown parameter type');
};

const queryParametersMapToArray = params => Object.keys(params).reduce((out, key) => {
  const value = params[key];

  if (key === 'filter' && Array.isArray(value)) {
    value.forEach(item => {
      out.push({
        key: 'filter',
        value: item
      });
    });
  } else if (params[key] !== null && params[key] !== undefined) {
    out.push({
      key,
      value: params[key]
    });
  }

  return out;
}, []);

const queryParametersToQueryString = params => {
  const expandedParams = queryParametersMapToArray(params);
  return expandedParams.map(({
    key,
    value
  }) => "".concat(encodeURIComponent(key), "=").concat(encodeQueryParameter(value))).join('&');
};

const actionPrefix = 'action::';

const isAction = resource => resource.startsWith(actionPrefix);

const makeActionPath = resource => joinPath('dhis-web-commons', "".concat(resource.substr(actionPrefix.length), ".action"));

const queryToResourcePath = (apiPath, {
  resource,
  id,
  params = {}
}) => {
  const base = isAction(resource) ? makeActionPath(resource) : joinPath(apiPath, resource, id);

  if (Object.keys(params).length) {
    return "".concat(base, "?").concat(queryParametersToQueryString(params));
  }

  return base;
};

class RestAPILink {
  constructor({
    baseUrl,
    apiVersion
  }) {
    _defineProperty(this, "apiPath", void 0);

    _defineProperty(this, "baseUrl", void 0);

    _defineProperty(this, "apiVersion", void 0);

    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    this.apiPath = joinPath('api', String(apiVersion));
  }

  fetch(path, options) {
    return fetchData(joinPath(this.baseUrl, path), options);
  }

  executeResourceQuery(type, query, {
    signal
  }) {
    return this.fetch(queryToResourcePath(this.apiPath, query), queryToRequestOptions(type, query, signal));
  }

}

const errorMessage = 'DHIS2 data context must be initialized, please ensure that you include a <DataProvider> in your application';
const link = new ErrorLink(errorMessage);
const engine = new DataEngine(link);
const defaultContext = {
  engine
};

const DataContext = React.createContext(defaultContext);

const CustomDataProvider = ({
  children,
  data,
  options
}) => {
  const link = new CustomDataLink(data, options);
  const engine = new DataEngine(link);
  const context = {
    engine
  };
  return /*#__PURE__*/React.createElement(DataContext.Provider, {
    value: context
  }, children);
};

const useStaticInput = (staticValue, {
  warn = false,
  name = 'input'
} = {}) => {
  const originalValue = useRef(staticValue);
  const [value, setValue] = useState(() => originalValue.current);
  useEffect(() => {
    if (warn && originalValue.current !== staticValue) {
      console.warn("The ".concat(name, " should be static, don't create it within the render loop!"));
    }
  }, [warn, staticValue, originalValue, name]);
  return [value, setValue];
};

const useQueryExecutor = ({
  execute,
  variables: initialVariables,
  singular,
  immediate,
  onComplete,
  onError
}) => {
  const [theExecute] = useStaticInput(execute);
  const [state, setState] = useState({
    called: !!immediate,
    loading: !!immediate
  });
  const variables = useRef(initialVariables);
  const abortControllersRef = useRef([]);
  const abort = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current = [];
  }, []);
  const manualAbort = useCallback(() => {
    abort();
    setState(state => ({
      called: state.called,
      loading: false,
      error: new FetchError({
        type: 'aborted',
        message: 'Aborted'
      })
    }));
  }, [abort]);
  const refetch = useCallback((newVariables = {}) => {
    setState(state => !state.called || !state.loading ? {
      called: true,
      loading: true
    } : state);

    if (singular) {
      abort(); // Cleanup any in-progress fetches
    }

    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    variables.current = _objectSpread2(_objectSpread2({}, variables.current), newVariables);
    const options = {
      variables: variables.current,
      signal: controller.signal,
      onComplete,
      onError
    };
    return theExecute(options).then(data => {
      if (!controller.signal.aborted) {
        setState({
          called: true,
          loading: false,
          data
        });
        return data;
      }

      return new Promise(() => undefined); // Wait forever
    }).catch(error => {
      if (!controller.signal.aborted) {
        setState({
          called: true,
          loading: false,
          error
        });
      }

      return new Promise(() => undefined); // Don't throw errors in refetch promises, wait forever
    });
  }, [abort, onComplete, onError, singular, theExecute]); // Don't include immediate or refetch as deps, otherwise unintentional refetches
  // may be triggered by changes to input, i.e. recreating the onComplete callback

  useEffect(() => {
    if (immediate) {
      refetch();
    }

    return abort;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return _objectSpread2({
    refetch,
    abort: manualAbort
  }, state);
};

const useDataEngine = () => {
  const context = useContext(DataContext);
  return context.engine;
};

const empty = {};
const useDataMutation = (mutation, {
  onComplete,
  onError,
  variables = empty,
  lazy = true
} = {}) => {
  const engine = useDataEngine();
  const [theMutation] = useStaticInput(mutation, {
    warn: true,
    name: 'mutation'
  });
  const execute = useCallback(options => engine.mutate(theMutation, options), [engine, theMutation]);
  const {
    refetch: mutate,
    called,
    loading,
    error,
    data
  } = useQueryExecutor({
    execute,
    variables,
    singular: false,
    immediate: !lazy,
    onComplete,
    onError
  });
  return [mutate, {
    engine,
    called,
    loading,
    error,
    data
  }];
};

const DataMutation = ({
  mutation,
  onComplete,
  onError,
  variables,
  children
}) => {
  const mutationState = useDataMutation(mutation, {
    onComplete,
    onError,
    variables
  });
  return children(mutationState);
};

const DataProvider = props => {
  const config = _objectSpread2(_objectSpread2({}, useConfig()), props);

  const link = new RestAPILink(config);
  const engine = new DataEngine(link);
  const context = {
    engine
  };
  return /*#__PURE__*/React.createElement(DataContext.Provider, {
    value: context
  }, props.children);
};

const empty$1 = {};
const useDataQuery = (query, {
  onComplete,
  onError,
  variables = empty$1,
  lazy = false
} = {}) => {
  const engine = useDataEngine();
  const [theQuery] = useStaticInput(query, {
    warn: true,
    name: 'query'
  });
  const execute = useCallback(options => engine.query(theQuery, options), [engine, theQuery]);
  const {
    refetch,
    called,
    loading,
    error,
    data
  } = useQueryExecutor({
    execute,
    variables,
    singular: true,
    immediate: !lazy,
    onComplete,
    onError
  });
  return {
    engine,
    refetch,
    called,
    loading,
    error,
    data
  };
};

const DataQuery = ({
  query,
  onComplete,
  onError,
  variables,
  lazy,
  children
}) => {
  const queryState = useDataQuery(query, {
    onComplete,
    onError,
    variables,
    lazy
  });
  return children(queryState);
};

export { CustomDataProvider, DataMutation, DataProvider, DataQuery, useDataEngine, useDataMutation, useDataQuery };
//# sourceMappingURL=lib.js.map