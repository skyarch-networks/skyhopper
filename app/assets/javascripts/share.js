//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

//    このファイルには、全体で使いたい関数を定義する。

const {
  t, // eslint-disable-line no-unused-vars
  showLoading, // eslint-disable-line no-unused-vars
  ws_connector, // eslint-disable-line no-unused-vars
} = (() => {
  const loadGif = $('<div class="loader"></div>');

  return {
    t: (scope, options) => I18n.t(scope, options),

    showLoading: (target) => {
      const load = $(`<span>${t('common.msg.loading')}</span>`);
      load.prepend(loadGif);
      target.html(load);
    },

    // for websocket
    ws_connector: (kind, id) => {
      const wsProtocol = ((document.location.protocol === 'https:') ? 'wss:' : 'ws:');
      return new WebSocket(`${wsProtocol}//${window.location.hostname}/ws/${kind}/${id}`);
    },
  };
})();

// ページの開始時の処理
{
  // Disable default behaviors of event
  const cancelDefaultEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  const addFilenameLabel = (filename, before) => {
    $('.filename_label').remove();
    before.after($('<span>').addClass('label label-default filename_label').text(filename));
  };

  // TODO: テキストファイル以外が投げられた場合は読み込まないようにしたい
  const fileDropFunc = id => ((e) => {
    cancelDefaultEvent(e);
    const file = e.originalEvent.dataTransfer.files[0];

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      $(id).val(event.target.result).trigger('change');
      addFilenameLabel(file.name, $(id));
    };
    fileReader.readAsText(file);

    if (id === '#keypair_value') {
      $('#keypair_name').val(file.name.replace(/\.\w+$/, ''));
    }
  });

  $(document).ready(() => {
    // Drag'n'drop
    // TODO: id ではなく class で指定するようにしたい
    ['#keypair_value', '#cf_template_value', '#add_modify_value'].forEach((id) => {
      $(document).on('drop', id, fileDropFunc(id));
      $(document).on('dragenter', id, cancelDefaultEvent);
      $(document).on('dragover', id, cancelDefaultEvent);
      $(id).change(() => { $('.filename_label').remove(); });
    });
  });

  /* form-validation */
  $(document).ready(() => {
    const inputs = $('input').filter('[type=text],[type=password],[type=email]').filter(':not(.allow-empty)');

    const isInputFilled = () => {
      let isFilled = true;

      inputs.each(function inputsEachHandler() {
        if ($(this).val().length === 0) {
          isFilled = false;
          return false;
        }
        if ($(this).attr('type') === 'password' && $(this).val().indexOf(' ') !== -1) {
          isFilled = false;
          return false;
        }
        return undefined;
      });

      return isFilled;
    };

    const toggleInput = () => {
      const submit = $('.create');

      if (isInputFilled()) {
        submit.removeAttr('disabled');
      } else {
        submit.attr('disabled', 'disabled');
      }
    };

    toggleInput();

    inputs.bind('keyup change', () => {
      toggleInput();
    });
  });

  // allow textfile drop
  $.event.props.push('dataTransfer');

  $(document).on('dragover', '.allow_textfile_drop', (e) => {
    e.preventDefault();
  });

  $(document).on('drop', '.allow_textfile_drop', function allowTextfileDropDropHandler(e) {
    const self = this;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      $(self).val(fileReader.result).trigger('input');
    };
    fileReader.readAsText(file);
  });

  const maskingInputForm = (btn, target) => {
    target.attr('type', 'password');
    btn.children('span.glyphicon').removeClass('glyphicon-eye-close').addClass('glyphicon-eye-open');
  };

  const unmaskingInputForm = (btn, target) => {
    target.attr('type', 'text');
    btn.children('span.glyphicon').removeClass('glyphicon-eye-open').addClass('glyphicon-eye-close');
  };

  const toggleInputMasking = (btn, target) => {
    if (target.attr('type') === 'text') {
      maskingInputForm(btn, target);
    } else {
      unmaskingInputForm(btn, target);
    }
  };

  const createMaskedInput = (input) => {
    const glyphicon = iconName => $('<span>').addClass(`glyphicon glyphicon-${iconName}`);
    const targetId = input.attr('id');
    const btnToggle = $('<button>', {
      class: 'btn btn-default toggle-input-masking',
      for: targetId,
    }).append(glyphicon('eye-open'));
    const inputGroupBtn = $('<span>', { class: 'input-group-btn' }).append(btnToggle);

    input.wrap($('<div>').addClass('input-group'));
    input.parent().append(inputGroupBtn);

    maskingInputForm(inputGroupBtn, input);
  };

  $(document).ready(() => {
    createMaskedInput($('input.form-control-masked'));

    $(document).on('click', '.toggle-input-masking', function toggleInputMaskingClickHandler(e) {
      cancelDefaultEvent(e);
      toggleInputMasking($(this), $(`#${$(this).attr('for')}`));
    });
  });

  // setup clipboard.js
  new Clipboard('[data-clipboard]').on('success', (e) => {
    const btn = $(e.trigger);
    const target = btn.find('.copied-hint-target');
    const hintText = btn.attr('data-copied-hint');
    const origText = target.text();
    btn.attr('disabled', true);
    target.text(hintText);
    setTimeout(() => {
      target.text(origText);
      btn.attr('disabled', null);
    }, 1000);
  });

  // setup vue-router
  Vue.use(VueRouter);
}
