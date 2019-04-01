var wrap = require('modules/wrap');
var listen = require('modules/listen');
var queryString = require('query-string').parse(location.search);

// register the grid component
module.exports = Vue.extend({
  template: '#grid-template',
  replace: true,
  props: {
    data: Array,
    columns: Array,
    filterKey: String,
    picked: Object,
    index: String,
    multiSelect: Boolean,
    selections: Array,
    url: String,
    empty: String,
  },

  data() {
    const sortOrders = {};
    this.columns.forEach(function (key) {
      sortOrders[key] = 1;
    });
    return {
      sortKey: '',
      sortOrders: sortOrders,
      loading: true,
      lang: queryString.lang,
      pages: 10,
      pageNumber: 0,
      filteredLength: null,
      tbl_data: [],
    };
  },

  methods: {
    sortBy(key) {
      if (key !== 'id') {
        this.sortKey = key;
      }
      this.sortOrders[key] = this.sortOrders[key] * -1;
    },
    pop() {
      $('#role').popover('toggle');
    },
    showPrev() {
      if (this.pageNumber === 0) return;
      this.pageNumber -= 1;
    },

    showNext() {
      if (this.isEndPage) return;
      this.pageNumber += 1;
    },
    select_entry(item) {
      this.$parent.picked = item;
      if (this.multiSelect) {
        if (this.selections.includes(item)) {
          const index = this.selections.indexOf(item);
          this.selections.splice(index, 1);
        } else {
          this.selections.push(item);
        }
      }
      this.$emit('can_edit');
    },
    show_entry(item) {
      const self = this;
      switch (self.$parent.index) {
        case 'clients':
          window.location.assign(item.projects_path);
          break;
        case 'projects':
          window.location.assign(item.infrastructures_path);
          break;
        case 'infrastructures':
          self.$parent.show_infra(item.id);
          break;
        case 'dishes':
          self.$parent.show_dish(item.id);
          break;
        case 'serverspecs':
          self.$parent.show_serverspec(item.id);
          break;
        case 'cf_templates':
          self.$parent.show_template(item.id);
          break;
        case 'user_admin':
        default:
          break;
      }
    },

    coltxt_key(key) {
      return wrap(key, this.$parent.index);
    },

    table_text(value, key, lang) {
      return listen(value, key, this.$parent.index, lang);
    },


    load_ajax(request) {
      const self = this;
      $.ajax({
        cache: false,
        url: request,
        success(data) {
          self.tbl_data = data;
          this.pages = data.length;
          self.close_loading();
        },
      });
    },

    close_loading() {
      const self = this;
      self.$parent.loading = false;
      if (self.tbl_data.length === 0) {
        self.$parent.is_empty = true;
      }
      self.filteredLength = self.tbl_data.length;
    },
  },

  computed: {
    isStartPage() {
      return (this.pageNumber === 0);
    },
    isEndPage() {
      return ((this.pageNumber + 1) * this.pages >= this.tbl_data.length);
    },
    table_data() {
      const self = this;
      let datatbl = self.tbl_data.filter(function (data) {
        if (self.filterKey === '') {
          return true;
        } else {
          return JSON.stringify(data).toLowerCase().indexOf(self.filterKey.toLowerCase()) !== -1;
        }
      });
      self.$parent.gridData = datatbl;
      self.filteredLength = datatbl.length;
      datatbl = datatbl.sort(function (data) {
        return data[self.sortKey];
      });
      if (self.sortOrders[self.sortKey] === -1) {
        datatbl.reverse();
      }
      const index = self.pageNumber * self.pages;
      return datatbl.slice(index, index + self.pages);
    },
    max_pages() {
      return Math.ceil(this.filteredLength / this.pages);
    },
  },
  mounted() {
    this.$nextTick(function () {
      const self = this;
      self.load_ajax(self.url);
    });
  },

  filters: {
    wrap: wrap,
    listen: listen,
    paginate(list) {
      const index = this.pageNumber * this.pages;
      return list.slice(index, index + this.pages);
    },
    roundup(val) { return (Math.ceil(val));},
    count(arr) {
      // record length
      this.$set('filteredLength', arr.length);
      // return it intact
      return arr;
    },
  },
});
