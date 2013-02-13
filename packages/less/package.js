Package.describe({
  summary: "The dynamic stylesheet language."
});

var less = require('less');
var fs = require('fs');
var path = require('path');

Package.register_extension(
  "less", function (bundle, source_path, serve_path, where, inPackage) {
    serve_path = serve_path + '.css';

    var contents = fs.readFileSync(source_path, 'utf8');

    try {
      less.render(contents.toString('utf8'), {
        // Use fs.readFileSync to process @imports. This is the bundler, so
        // that's not going to cause concurrency issues, and it means that (a)
        // we don't have to use Futures and (b) errors thrown by bugs in less
        // actually get caught.
        syncImport: true,
        // package-less-overrides/<packagename> allows users to override particular less files
        // in particular packages.  This is mostly useful for overidding bootstraps variables.less
        paths: inPackage ? // for @import
          [path.join('.', 'package-less-overrides', inPackage), path.resolve(source_path, '..')] :
          [path.resolve(source_path, '..')]
      }, function (err, css) {
        if (err) {
          bundle.error(source_path + ": Less compiler error: " + err.message);
          return;
        }

        bundle.add_resource({
          type: "css",
          path: serve_path,
          data: new Buffer(css),
          where: where
        });
      });
    } catch (e) {
      // less.render() is supposed to report any errors via its
      // callback. But sometimes, it throws them instead. This is
      // probably a bug in less. Be prepared for either behavior.
      bundle.error(source_path + ": Less compiler error: " + e.message);
    }
  }
);

Package.on_test(function (api) {
  api.use('test-helpers');
  api.add_files(['less_tests.less', 'less_tests.js'], 'client');
});
