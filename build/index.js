'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function (_ref) {
    var t = _ref.types;

    return {
        visitor: {
            CallExpression: function CallExpression(path, _ref2) {
                var filename = _ref2.file.opts.filename;
                var _ref2$opts = _ref2.opts;
                _ref2$opts = _ref2$opts === undefined ? {} : _ref2$opts;
                var _ref2$opts$config = _ref2$opts.config;
                var configPath = _ref2$opts$config === undefined ? 'webpack.config.js' : _ref2$opts$config;
                var _ref2$opts$findConfig = _ref2$opts.findConfig;
                var findConfig = _ref2$opts$findConfig === undefined ? false : _ref2$opts$findConfig;


                // Get webpack config
                var conf = getConfig(configPath, findConfig);

                // If the config comes back as null, we didn't find it, so throw an exception.
                if (conf === null) {
                    throw new Error('Cannot find configuration file: ' + configPath);
                }

                // exit if there's no alias config
                if (!conf.resolve || !conf.resolve.alias) {
                    return;
                }

                // Get the webpack alias config
                var aliasConf = conf.resolve.alias;

                var _path$node = path.node;
                var calleeName = _path$node.callee.name;
                var args = _path$node.arguments;

                // Exit if it's not a require statement

                if (calleeName !== 'require' || !args.length || !t.isStringLiteral(args[0])) {
                    return;
                }

                // Get the path of the StringLiteral

                var _args = _slicedToArray(args, 1);

                var filePath = _args[0].value;


                for (var aliasFrom in aliasConf) {
                    if (aliasConf.hasOwnProperty(aliasFrom)) {

                        var aliasTo = aliasConf[aliasFrom];

                        // If the filepath is not absolute, make it absolute
                        if (!(0, _path.isAbsolute)(aliasTo)) {
                            aliasTo = (0, _path.join)(process.cwd(), aliasTo);
                        }

                        var regex = new RegExp('^' + aliasFrom + '(/|$)');

                        // If the regex matches, replace by the right config
                        if (regex.test(filePath)) {
                            var relativeFilePath = (0, _path.relative)((0, _path.dirname)(filename), aliasTo).replace(/\\/g, '/');

                            // In case the file path is the root of the alias, need to put a dot to avoid having an absolute path
                            if (relativeFilePath.length === 0) {
                                relativeFilePath = '.';
                            }

                            var requiredFilePath = filePath.replace(aliasFrom, relativeFilePath);

                            // In the unfortunate case of a file requiring the current directory which is the alias, we need to add
                            // an extra slash
                            if (requiredFilePath === '.') {
                                requiredFilePath = './';
                            }

                            path.node.arguments = [(0, _babelTypes.StringLiteral)(requiredFilePath)];
                            return;
                        }
                    }
                }
            }
        }
    };
};

var _path = require('path');

var _babelTypes = require('babel-types');

var _findUp = require('find-up');

var _findUp2 = _interopRequireDefault(_findUp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getConfig(configPath, findConfig) {
    var conf;
    if (!findConfig) {
        // Get webpack config
        conf = require((0, _path.resolve)(process.cwd(), configPath));
    } else {
        conf = require(_findUp2.default.sync(configPath));
    }

    return conf;
}