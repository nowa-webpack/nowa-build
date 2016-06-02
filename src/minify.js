/*
* @Author: gbk
* @Date:   2016-05-10 23:45:10
* @Last Modified by:   gbk
* @Last Modified time: 2016-06-02 21:55:01
*/

'use strict';

var fs = require('fs');
var UglifyJs = require('uglify-js');
var postcss = require('postcss');
var cssnano = require('cssnano');
var processer = new postcss([
  cssnano({
    autoprefixer: {
      add: true
    }
  })
]);
var count = 0;

// minify worker
process.on('message', function(msg) {

  count++;
  var file = msg.object;
  var keepconsole = msg.params.keepconsole;

  // minify js file
  if (/\.js$/.test(file)) {
    console.log('Minify file: ' + file);
    var result = UglifyJs.minify(file, {
      mangle: false,
      compress: {
        warnings: false,
        drop_console: !keepconsole
      },
      comments: false
    });
    fs.writeFileSync(file, result.code);
    process.send(msg);

  // minify css file
  } else if (/\.css$/.test(file)) {
    console.log('Minify file: ' + file);
    processer.process(fs.readFileSync(file, 'utf-8'), {
      from: file,
      to: file
    }).then(function(result) {
      fs.writeFileSync(file, result.css);
      process.send(msg);
    });

  // in case of files not support
  } else {
    process.send(msg);
  }
});
