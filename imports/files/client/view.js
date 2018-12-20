import './view.html';

import Swal from 'sweetalert2';

Template.FileRemoveLink.events({
  "click .btn-remove-file"(e, t) {
    e.preventDefault();
    Swal({
      title: I18n.t("confirm remove file"),
      type: 'warning',
      position: 'center-end',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: I18n.t("Confirm"),
      cancelButtonText: I18n.t("Discard")
    }).then((result) => {
      if (result.value) {
        Meteor.call("files.remove", this._id);
      }
    })
  }
});

Template.FileUploadModal.onCreated(function() {
  this.currentUpload = new ReactiveVar(false);
});

Template.FileUploadModal.onRendered(function() {
  let data = this.data;
  let _this = this;
  const upload = Files.insert({
    file: data.file,
    streams: 'dynamic',
    chunkSize: 'dynamic',
    meta: {
      relations: [
        {
          threadId:  data.thread._id,
          userType:  'Users',
          userId:    Meteor.userId(),
          type:      'file',
          createdAt: new Date()
        }
      ]
    }
  }, false);

  upload.on('start', function() {
    _this.currentUpload.set(this);
  });

  upload.on('end', function(error, fileObj) {
    if (error) {
      alert('Error during upload: ' + error);
    } else {
      Meteor.setTimeout(() => {
        Modal.hide('FileUploadModal');
        _this.currentUpload.set(false);
      }, 1000);
    }
  });

  upload.start();
});

Template.FileUploadModal.helpers({
  currentUpload() {
    return Template.instance().currentUpload.get();
  }
});
