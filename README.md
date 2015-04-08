# grunt-tso

> Parse typescript files for references to generate the correct build order. It will also make sure that angular module definitions are ordered.

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tso --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tso');
```

## The "tso" task

### Overview
In your project's Gruntfile, add a section named `tso` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  tso: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.truncateDir
Type: `String`
Default value: null

A string that is truncated from the start of the generated output path when the htmlOutDir option is specified.

#### options.htmlOutDir
Type: `String`
Default value: null

If specified this will be the exported root directory for all scripts.

#### options.htmlOutExt
Type: `String`
Default value: '.ts.js'

The file extension that will be used for the exported scripts.

### Usage Examples

#### Default Options
In this example, all typescript files under `test/**/*.ts` will be ordered and script imports will be injected into all html files under `test/**/*.html` inbetween the start and endtags. The script root will be transformed from `test` to `client/.app`. The script file extension will be transformed from `.ts` to `.ts.js`.

```js
    tso: {
      default: {
        options: {
          truncateDir: 'test',
          htmlOutDir: 'client/.app',
          htmlOutExt: '.ts.js',
          starttag: '<!-- injector:js -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          html: ['test/**/*.html'],
          ts: ['test/**/*.ts', '!test/**/*.d.ts']
        }
      }
    },
```

This is an example for a resulting html file.

```html
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
  <!-- injector:js -->
  <script src="client/.app/d.ts.js"></script>
  <script src="client/.app/one/a.ts.js"></script>
  <script src="client/.app/two/a.ts.js"></script>
  <script src="client/.app/a.ts.js"></script>
  <script src="client/.app/b.ts.js"></script>
  <script src="client/.app/c.ts.js"></script>
  <script src="client/.app/e.ts.js"></script>
  <script src="client/.app/one/b.ts.js"></script>
  <!-- endinjector -->
</body>
</html>
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2015 Bernd Wessels. Licensed under the MIT license.
