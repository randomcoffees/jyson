# jyson changelog

## v4.0.1
- Updated packages

## v4.0.0
- Adds support for jyson.Array
  - this lets a user define a global `emptyArrayValue` or a per array `emptyArrayValue`
  - the following are now valid jyson
    ```
    jyson.buildTemplateFunction({
      a: ['a.$']
    }, {
      emptyArrayValue: null
    });
    ```
    ```
    jyson.buildTemplateFunction({
      c: new jyson.Array({ value: 'c.$', emptyArrayValue: null }),
    });
    ```
    ```
    jyson.buildTemplateFunction({
      c: new jyson.Array({ value: {c: 'c.$'}, emptyArrayValue: null }),
    });
    ```
-  jyson functions now get called with templateOpts instead of opts so
    ```
    jyson.buildTemplateFunction({
      name: 'name',
      tags: ['meta.tags.$'],
      other: {
        dogRating: 'meta.rating',
        exampleMissingValue: 'notFound',
        dateRan: ({ opts }) => opts.dateRan
      }
    });
    ```
    becomes
    ```
    jyson.buildTemplateFunction({
      name: 'name',
      tags: ['meta.tags.$'],
      other: {
        dogRating: 'meta.rating',
        exampleMissingValue: 'notFound',
        dateRan: ({ templateOpts }) => templateOpts.dateRan
      }
    });
    ```

## v3.1.3
- Fixed a bug that caused arrays to be empty in some edge cases:
    ```
    templateFunction = jyson.buildTemplateFunction({
      a: [{
        a: 'a.$.a',
        b: 'b.b',
      }]
    });
    templateFunction({
      a: [{ a: 0 }, { a: 1 }],
      b: { b: false },
    })
    ```
  - would return `{ a: [] }` not `{ a: [ { a: 0, b: false }, { a: 1, b: false } ] }`
- added `.npmignore` file to keep package file smaller
- cleaned up some test cases

## v3.1.2
- Updated Jyson Packages, the following got updated:
  - mocha
  - coveralls

## v3.1.1
- Patched security issues in the following packages
  - randomatic https://nodesecurity.io/advisories/157
  - stringstream https://nodesecurity.io/advisories/664
- Removed Q as a dependency

## v3.1.0
- Adds undefinedValue value on a case by case basis
  - The following is now valid jyson
```
jyson.buildTemplateFunction({
  'a': new jyson.Value({ path: 'a', undefinedValue: 'qwerty' }),
  'b': new jyson.Value({ path: 'b', undefinedValue: null }),
  'c': new jyson.Value({ path: 'c', undefinedValue: undefined }),
  'd': new jyson.Value({ path: 'd' })
});
```
- Closes [Issue #10](https://github.com/earobinson/jyson/issues/10)

## v3.0.1
- Bug fixes

## v3.0.0
- Adds nested array support to jyson
  - The following is now valid jyson
```
jyson.buildTemplateFunction({
  e: [{
    f: [{
      g: [{
        h: 'a.$.b.$.c.$.d'
      }]
    }]
  }]
});
```
- Closes [Issue #22](https://github.com/earobinson/jyson/issues/22)

## v2.0.0
- Jyson no longer throws an error to handle arrays it reads ahead to determine array length
- A Jyson template can now access two different arrays
- Closes [Issue #15](https://github.com/earobinson/jyson/issues/15)

## v1.3.0
- Made jyson less dependent on lodash
- Closes [Issue #13](https://github.com/earobinson/jyson/issues/13)

## v1.2.1
- Fixed a bug when if an array was not provide when it was in the template jyson would crash

## v1.2.0
- jyson now supports an array of objects Issue [Issue #9](https://github.com/earobinson/jyson/issues/9)
