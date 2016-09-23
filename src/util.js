/*
* @Author: gbk
* @Date:   2016-05-02 17:15:36
* @Last Modified by:   gbk
* @Last Modified time: 2016-09-22 21:53:22
*/

'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');

var glob = require('glob');
var mkdirp = require('mkdirp');

var util = {

  // get absolute path to cwd
  cwdPath: function() {
    var argvs = Array.prototype.slice.call(arguments);
    argvs.unshift(process.cwd());
    return path.join.apply(path, argvs);
  },

  // get absolute path to __dirname
  relPath: function(p) {
    var argvs = Array.prototype.slice.call(arguments);
    argvs.unshift(__dirname);
    return path.join.apply(path, argvs);
  },

  // make a webpack entry
  makeEntry: function() {
    return './' + path.join.apply(path, arguments);
  },

  // make all valid pages as webpack entries
  makePageEntries: function(src, entries) {
    var pages = fs.readdirSync(path.join(src, 'pages'));
    pages.forEach(function(page) {
      try {
        var entry = path.join(src, 'pages', page, 'index.js');
        if (fs.statSync(entry).isFile()) {
          entries[page] = util.makeEntry(src, 'pages', page, 'index.js');
        }
      } catch (e) {
      }
    });
    return entries;
  },

  // merge vars to buildvars
  parseBuildVars: function(vars, buildvars) {
    var key, newVars = {};
    for (key in vars) {
      newVars[key] = [ vars[key] ];
    }
    for (key in buildvars) {
      newVars[key] = buildvars[key];
    }
    return newVars;
  },

  // parse vars for DefinePlugin
  parseVars: function(vars) {
    var newVars = {};
    for (var key in vars) {
      newVars[key] = JSON.stringify(vars[key]);
    }
    return newVars;
  },

  // make filename suffix by vars
  suffixByVars: function (vars, buildvars) {
    if (vars) {
      var suffix = '';
      for (var key in vars) {
        var value = vars[key];

        // filename suffix will not contain `/`
        if (value !== undefined && buildvars[key] && buildvars[key].length > 1) {
          suffix += '-' + value.toString().replace(/\//, '');
        }
      }
      return suffix;
    } else {
      return '';
    }
  },

  // make babel plugin/preset absolute path
  babel: function(type, name) {
    if (Array.isArray(name)) {
      return name.map(function(n) {
        return util.babel(type, n);
      });
    } else {
      if (typeof name === 'object') {
        return [
          require.resolve([
            'babel',
            type,
            name.name
          ].join('-')),
          name.options
        ];
      } else {
        return require.resolve([
          'babel',
          type,
          name
        ].join('-'));
      }
    }
  },

  // copy files to dir
  copy: function(srcPattern, targetDir) {

    if (Array.isArray(srcPattern)) {

      // multi-glob-patterns
      srcPattern.forEach(function(src) {
        util.copy(src, targetDir);
      });

    } else {

      // single-glob-pattern
      var baseDir = srcPattern.split('**')[0];
      glob.sync(srcPattern, {
        nodir: true
      }).forEach(function(file) {

        // read from source and write to dist
        console.log('Copy file: ' + file);
        var target = path.join(targetDir, path.relative(baseDir, file));
        mkdirp.sync(path.dirname(target));
        fs.writeFileSync(target, fs.readFileSync(file));
      });
    }
  }
};

module.exports = util;
