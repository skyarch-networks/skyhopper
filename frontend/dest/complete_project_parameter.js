"use strict";
function strategyGen(project_id) {
    var ajax = $.ajax({
        url: '/project_parameters.json',
        method: 'GET',
        data: {
            project_id: project_id,
        }
    });
    return {
        index: 1,
        match: /\$\{((?:[a-zA-Z_][a-zA-Z0-9_]*)?)$/,
        search: function (term, callback) {
            ajax.then(function (params) {
                var p = params.filter(function (k) { return k.key.indexOf(term) === 0; });
                callback(p);
            });
        },
        template: function (param) {
            var v = $('<div>').text(param.value).html();
            return '${' + param.key + '} (' + v + ')';
        },
        replace: function (param) {
            return "${" + param.key + '}';
        },
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = strategyGen;
