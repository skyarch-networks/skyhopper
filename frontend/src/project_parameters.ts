interface Parameter {
  id: number;
  key: string;
  value: string;
  project_id: number;
}

declare const PROJECT_PARAMETERS: Parameter[];

const App = new Vue({
  el: '#project-parameter-index',
  data: {
    params: PROJECT_PARAMETERS,
  },
  methods: {

  },
});

console.log(App);
