import $ from 'jquery';
import env from '../core/env';
import key from '../core/key';

export default class ImageDialog {
  constructor(context) {
    this.context = context;

    this.ui = $.summernote.ui;
    this.$body = $(document.body);
    this.$editor = context.layoutInfo.editor;
    this.options = context.options;
    this.lang = this.options.langInfo;
  }

  initialize() {
    let imageLimitation = '';
    if (this.options.maximumImageFileSize) {
      const unit = Math.floor(Math.log(this.options.maximumImageFileSize) / Math.log(1024));
      const readableSize = (this.options.maximumImageFileSize / Math.pow(1024, unit)).toFixed(2) * 1 +
                         ' ' + ' KMGTP'[unit] + 'B';
      imageLimitation = `<small>${this.lang.image.maximumFileSize + ' : ' + readableSize}</small>`;
    }

    const $container = this.options.dialogsInBody ? this.$body : this.options.container;
    const body = [
      '<div class="form-group note-form-group note-group-select-from-files">',
        `<label for="note-dialog-image-file-${this.options.id}" class="note-form-label">${this.lang.image.selectFromFiles}</label>`,
        `<input id="note-dialog-image-file-${this.options.id}" class="note-image-input form-control-file note-form-control note-input" type="file" name="files" accept="image/*" multiple="multiple"/>`,
        imageLimitation,
      '</div>',
      '<div class="form-group note-form-group note-group-image-url">',
        `<label for="note-dialog-image-url-${this.options.id}" class="note-form-label">${this.lang.image.url}</label>`,
        `<input id="note-dialog-image-url-${this.options.id}" class="note-image-url form-control note-form-control note-input" type="text"/>`,
      '</div>',
      '<div class="form-group note-form-group note-group-image-title">',
				`<label for="note-dialog-image-title-${this.options.id}" class="note-form-label">${this.lang.image.title}</label>`,
    		`<input id="note-dialog-image-title-${this.options.id}" class="form-control note-input note-image-title" type="text"/>`,
			'</div>',
			'<div class="form-group note-form-group note-group-image-alt">',
				`<label for="note-dialog-image-alt-${this.options.id}" class="note-form-label">${this.lang.image.alt}</label>`,
				`<input id="note-dialog-image-alt-${this.options.id}" class="form-control note-input note-image-alt" type="text"/>`,
			'</div>',
			'<div class="form-group note-form-group note-group-image-caption">',
				`<label for="note-dialog-image-caption-${this.options.id}" class="note-form-label">${this.lang.image.caption}</label>`,
				`<input id="note-dialog-image-caption-${this.options.id}" class="form-control note-input note-image-caption" type="text"/>`,
      '</div>',
      '<div class="form-group note-form-group note-group-image-caption">',
				`<label for="note-dialog-image-class-${this.options.id}" class="note-form-label">${this.lang.image.class}</label>`,
				`<input id="note-dialog-image-class-${this.options.id}" class="form-control note-input note-image-class" type="text"/>`,
      '</div>',
    ].join('');

    const buttonClass = 'btn btn-primary note-btn note-btn-primary note-image-btn';
    const footer = `<input type="button" href="#" class="${buttonClass}" value="${this.lang.image.insert}" disabled>`;

    this.$dialog = this.ui.dialog({
      title: this.lang.image.insert,
      fade: this.options.dialogsFade,
      body: body,
      footer: footer,
    }).render().appendTo($container);
  }

  destroy() {
    this.ui.hideDialog(this.$dialog);
    this.$dialog.remove();
  }

  bindEnterKey($input, $btn) {
    $input.on('keypress', (event) => {
      if (event.keyCode === key.code.ENTER) {
        event.preventDefault();
        $btn.trigger('click');
      }
    });
  }

  /**
   * show image dialog
   *
   * @param {jQuery} $dialog
   * @return {Promise}
   */
  showImageDialog(imageInfo) {
    return $.Deferred((deferred) => {
      const $imageInput = this.$dialog.find('.note-image-input');
      const $imageSrc = this.$dialog.find('.note-image-url');
      const $imageTitle = this.$dialog.find('.note-image-title');
      const $imageAlt = this.$dialog.find('.note-image-alt');
      const $imageCaption = this.$dialog.find('.note-image-caption');
      const $imageClass = this.$dialog.find('.note-image-class');
      const $imageBtn = this.$dialog.find('.note-image-btn');

      this.ui.onDialogShown(this.$dialog, () => {
        this.context.triggerEvent('dialog.shown');

        // Cloning imageInput to clear element.
        $imageInput.replaceWith($imageInput.clone().on('change', (event) => {
          deferred.resolve(event.target.files || event.target.value);
        }).val(''));

        $imageSrc.on('input paste propertychange', () => {
          this.ui.toggleBtn($imageBtn, $imageSrc.val());
        }).val('');

        if (!env.isSupportTouch) {
          $imageSrc.trigger('focus');
        }

        $imageTitle.val(imageInfo.title);

        $imageAlt.val(imageInfo.alt);

        $imageCaption.val(imageInfo.caption);

        $imageClass.val(imageInfo.class);

        $imageBtn.one('click', (event) => {
          event.preventDefault();

          deferred.resolve({
            range: imageInfo.range,
            input: $imageInput.val(),
            src: $imageSrc.val(),
            title: $imageTitle.val(),
            alt: $imageAlt.val(),
            caption: $imageCaption.val(),
            class: $imageClass.val(),
          });
          this.ui.hideDialog(this.$dialog);
        });
//        this.bindEnterKey($imageUrl, $imageBtn);
      });

      this.ui.onDialogHidden(this.$dialog, () => {
        $imageInput.off();
        $imageSrc.off();
        $imageBtn.off();

        if (deferred.state() === 'pending') {
          deferred.reject();
        }
      });

      this.ui.showDialog(this.$dialog);
    }).promise();
  }

  /**
   * @param {Object} layoutInfo
   */
  show() {
    const imageInfo = this.context.invoke('editor.getImageInfo');

    this.context.invoke('editor.saveRange');
    this.showImageDialog(imageInfo).then((imageInfo) => {
      // [workaround] hide dialog before restore range for IE range focus
      this.ui.hideDialog(this.$dialog);
      this.context.invoke('editor.restoreRange');

//      if (typeof imageInfo.src === 'string') { // image url
        // If onImageLinkInsert set,
//        if (this.options.callbacks.onImageLinkInsert) {
//          this.context.triggerEvent('image.link.insert', imageInfo);
//        } else {
          this.context.invoke('editor.insertImage', imageInfo);
//        }
//      } else { // array of files
//        this.context.invoke('editor.insertImagesOrCallback', imageInfo);
//      }
    }).fail(() => {
      this.context.invoke('editor.restoreRange');
    });
  }
}
