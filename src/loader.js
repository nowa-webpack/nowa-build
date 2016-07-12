/*
* @Author: gbk
* @Date:   2016-05-02 22:07:46
* @Last Modified by:   caoke
* @Last Modified time: 2016-07-12 21:39:09
*/

'use strict';

var os = require('os');
var path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var util = require('./util');

module.exports = function(options, firstRun) {
  var srcPath = util.cwdPath(options.src);
  var exportcss = options.exportcss !== false;
  var presets = util.babel('preset', [
    'es2015',
    'stage-0',
    'react'
  ]);
  var cacheDirectory = path.join(os.tmpdir(), options.loose ? 'babel-loose' : 'babel-strict');
  var makeLoader = function(remainLoader) {
    var loaders = 'css-loader';
    if (remainLoader) {
      loaders += '!' + remainLoader + '-loader';
    }
    if (exportcss) {
      if (firstRun) {
        return ExtractTextPlugin.extract('style-loader', loaders);
      } else {
        return 'export-css-loader?remove=true&write=false!' + loaders;
      }
    } else {
      return 'style-loader!' + loaders;
    }
  }
  return [{
    test: /\.jsx?$/,
    loader: 'babel',
    include: srcPath,
    query: {
      plugins: util.babel('plugin', [
        'add-module-exports',
        'transform-es3-member-expression-literals',
        'transform-es3-property-literals'
      ]),
      presets: presets,
      cacheDirectory: cacheDirectory
    }
  }, {
    test: /\.css$/,
    loader: makeLoader(),
    include: srcPath
  }, {
    test: /\.less$/,
    loader: makeLoader('less'),
    include: srcPath
  }, {
    test: /\.styl$/,
    loader: makeLoader('stylus'),
    include: srcPath
  }, {
    test: /\.svg$/,
    loader: 'babel',
    include: srcPath,
    query: {
      presets: presets,
      cacheDirectory: cacheDirectory
    }
  }, {
    test: /\.svg$/,
    loader: 'svg2react',
    include: srcPath
  }, {
    test: /\.json$/,
    loader: 'json',
    include: srcPath
  }, {
    test: /\.(png|jpe?g|gif)$/,
    loader: 'url?limit=10240',
    include: srcPath
  }];
};
