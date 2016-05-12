/*
* @Author: gbk
* @Date:   2016-05-02 17:15:36
* @Last Modified by:   gbk
* @Last Modified time: 2016-05-12 23:48:09
*/

'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');

var glob = require('glob');

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
      return util.relPath('..', '..', 'nowa', 'node_modules', [
        'babel',
        type,
        name
      ].join('-'));
    }
  },

  // load balancing
  // objects: objects to process
  // jobPath: job to run
  // params: extra params pass into job
  // callback: callback after job done
  loadBalancing: function(objects, jobPath, params, callback) {

    // create and balancing task pool
    var pool = [];
    var size = Math.min(os.cpus().length, objects.length);
    for (var i = 0; i < size; i++) {
      pool.push([]);
    }
    var cur = 0;
    objects.forEach(function(obj) {
      pool[cur].push(obj);
      cur = (cur + 1) % size;
    });

    // create and awake threads
    pool.forEach(function(queue) {
      var thread = cp.fork(jobPath);
      thread.on('exit', function() {
        !(--size) && callback && callback();
      });
      thread.send({
        queue: queue,
        params: params
      });
    });
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
      glob.sync(srcPattern, {
        nodir: true
      }).forEach(function(file) {

        // read from source and write to dist
        console.log('Copy file: ' + file);
        var target = path.join(targetDir, path.basename(file));
        fs.writeFileSync(target, fs.readFileSync(file));
      });
    }
  }
};

module.exports = util;
