(function () {

  var Loader = Vue.extend({
    template: '<span><div class="loader"></div>{{text | format}}</span>',
    created: function () {
      this.$set('text', t('common.msg.loading'));
    },
    filters: {
      format: function (str) {
        return ' ' + str;
      }
    }
  });
  Vue.component('div-loader', Loader);

  kpvm = new Vue({
    el: '#key-pairs-page',
    data: {
      regions: [
        {
          name: "All",
          selected: true,
        },
        {
          name: "us-east-1",
          selected: false,
        },
        {
          name: "us-west-1",
          selected: false,
        },
        {
          name: "us-west-2",
          selected: false,
        },
        {
          name: "ap-northeast-1",
          selected: false,
        },
        {
          name: "ap-southeast-1",
          selected: false,
        },
        {
          name: "ap-southeast-2",
          selected: false,
        },
        {
          name: "sa-east-1",
          selected: false,
        },
        {
          name: "eu-west-1",
          selected: false,
        },
        {
          name: "eu-central-1",
          selected: false,
        },
      ],
      selected: 'All',
      loading: true,
    },
    methods: {
      on_click: function (e) {
        selected = this.selected;
        _.find(this.regions, function (region) {
          return region.name === selected;
        }).selected = false;

        this.selected = e.target.text;

        _.find(this.regions, function (region) {
          return region.name === e.target.text;
        }).selected = true;
      },
      destroy: function (key_pair) {

      },
      reload: function () {
        var self = this;
        self.loading = true;
        $.ajax('key_pairs.json').done(function (data) {
          self.$set('key_pairs', data.key_pairs);
          self.loading = false;
        });
      },
      select_key_pairs_by_region: function (region) {
        return _.select(this.key_pairs, function (key_pair) {
          return region === key_pair.region;
        });
      }
    },
    created: function () {
      this.reload();
    }
  });
})();
