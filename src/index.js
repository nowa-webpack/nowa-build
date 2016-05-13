/*
* @Author: gbk <ck0123456@gmail.com>
* @Date:   2016-04-21 17:34:00
* @Last Modified by:   gbk
* @Last Modified time: 2016-05-13 10:11:48
*/

'use strict';

var mkdirp = require('mkdirp');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var Progress = require('progress');

var util = require('./util');
var loader = require('./loader');
var pkg = require('../package.json');

// plugin defination
module.exports = {

  description: pkg.description,

  options: [
    [ '-s, --src [dir]', 'source directory, default to `src`', 'src' ],
    [ '-d, --dist [dir]', 'build directory, default to `dist`', 'dist' ],
    [ '-e  --entry [file]', 'app entry, default to `app/app.js`', 'app/app.js' ],
    [ '    --pages', 'add multi-page entries' ],
    [ '    --buildvars', 'build varibles' ],
    [ '    --externals', 'webpack external varibles' ],
    [ '-o, --loose', 'use babel es2015 loose mode to transform codes' ],
    [ '-c, --keepconsole', 'keep `console.log`' ],
    [ '    --skipminify', 'skip minify js and css' ],
    [ '-p, --progress', 'show progress' ]
  ],

  action: function(options) {

    // options
    var src = options.src;
    var dist = options.dist;
    var entry = options.entry;
    var pages = options.pages;
    var buildvars = options.buildvars || {};
    var externals = options.externals || {
      'react': 'window.React',
      'react-dom': 'window.ReactDOM || window.React'
    };
    var loose = options.loose;
    var keepconsole = options.keepconsole;
    var skipminify = options.skipminify;
    var showProgress = options.progress;

    // start time stamp
    var startStamp = Date.now();

    // copy task
    mkdirp.sync(util.cwdPath(dist));
    util.copy([
      util.cwdPath(src, 'lib', '**', '*.*'),
      util.cwdPath('html', '**', '*.*')
    ], util.cwdPath(dist));

    // enable es2015 loose mode
    if (loose) {

      // modify es2015 presets, add `loose: true` option
      var es2015Plugins = require(util.babel('preset', 'es2015')).plugins;
      for (var i = 0; i < es2015Plugins.length; i++) {
        if (Array.isArray(es2015Plugins[i])) {
          es2015Plugins[i][1].loose = true;
        } else {
          es2015Plugins[i] = [
            es2015Plugins[i],
            { loose: true }
          ];
        }
      }
    }

    // entries
    var entries = {
      app: util.makeEntry(src, entry)
    };
    if (pages) {
      entries = util.makePageEntries(src, entries);
    }

    // resolve
    var resolve = {
      modulesDirectories: [
        'node_modules',
        util.relPath('..', 'node_modules')
      ],
      alias: {
        i18n: util.cwdPath(src, 'i18n')
      }
    };

    var resolveLoader = {
      modulesDirectories: [
        util.relPath('..', 'node_modules'),
        'node_modules'
      ]
    };

    // plugins
    var plugins = [
      new webpack.optimize.OccurenceOrderPlugin(),
      new ExtractTextPlugin('[name].css')
    ];
    if (showProgress) {
      var bar = new Progress('webpack compile [:bar]', {
        total: 1,
        width: 20
      });
      var oldPercentage = 0;
      plugins.push(new webpack.ProgressPlugin(function handler(percentage) {
        bar.tick(percentage - oldPercentage);
        oldPercentage = percentage;
      }));
    }

    // split buildvars into a table
    var keysArr = [];
    var valuesArr = [];
    for (var key in buildvars) {
      keysArr.push(key);
      if (Array.isArray(buildvars[key]) && buildvars[key].length) {
        valuesArr.push(buildvars[key]);
      } else {
        console.error(key + ' in buildvars MUST have at least one value!');
        process.exit(0);
      }
    }

    // generate all vars combination
    var combinations = [];
    if (keysArr.length) {
      var findRoute = function(combination) {
        combination = combination || [];
        var values = valuesArr[combination.length];
        if (values) {
          values.forEach(function(value) {
            findRoute(combination.concat([ value ]));
          });
        } else {
          var vars = {};
          keysArr.forEach(function(key, index) {
            vars[key] = combination[index];
          });
          combinations.push(vars);
        }
      }
      findRoute();
    }

    // minify task
    var minify = skipminify ? function() {
      console.log('Finished in ' + ((Date.now() - startStamp) / 1000).toFixed(2) + 's');
    } : function(assets) {
      util.loadBalancing(assets.map(function(a) {
        return util.cwdPath(dist, a.name);
      }), util.relPath('minify.js'), {
        keepconsole: keepconsole
      }, function() {
        console.log('Finished in ' + ((Date.now() - startStamp) / 1000).toFixed(2) + 's');
      });
    };

    // run compiler
    if (combinations.length > 1) { // multi-compilers

      webpack(combinations.map(function(vars, index) {
        return {
          entry: entries,
          output: {
            path: util.cwdPath(dist),
            filename: '[name]' + util.suffixByVars(vars, buildvars) + '.js',
            publicPath: '/'
          },
          plugins: plugins.concat([
            new webpack.DefinePlugin(util.parseVars(vars))
          ]),
          resolve: resolve,
          resolveLoader: resolveLoader,
          externals: externals,
          module: {
            loaders: loader(options, index === 0)
          }
        };
      }), function(err, stats) {

        // print wepack compile result
        if (err) {
          console.error(err.toString());
        }
        console.log('=============');
        var assets = [];
        stats.stats.forEach(function(stat) {
          console.log(stat.toString({
            version: false,
            hash: false,
            chunks: false,
            children: false
          }) + '\n=============');

          // concat assets
          Array.prototype.push.apply(assets, stat.toJson({
            hash: false,
            chunks: false,
            children: false,
            modules: false
          }).assets);
        });

        // minify task
        minify(assets);
      });

    } else { // single-compiler

      webpack({
        entry: entries,
        output: {
          path: util.cwdPath(dist),
          filename: '[name].js',
          publicPath: '/'
        },
        plugins: plugins,
        resolve: resolve,
        resolveLoader: resolveLoader,
        externals: externals,
        module: {
          loaders: loader(options, true)
        }
      }, function(err, stats) {

        // print wepack compile result
        if (err) {
          console.error(err.toString());
        }
        console.log('\n' + stats.toString({
          hash: false,
          chunks: false,
          children: false
        }));

        // minify task
        minify(stats.toJson({
          hash: false,
          chunks: false,
          children: false,
          modules: false
        }).assets);
      });
    }

  }
};

