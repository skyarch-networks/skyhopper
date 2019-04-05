

const Gen = require('serverspec-generator');
const qs = require('query-string');
const modal_1 = require('./modal');
const servertest_1 = require('./models/servertest');

const app = new Gen.App([], Gen.Info.value);
$(document).on('click', '.save-serverspec-btn', () => {
  modal_1.Prompt('Save Serverspec', 'filename').then((fname) => {
    const infra_id_str = qs.parse(location.search).infrastructure_id;
    const infra_id = infra_id_str ? parseInt(infra_id_str) : null;
    const s = new servertest_1.default(infra_id);
    const code = `require "serverspec_helper"\n\n${app.rubyCode}`;
    return s.create(fname, code, 'serverspec');
  }).then(data => modal_1.Alert(t('serverspecs.serverspec'), data), modal_1.AlertForAjaxStdError()).then(() => {
    location.href = `/servertests${location.search}`;
  });
});
const vueServerspecGenElement = document.querySelector('#vue-serverspec-gen');
if (vueServerspecGenElement) {
  vueServerspecGenElement.appendChild(app.$el);
}
