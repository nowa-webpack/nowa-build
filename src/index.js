/*
* @Author: gbk <ck0123456@gmail.com>
* @Date:   2016-04-21 17:34:00
* @Last Modified by:   gbk
* @Last Modified time: 2017-05-19 13:22:05
*/

'use strict';

var mkdirp = require('mkdirp');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var Progress = require('progress');
var Balancer = require('load-balancer');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var util = require('./util');
var loader = require('./loader');
var pkg = require('../package.json');

// plugin defination
module.exports = {

  description: pkg.description,

  options: [
    [ '-s, --src <dir>', 'source directory, default to `src`', 'src' ],
    [ '-d, --dist <dir>', 'build directory, default to `dist`', 'dist' ],
    [ '-e  --entry <file>', 'app entry, default to `app/app.js`', 'app/app.js' ],
    [ '    --pages [pages]', 'add multi-page entries' ],
    [ '    --buildvars', 'build varibles' ],
    [ '    --vars', 'runtime varibles' ],
    [ '    --externals', 'webpack external varibles' ],
    [ '-o, --loose', 'use babel es2015 loose mode to transform codes' ],
    [ '-c, --keepconsole', 'keep `console.log`' ],
    [ '    --skipminify', 'skip minify js and css' ],
    [ '-p, --progress', 'show progress' ],
    [ '    --exportcss', 'export css files' ],
    [ '    --multiCompilers', 'generate multi-compilers' ],
    [ '    --minifyExtension <extension>', 'minify file extension' ],
    [ '    --includes', 'loader should include paths' ],
    [ '    --polyfill', 'use core-js to do polyfills' ],
    [ '    --mangle', 'mangle varibles when minify' ],
    [ '    --alias', 'path alias' ],
    [ '    --publicPath <path>', 'set publicPath in webpack'],
    [ '    --analyse [port]', 'analyse bundle size'],
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
    var publicPath = options.publicPath || '/';
    var analyse = options.analyse;

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
      entries = util.makePageEntries(src, entries, pages);
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
      plugins.push(new ExtractTextPlugin('[name].css', {
        allChunks: !pages // 如果用户以单页形式进行代码分离。需要把其他chunk的css一同抽到app.css里
      }));
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
    if (analyse) {
      var analysePort = parseInt(analyse);
      plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: analysePort > 0 ? 'server' : 'static',
        analyzerPort: analysePort || 8888,
        reportFilename: util.cwdPath('webpack-bundle-analyzer-report.html')
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
      util.finishLog(startStamp);
    } : function(assets) {
      new Balancer.Master().send(util.relPath('minify.js'), {
        keepconsole: keepconsole,
        minifyExtension: minifyExtension,
        mangle: mangle
      }, assets.map(function(a) {
        return util.cwdPath(dist, a.name);
      }), function() {
        util.finishLog(startStamp);
      });
    };

    // run compiler
    if (combinations.length > 1 || multiCompilers) { // multi-compilers

      var compilers = combinations.length > 1 ? combinations.map(function(vars, index) {
        return util.preProcess({
          entry: entries,
          output: {
            path: util.cwdPath(dist),
            filename: '[name]' + util.suffixByVars(vars, buildvars) + '.js',
            publicPath: publicPath
          },
          plugins: plugins.concat([
            new webpack.DefinePlugin(util.parseVars(vars))
          ]),
          resolve: resolve,
          resolveLoader: resolveLoader,
          externals: externals,
          cache: true,
          module: {
            loaders: loader(options, index === 0)
          }
        });
      }) : util.preProcess({
          entry: entries,
          output: {
            path: util.cwdPath(dist),
            filename: '[name].js',
            publicPath: publicPath
          },
          plugins: plugins,
          resolve: resolve,
          resolveLoader: resolveLoader,
          externals: externals,
          cache: true,
          module: {
            loaders: loader(options)
          }
        });

      webpack(compilers, function(err, stats) {

        // print wepack compile result
        if (err) {
          return util.buildFail(err.toString());
        }
        console.log('=============');
        var assets = [];
        stats.stats.forEach(function(stat) {
          if (stat.hasErrors()) {
            return util.buildFail(stat.toJson().errors[0].split('\n').slice(0, 2).join('\n'));
          }
          console.log(stat.toString({
            version: false,
            hash: false,
            chunks: false,
            children: false,
            colors: true
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

      // vars defined
      if (combinations.length) {
        plugins.push(new webpack.DefinePlugin(util.parseVars(combinations[0])));
      }

      webpack(util.preProcess({
        entry: entries,
        output: {
          path: util.cwdPath(dist),
          filename: '[name].js',
          publicPath: publicPath
        },
        plugins: plugins,
        resolve: resolve,
        resolveLoader: resolveLoader,
        externals: externals,
        cache: true,
        module: {
          loaders: loader(options, true)
        }
      }), function(err, stats) {

        // print wepack compile result
        if (err) {
          return util.buildFail(err.toString());
        }
        if (stats.hasErrors()) {
          return util.buildFail(stats.toJson().errors[0].split('\n').slice(0, 2).join('\n'));
        }
        console.log('\n' + stats.toString({
          hash: false,
          chunks: false,
          children: false,
          colors: true
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

