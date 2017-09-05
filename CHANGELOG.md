# Changelog

## 1.19.0 (2017-09-05)

* [feature] Update version of ts-loader.

## 1.18.1 (2017-08-18)

* [fix] CSS autoprefixer support IE9.

> https://github.com/nowa-webpack/nowa-build/issues/23

## 1.18.0 (2017-07-27)

* [feature] Support ES6 uglify.

> https://github.com/nowa-webpack/nowa-build/issues/22

## 1.17.1 (2017-07-06)

* [fix] Fix image path error.

> https://github.com/nowa-webpack/nowa-build/issues/21

## 1.17.0 (2017-06-21)

* [feature] Support IE<=10 `static extends` on `loose` mode.

## 1.16.2 (2017-05-19)

* [improve] Move analyse report file to project dir.

## 1.16.1 (2017-05-18)

* [improve] `--analyse [port]` if port is not specified, open local html.

## 1.16.0 (2017-05-18)

* [feature] Inject `webpack` to user defined config.
* [feature] Add analyse tool, `--analyse`.

## 1.15.2 (2017-05-11)

* [fix] Revert to 1.15.0.

## 1.15.1 (2017-05-10)

* [fix] .ts files support jsx.

## 1.15.0 (2017-03-30)

* [feature] Add `--publicPath` flag.

> https://github.com/nowa-webpack/nowa-build/pull/16

## 1.14.0 (2017-03-16)

* [feature] Add transform-decorators plugin.

> https://github.com/nowa-webpack/nowa/issues/38

## 1.13.0 (2017-03-12)

* [feature] Support page filter to add specified pages to entry.

> https://github.com/nowa-webpack/nowa/issues/35

## 1.12.0 (2017-03-01)

* [improve] Show colored output of build.

> https://github.com/nowa-webpack/nowa-build/issues/15 

## 1.11.0 (2017-02-27)

* [feature] Kill compiler process when webpack fails.

> https://github.com/nowa-webpack/nowa-build/issues/14

## 1.10.0 (2017-01-19)

* [feature] Add TypeScript support.

## 1.9.1 (2017-01-17)

* [fix] Fix loader found error issue.

> https://github.com/nowa-webpack/nowa-server/issues/11

## 1.9.0 (2016-12-26)

* [fix] Fix root dependency mismatch bug.

> https://github.com/nowa-webpack/nowa/issues/30

## 1.8.2 (2016-12-22)

* [fix] Update stylus-loader version for supporting Nodejs 6+.

## 1.8.1 (2016-12-13)

* [fix] Fix alias bug.

## 1.8.0 (2016-12-11)

* [feature] Add alias option for module path alias defination.

> https://github.com/nowa-webpack/nowa-server/issues/10

## 1.7.0 (2016-12-11)

* [feature] Change default image path to `./`.

> https://github.com/nowa-webpack/nowa/issues/27

## 1.6.0 (2016-11-22)

* [feature] Add jsx extension support.

> https://github.com/nowa-webpack/nowa-build/pull/11

## 1.5.0 (2016-11-18)

* [feature] Add mangle option.

## 1.4.0 (2016-10-24)

* [feature] Support font files(woff,woff2,ttf,otf).

## 1.3.2 (2016-09-27)

* [fix] babel-runtime do not support old IEs, so use es3ify-loader to transform babel-runtime.

> https://github.com/nowa-webpack/nowa/issues/22

## 1.3.1 (2016-09-24)

* [feature] Update version of babel plugins.

## 1.3.0 (2016-09-23)

* [feature] Use es2015 internel loose mode.
* [feature] Use babel-runtime to support polyfill.

> https://github.com/nowa-webpack/nowa-build/issues/10

> https://github.com/nowa-webpack/nowa/issues/20

## 1.2.1 (2016-08-24)

* [fix] Fix undefined extension.

## 1.2.0 (2016-08-23)

* [feature] Support multi-compilers via option.
* [feature] Support minify extension.
* [feature] Add include option to support adding more include path for loader.

> https://github.com/nowa-webpack/nowa-build/issues/7

> https://github.com/nowa-webpack/nowa-build/issues/8

> https://github.com/nowa-webpack/nowa-build/issues/9

## 1.1.0 (2016-07-27)

* [feature] Ignore babelrc.
* [improve] Add cache directory for babel to speed up.

> https://github.com/nowa-webpack/nowa-build/issues/5

## 1.0.5 (2016-07-15)

* [fix] Disable zIndex auto-adjustment.

> https://github.com/nowa-webpack/nowa-build/issues/4

## 1.0.4 (2016-07-13)

* [improve] Autoprefixer support low version of Android.

> https://github.com/nowa-webpack/nowa-build/issues/3

## 1.0.3 (2016-07-12)

* [fix] `--loose` argument do not take effect.

> https://github.com/nowa-webpack/nowa-build/issues/2

## 1.0.2 (2016-07-11)

* [fix] Copy task do not keep directory structor.

> https://github.com/nowa-webpack/nowa-build/issues/1

## 1.0.1 (2016-06-30)

* [fix] Can not find nowa plugin when nowa was locally installed.

> https://github.com/nowa-webpack/nowa/issues/6

## 1.0.0 (2016-06-26)

* [improve] Remove peerdependencies of nowa.

