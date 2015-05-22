(function () {
  'use strict';

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

  var kpvm = new Vue({
    el: '#key-pairs-page',
    data: {
      selected: 'All',
      loading: true,
    },
    methods: {
      switch_region: function (e) {
        var selected = this.selected;
        _.find(this.regions, function (region) {
          return region.name === selected;
        }).selected = false;

        this.selected = e.target.text;

        _.find(this.regions, function (region) {
          return region.name === e.target.text;
        }).selected = true;
      },
      delete_key_pair: function (key_pair) {
        var self = this;
        if (!confirm(t('key_pairs.msg.confirm', {name: key_pair.name}))) {return;}
        $.ajax({
          type: 'DELETE',
          url: '/key_pairs/' + key_pair.name,
          data: {
            project_id: self.project_id,
            region: key_pair.region
          }
        }).done(function () {
          var index = self.key_pairs.indexOf(key_pair);
          $('.table > tbody > tr:nth-child(' + (index + 1) + ')').fadeOut('normal', function () {
            self.key_pairs.$remove(key_pair);
          });
        });
      },
      reload: function () {
        var self = this;
        self.loading = true;
        $.ajax({
          url: '/key_pairs/retrieve' + location.search
        }).done(function (data) {
          self.$set('project_id', data.project_id);
          self.$set('key_pairs', data.key_pairs);
          _.forEach(data.key_pairs, function (key_pair) {
            key_pair.using_sign = key_pair.using ? '✔' : '';
          });
          self.$set('regions', [{
            name: 'All',
            selected: true,
          }]);
          self.$set('selected', 'All');
          _.forEach(data.regions, function (region) {
            self.regions.push({
              name: region,
              selected: false,
            });
          });
          self.loading = false;
        });
      },
    },
    created: function () {
      this.reload();
    }
  });
})();
