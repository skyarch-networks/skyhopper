exports.install = function(Vue, options, mode){
  Vue.directive("selectize", {
      twoWay: true,
      bind: function (value) {
        var self = this;
        console.log(self);
        this.vm.$once('hook:ready', function() {
            self.selectize = $(self.el).selectize({
              create: false,
              sortField: 'text'
            })[0].selectize;

            self.selectize.on('change', function(value) {
                console.log(value);
            });
        });
    },

    update: function(values) {
        var self = this;

        if (self.selectize) {
            values.forEach(function(item) {
                self.selectize.addItem(item);
            });
        }
    },

    unbind: function() {
        this.selectize.destroy();
    }
  });

};
