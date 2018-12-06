"use strict";
var Gen = require("serverspec-generator");
var modal_1 = require('./modal');
var servertest_1 = require('./models/servertest');
var qs = require('query-string');
var app = new Gen.App([], Gen.Info.value);
console.log(app);
$(document).on('click', '.save-serverspec-btn', function () {
    modal_1.Prompt('Save Serverspec', "filename").then(function (fname) {
        var infra_id_str = qs.parse(location.search).infrastructure_id;
        var infra_id = infra_id_str ? parseInt(infra_id_str) : null;
        var s = new servertest_1.default(infra_id);
        var code = 'require "serverspec_helper"\n\n' + app.rubyCode;
        return s.create(fname, code, 'serverspec');
    }).then(function (data) { return modal_1.Alert(t('serverspecs.serverspec'), data); }, modal_1.AlertForAjaxStdError()).then(function () {
        location.href = "/servertests" + location.search;
    });
});
var vueServerspecGenElement = document.querySelector("#vue-serverspec-gen");
if (vueServerspecGenElement) {
    vueServerspecGenElement.appendChild(app.$el);
}
