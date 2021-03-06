const assert = require('assert');
const cloneDeep = require('lodash.clonedeep');
const get = require('lodash.get');
const isFunction = require('lodash.isfunction');

const JysonArray = require('./jsonArray');
const JysonValue = require('./jsonValue');

const getKeyFromArrayIndexes = (key, arrayIndexes) => {
  let keyFromArrayIndexes = key;

  arrayIndexes.forEach((arrayIndex) => {
    keyFromArrayIndexes = keyFromArrayIndexes.replace(/\.\$/, `.${arrayIndex}`);
  });

  return keyFromArrayIndexes;
};

const getKey = (object, key, templateOpts, undefinedValue, arrayIndexes) => {
  let jysonValuePath = JysonValue.getPath(key);
  const jysonValueUndefinedValue = JysonValue.getUndefinedValue(key, undefinedValue);

  if(jysonValuePath[0] === '#') {
    const indexRegex = /\[([^)]+)\]/;

    jysonValuePath = jysonValuePath.substring(1);
    const match = indexRegex.exec(jysonValuePath);
    if (match) {
      const indexValue = getKey(object, match[1], templateOpts, undefinedValue, arrayIndexes);
      jysonValuePath = jysonValuePath.replace(indexRegex, `.${indexValue}`);
    }

    return get(templateOpts, getKeyFromArrayIndexes(jysonValuePath, arrayIndexes), jysonValueUndefinedValue);
  }
  return get(object, getKeyFromArrayIndexes(jysonValuePath, arrayIndexes), jysonValueUndefinedValue);
};

const setValue = (json, key, value) => {
  if (typeof value === 'undefined') {
    return json;
  }

  return json[key] = value;
};

const getArrayValueLength = (object, json, arrayIndexes, arrayKey, templateOpts) => {
  if(JysonValue.isAPath(json)) {
    const jysonValuePath = JysonValue.getPath(json);

    const arrayLocation = getKeyFromArrayIndexes(jysonValuePath, arrayIndexes).split('.$').shift();

    return getKey(object, `${arrayLocation}.length`, templateOpts, -1, arrayIndexes);
  }

  if(typeof json === 'object') {
    return Object.keys(json).reduce((maxLength, key) => {
      return Math.max(maxLength, getArrayValueLength(object, json[key], arrayIndexes, arrayKey, templateOpts));
    }, -1);
  }

  throw new Error(`jyson encountered an invalid array at: ${arrayKey}`);
};

const getKeyAndSetValue = (jsonResult, key, path, object, templateOpts, opts) => {
  const value = getKey(object, path, templateOpts, opts.undefinedValue, opts.arrayIndexes);

  // If we encounter an array without a $ in jyson, we consider that an error
  assert.ok(!Array.isArray(value) || path.indexOf('$') !== -1, `jyson encountered an array when it was not expecting one: ${path}`);

  // otherwise return the value
  return setValue(jsonResult, key, value);
};

const fillKeys = (json, object, templateOpts, opts) => {
  const jsonResult = {};
  Object.keys(json).forEach((key) => {
    // JysonValue or String Path
    if(JysonValue.isAPath(json[key])) {
      assert(opts);
      return getKeyAndSetValue(jsonResult, key, json[key], object, templateOpts, opts);
    }

    // JysonArray or Array
    if(JysonArray.isAnArray(json[key])) {
      assert.ok(json[key].length === 1, `jyson template arrays must be of length one at key: ${key}`);

      const jysonArrayValue = JysonArray.getValue(json[key]);
      const arrayValueLength = getArrayValueLength(object, jysonArrayValue, opts.arrayIndexes, key, templateOpts);
      const arrayIndexesIndex = opts.arrayIndexes.length;
      const arrayValue = [];

      if (arrayValueLength < 0) {
        opts.arrayIndexes.pop();
        const jysonValuePath = JysonValue.getPath(key);
        const jysonArrayEmptyArrayValue = JysonArray.getEmptyArrayValue(json[key], opts.emptyArrayValue);

        return setValue(jsonResult, jysonValuePath, jysonArrayEmptyArrayValue);
      }

      while(arrayValue.length < arrayValueLength) {
        opts.arrayIndexes[arrayIndexesIndex] = arrayValue.length;

        let result;
        if(JysonValue.isAPath(jysonArrayValue)) {
          result = setValue(jsonResult, key, getKey(object, jysonArrayValue, templateOpts, opts.undefinedValue, opts.arrayIndexes));
        } else {
          result = fillKeys(jysonArrayValue, object, templateOpts, opts);
        }
        arrayValue.push(result);
      }

      opts.arrayIndexes.pop();
      return setValue(jsonResult, key, arrayValue);
    }

    if (isFunction(json[key])) {
      const functionResult = json[key]({ object, key, templateOpts, opts });
      return setValue(jsonResult, key, typeof functionResult === 'undefined' ? opts.undefinedValue : functionResult);
    }

    // Nested Object
    if(json[key] !== null && json[key] !== undefined && typeof json[key] === 'object') {
      return setValue(jsonResult, key, fillKeys(json[key], object, templateOpts, opts));
    }

    // We should not be able to get here
    throw new Error(`jyson encountered an unknown template value: ${json[key]}`);
  });

  return jsonResult;
};

const buildTemplateFunction = (templateObject, buildTemplateFunctionOpts = {}) => {
  const opts = Object.assign({ undefinedValue: null, emptyArrayValue: [] }, buildTemplateFunctionOpts, { arrayIndexes: [] });
  const templateFunction = (objects, templateOpts = {}) => {

    if (!(objects instanceof Array)) {
      return templateFunction([objects], templateOpts)[0];
    }

    return objects.map((object) => {
      const json = cloneDeep(templateObject);

      return fillKeys(json, object, templateOpts, opts);
    });

  };

  return templateFunction;
};

module.exports = {
  buildTemplateFunction,
  Array: JysonArray,
  Value: JysonValue
};