const Gen = require('serverspec-generator');
const qs = require('query-string');
const modal = require('./modal');
const Servertest = require('./models/servertest').default;

const app = new Gen.App([], Gen.Info.value);
$(document).on('click', '.save-serverspec-btn', () => {
  modal.Prompt('Save Serverspec', 'filename').then((fname) => {
    const infraIdStr = qs.parse(window.location.search).infrastructure_id;
    const infraId = infraIdStr ? parseInt(infraIdStr, 10) : null;
    const s = new Servertest(infraId);
    const code = `require "serverspec_helper"\n\n${app.rubyCode}`;
    return s.create(fname, code, 'serverspec');
  }).then(data => modal.Alert(t('serverspecs.serverspec'), data), modal.AlertForAjaxStdError()).then(() => {
    window.location.href = `/servertests${window.location.search}`;
  });
});
const vueServerspecGenElement = document.querySelector('#vue-serverspec-gen');
if (vueServerspecGenElement) {
  vueServerspecGenElement.appendChild(app.$el);
}
