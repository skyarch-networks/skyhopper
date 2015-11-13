//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {
  'use strict';

  Vue.component('div-loader', Loader);
  var modal          = require('modal');

  var kpvm = new Vue({
    el: '#key-pairs-page',
    data: {
      selected: 'All',
      loading: true,
    },
    methods: {
      switch_region: function (region_name) {
        if (this.number_of_key_pairs(region_name) === 0) {return;}

        var selected = this.selected;
        _.find(this.regions, function (region) {
          return region.name === selected;
        }).selected = false;

        this.selected = region_name;

        _.find(this.regions, function (region) {
          return region.name === region_name;
        }).selected = true;
      },
      key_pairs_by_region: function (region_name) {
        return _.select(this.key_pairs, function (key_pair) {
          return key_pair.region === region_name;
        });
      },
      number_of_key_pairs: function (region_name) {
        if (region_name === 'All') {
          return this.key_pairs.length;
        } else {
          return this.key_pairs_by_region(region_name).length;
        }
      },
      has_no_key_pairs: function (region_name) {
        return this.number_of_key_pairs(region_name) === 0;
      },
      is_selected: function (region_name) {
        return this.selected === 'All' || this.selected === region_name;
      },
      delete_key_pair: function (key_pair) {
        var self = this;

        modal.Confirm(t('key_pairs.key_pairs'), t('key_pairs.msg.confirm', {name: key_pair.name})).done(function () {
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
              if (self.has_no_key_pairs(key_pair.region)) {
                self.switch_region('All');
              }
            });
          });
        });
        //if (!confirm(t('key_pairs.msg.confirm', {name: key_pair.name}))) {return;}
      },
      reload: function () {
        var self = this;
        self.loading = true;
        self.$set('key_pairs', []);
        $.ajax({
          url: '/key_pairs/retrieve' + location.search
        }).done(function (data) {
          self.$set('project_id', data.project_id);
          self.$set('key_pairs', data.key_pairs);
          _.forEach(data.key_pairs, function (key_pair) {
            key_pair.using_sign = key_pair.using ? '✔' : '';
          });
          self.$set('selected', 'All');
          self.$set('regions', [{
            name: 'All',
            selected: true,
          }]);
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
    computed: {
    },
    created: function () {
      this.reload();
    },
    filters: {
      zero_as_blank: function (str) {
        return (str === 0) ? null : str;
      }
    }
  });

})();
