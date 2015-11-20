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
      pages: 10,
      pageNumber: 0,
      key_pairs: null,
      project_id: null,
      regions: null,
      filterKey: '',
      selected_key_pairs: null,
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
        this.pageNumber = 0
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
      showPrev: function(){
        if(this.pageNumber === 0) return;
        this.pageNumber--;
      },
      showNext: function(){
        if(this.isEndPage) return;
        this.pageNumber++;
      },
    },
    computed: {
      isStartPage: function(){
        return (this.pageNumber === 0);
      },
      isEndPage: function(){
        return ((this.pageNumber + 1) * this.pages >= this.number_of_key_pairs(this.selected));
      },
    },
    created: function () {
      this.reload();
    },
    ready: function ()  {
      console.log(this.key_pairs);
    },
    filters: {
      zero_as_blank: function (str) {
        return (str === 0) ? null : str;

      },
      paginate: function(list) {
        var self = this;
        var index = this.pageNumber * this.pages;
        var isSelected = [];
        if(self.selected != 'All'){
          list.forEach(function (value, key) {
            if(value.region === self.selected){
              isSelected.push(value);
            }
          });
          this.selected_key_pairs = isSelected;
          return isSelected.slice(index, index + this.pages);
        }else{
          this.selected_key_pairs = list;
          return list.slice(index, index + this.pages);
        }

      },
      roundup: function (val) { return (Math.ceil(val));},
    }
  });

})();
