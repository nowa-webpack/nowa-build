/*
* @Author: gbk
* @Date:   2016-05-10 23:45:10
* @Last Modified by:   gbk
* @Last Modified time: 2016-05-12 23:41:53
*/

'use strict';

var fs = require('fs');
var UglifyJs = require('uglify-js');
var CleanCss = require('clean-css');

// minify worker
process.on('message', function(msg) {
  msg.queue.forEach(minify.bind(msg.params));
  process.exit(0);
});

function minify(file) {
  if (/\.js$/.test(file)) {
    console.log('Minify file: ' + file);
    var result = UglifyJs.minify(file, {
      mangle: false,
      compress: {
        warnings: false,
        drop_console: !this.keepconsole
      },
      comments: false
    });
    fs.writeFileSync(file, result.code);
  } else if (/\.css$/.test(file)) {
    console.log('Minify file: ' + file);
    var result = new CleanCss({
      keepSpecialComments: 0,
      compatibility: true,
      advanced: false,
      processImport: true
    }).minify(fs.readFileSync(file, 'utf-8'));
    fs.writeFileSync(file, result.styles);
  }
};
