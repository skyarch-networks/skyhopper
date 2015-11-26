import * as Gen from "serverspec-generator";


const app = new Gen.App([], Gen.Info.value);
console.log(app);

// TODO
$(document).on('click', '#save-btn', () => {
  const file = new File([app.rubyCode], 'generated_spec.rb');
  const url = window.URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', file.name);
  document.body.appendChild(a);
  a.click();
});

document.querySelector("#vue-serverspec-gen").appendChild(app.$el);
