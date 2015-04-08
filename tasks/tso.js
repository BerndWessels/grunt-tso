/*
 * grunt-tso
 * https://github.com/BerndWessels/grunt-tso
 *
 * Copyright (c) 2015 Bernd Wessels
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var topsort = require('topsort');

if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

function escapeForRegExp(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getInjectorTagsRegExp(starttag, endtag) {
  return new RegExp('([\t ]*)(' + escapeForRegExp(starttag) + ')(\\n|\\r|.)*?(' + escapeForRegExp(endtag) + ')', 'gi');
}

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('tso', 'Parse typescript files for references to generate the correct build order.', function () {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      truncateDir: '',
      htmlOutDir: '',
      htmlOutExt: '.js',
      starttag: '<!-- injector:js -->',
      endtag: '<!-- endinjector -->'
    });

    var dependencies = [];
    var maybeMissed = [];

    var moduleDefinitions = [];
    var moduleReferences = [];

    var orderedPaths = [];

    // Iterate over all specified file groups.
    this.files.forEach(function (file) {
      if (file.dest === 'ts') {
        // Process typescript files.
        var src = file.src.filter(function (filepath) {
          // Warn on and remove invalid source files (if nonull was set).
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        }).map(function (filepath) {
          // Find all <reference path> in a typescript file.
          var regExp = /\/\/\/\s*<reference\s+path="([^""]*)"\s*\/>/g;
          // Read file source.
          var source = grunt.file.read(filepath);
          // Now iterate through all matches.
          var result;
          var hasDependencies = false;
          while ((result = regExp.exec(source)) !== null) {
            hasDependencies = true;
            var currentDirName = path.dirname(filepath);
            var referencePath = path.join(currentDirName, result[1]);
            dependencies.push([path.normalize(referencePath), path.normalize(filepath)]);
          }
          // Files without matches might be missed.
          if (!hasDependencies) {
            maybeMissed.push(path.normalize(filepath));
          }
          // Find all "angular.module('',[])" in a typescript file.
          regExp = /angular.module\s*\(\s*'([^']*)'\s*,\s*\[/g;
          // Now iterate through all matches.
          while ((result = regExp.exec(source)) !== null) {
            moduleDefinitions.push([result[1], path.normalize(filepath)]);
          }
          // Find all "angular.module('')" in a typescript file.
          regExp = /angular.module\s*\(\s*'([^']*)'\s*\)/g;
          // Now iterate through all matches.
          while ((result = regExp.exec(source)) !== null) {
            moduleReferences.push([result[1], path.normalize(filepath)]);
          }
        });
        // Add the module dependencies.
        moduleReferences.forEach(function (reference) {
          var definition = moduleDefinitions.find(function (definition) {
            return definition[0] === reference[0];
          });
          if (definition) {
            dependencies.push([definition[1], reference[1]]);
          }
        });
        // Sort by dependency.
        orderedPaths = topsort(dependencies);
        // Make sure nothing will be missed.
        maybeMissed.forEach(function (missedElement) {
          if (!orderedPaths.find(function (element) {
              return element === missedElement;
            })) {
            orderedPaths.unshift(missedElement);
          }
        });
      }
      // Handle options.
      //src += options.punctuation;

      // Write the destination file.
      //grunt.file.write(file.dest, src);

      // Print a success message.
      //grunt.log.writeln('File "' + file.dest + '" created.');
    });

    // Iterate over all specified file groups.
    this.files.forEach(function (file) {
      if (file.dest === 'html') {
        // Process html files.
        var src = file.src.filter(function (filepath) {
          // Warn on and remove invalid source files (if nonull was set).
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        }).map(function (filepath) {
          // Read file source.
          var source = grunt.file.read(filepath);

          // Do the injection:
          var re = getInjectorTagsRegExp(options.starttag, options.endtag);

          source = source.replace(re, function (match, indent, starttag, content, endtag) {
            var res = indent + starttag;
            orderedPaths.forEach(function (item) {
              res += '\n' + indent + '<script src="' + item
                .replace(/\\/g, '/')
                .replace(/\.ts$/, options.htmlOutExt)
                .replace(new RegExp(escapeForRegExp(options.truncateDir)), options.htmlOutDir) +
              '"></script>';
            });
            return res + '\n' + indent + endtag;
          });

          grunt.file.write(filepath, source);
        });
      }
    });
  });

};
