import * as Gen   from "serverspec-generator";
import {Prompt, Alert, AlertForAjaxStdError}   from './modal';
import Serverspec from './models/serverspec';
import * as qs from 'query-string';

const app = new Gen.App([], Gen.Info.value);
console.log(app);

$(document).on('click', '.save-serverspec-btn', () => {
  Prompt('Save Serverspec', "filename").then((fname) => {
    const s = new Serverspec();
    const infra_id_str: string = qs.parse(location.search).infrastructure_id;
    const infra_id: number     = infra_id_str ? parseInt(infra_id_str) : null;
    const code = app.rubyCode;
    return s.create(fname, code, infra_id);
  }).then(
    data => Alert(t('serverspecs.serverspec'), data),
    AlertForAjaxStdError()
  ).then(() => {
    location.href = `/serverspecs${location.search}`;
  });
});

document.querySelector("#vue-serverspec-gen").appendChild(app.$el);
