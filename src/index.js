/*
* @Author: gbk <ck0123456@gmail.com>
* @Date:   2016-04-21 17:34:00
* @Last Modified by:   gbk
* @Last Modified time: 2016-12-26 19:24:02
*/

'use strict';

var mkdirp = require('mkdirp');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var Progress = require('progress');
var Balancer = require('load-balancer');

var util = require('./util');
var loader = require('./loader');
var pkg = require('../package.json');

// plugin defination
module.exports = {

  description: pkg.description,

  options: [
    [ '-c, --config <file>', 'custom webpack configuration file'],
    [ '-s, --src <dir>', 'source directory, default to `src`', 'src' ],
    [ '-d, --dist <dir>', 'build directory, default to `dist`', 'dist' ],
    [ '-e  --entry <file>', 'app entry, default to `app/app.js`', 'app/app.js' ],
    [ '    --pages', 'add multi-page entries' ],
    [ '    --buildvars', 'build varibles' ],
    [ '    --vars', 'runtime varibles' ],
    [ '    --externals', 'webpack external varibles' ],
    [ '-o, --loose', 'use babel es2015 loose mode to transform codes' ],
    [ '    --keepconsole', 'keep `console.log`' ],
    [ '    --skipminify', 'skip minify js and css' ],
    [ '-p, --progress', 'show progress' ],
    [ '    --exportcss', 'export css files' ],
    [ '    --multiCompilers', 'generate multi-compilers' ],
    [ '    --minifyExtension <extension>', 'minify file extension' ],
    [ '    --includes', 'loader should include paths' ],
    [ '    --polyfill', 'use core-js to do polyfills' ],
    [ '    --mangle', 'mangle varibles when minify' ],
    [ '    --alias', 'path alias' ],
  ],

  action: function(options) {

    // options
    var src = options.src;
    var dist = options.dist;
    var entry = options.entry;
    var pages = options.pages;
    var vars = options.vars || {};
    var buildvars = util.parseBuildVars(vars, options.buildvars || {});
    var externals = options.externals || {
      'react': 'window.React',
      'react-dom': 'window.ReactDOM || window.React'
    };
    var loose = options.loose;
    var keepconsole = options.keepconsole;
    var skipminify = options.skipminify;
    var showProgress = options.progress;
    var exportcss = options.exportcss !== false;
    var multiCompilers = !!options.multiCompilers;
    var minifyExtension = options.minifyExtension || '';
    var includes = options.includes;
    var polyfill = !!options.polyfill;
    var mangle = !!options.mangle;
    var alias = (function(aliasMap) {
      for (var key in aliasMap) {
        aliasMap[key] = util.cwdPath(src, aliasMap[key]);
      }
      return aliasMap;
    })(typeof options.alias === 'object' ? options.alias : {
      i18n: 'i18n'
    });
    var config = require(options.config);

    // start time stamp
    var startStamp = Date.now();

    // copy task
    mkdirp.sync(util.cwdPath(dist));
    util.copy([
      util.cwdPath(src, 'lib', '**', '*.*'),
      util.cwdPath('html', '**', '*.*')
    ], util.cwdPath(dist));

    // entries
    var entries = {
      app: util.makeEntry(src, entry)
    };
    if (pages) {
      entries = util.makePageEntries(src, entries);
    }

    // resolve
    var resolveRoot = [
      util.relPath('..', 'node_modules')
    ];
    if (process.cwd() !== util.relPath('..', '..', '..')) {
      resolveRoot.push(util.relPath('..', '..'));
    }
    var resolve = {
      root: resolveRoot,
      alias: alias,
      extensions: ['', '.js', '.jsx']
    };
    var resolveLoader = {
      root: resolveRoot
    };

    // plugins
    var plugins = [
      new webpack.optimize.OccurenceOrderPlugin()
    ];
    if (exportcss) {
      plugins.push(new ExtractTextPlugin('[name].css'));
    }
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
    // if none buildvar specficed, `false` as default build
    if (combinations.length === 0) combinations.push(false);

    // minify task
    var minify = skipminify ? function() {
      console.log('Finished in ' + ((Date.now() - startStamp) / 1000).toFixed(2) + 's');
    } : function(assets) {
      new Balancer.Master().send(util.relPath('minify.js'), {
        keepconsole: keepconsole,
        minifyExtension: minifyExtension,
        mangle: mangle
      }, assets.map(function(a) {
        return util.cwdPath(dist, a.name);
      }), function() {
        console.log('Finished in ' + ((Date.now() - startStamp) / 1000).toFixed(2) + 's');
      });
    };

    // compiler pre-process
    var preProcess = function(config) {
      var newConfig;
      try {
        newConfig = require(util.cwdPath('webpack.config.js'))(config);
      } catch (e) {
      }
      return newConfig || config;
    };

    // build compilers
    var compilers = combinations.map(function(vars, index) {
      if (options.config) {
        var configCopy = Object.assign({}, config);
        // add define plugin to inject vars
        if (vars) {
          configCopy.plugins = config.plugins
            .slice(0).push(new webpack.DefinePlugin(util.parseVars(vars)));
        }
        return configCopy;
      } else {
        return preProcess({
          entry: entries,
          output: {
            path: util.cwdPath(dist),
            filename: '[name]' + util.suffixByVars(vars, buildvars) + '.js',
            publicPath: '/'
          },
          plugins: vars ? plugins.concat([
            new webpack.DefinePlugin(util.parseVars(vars))
          ]) : plugins,
          resolve: resolve,
          resolveLoader: resolveLoader,
          externals: externals,
          cache: true,
          module: {
            loaders: loader(options, index === 0)
          }
        });
      }
    });

    // maybe merge in some way
    if (compilers.length > 1) {
      webpack(compilers, function(err, stats) {
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
    } else {
      webpack(compilers[0], function(err, stats) {
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
