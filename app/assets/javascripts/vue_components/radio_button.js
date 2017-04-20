exports.install = function(Vue) {
    Vue.component('radio-button', {
        props: ['name', 'label', 'choices', 'value'],
        template: "<label class='radio'><input type='radio' :value='choices' :name='name' v-model='radioButtonValue'><span>{{ label }}</span></label>",
        computed: {
            radioButtonValue: {
                get: function () {
                    return this.value
                },
                set: function () {
                    // Communicate the change to parent component so that selectedValue can be updated
                    this.$emit("change", this.choices)
                }
            }
        }
    });
};
