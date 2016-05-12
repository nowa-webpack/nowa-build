/*
* @Author: gbk
* @Date:   2016-05-02 22:07:46
* @Last Modified by:   gbk
* @Last Modified time: 2016-05-10 17:19:35
*/

'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');

var util = require('./util');

module.exports = function(options, firstRun) {
  var srcPath = util.cwdPath(options.src);
  var presets = util.babel('preset', [
    'es2015',
    'stage-0',
    'react'
  ]);
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
      presets: presets
    }
  }, {
    test: /\.css$/,
    loader: firstRun ? ExtractTextPlugin.extract('style-loader', 'css-loader') : 'export-css?remove=true&write=false!css',
    include: srcPath
  }, {
    test: /\.less$/,
    loader: firstRun ? ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader') : 'export-css?remove=true&write=false!css!less',
    include: srcPath
  }, {
    test: /\.styl$/,
    loader: firstRun ? ExtractTextPlugin.extract('style-loader', 'css-loader!stylus-loader') : 'export-css?remove=true&write=false!css!stylus',
    include: srcPath
  }, {
    test: /\.svg$/,
    loader: 'babel',
    include: srcPath,
    query: {
      presets: presets
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
