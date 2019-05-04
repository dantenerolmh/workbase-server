import './profile.html';

import loadImage from "blueimp-load-image";
import SimpleSchema from 'simpl-schema';
import Swal from 'sweetalert2';
import autosize from 'autosize';

Template.ProfilePanel.events({
  "click .user-panel"(e, t) {
    e.preventDefault();
    Modal.show('ProfileModal', null, {
      backdrop: 'static'
    });
  }
});

Template.ProfileModal.onCreated(function() {
  this.signature = new ReactiveVar(Meteor.user().signature());
});

Template.ProfileModal.onRendered(function() {
  autosize($('form textarea'));
});

Template.ProfileModal.helpers({
  formCollection() {
    return Users;
  },
  formSchema() {
    return new SimpleSchema({
      language: {
        type: String,
        max: 50,
        optional: true,
        autoform: {
          type: 'select',
          label: I18n.t("profile_language"),
          options: [
            {label: "English", value: "en-US"},
            {label: "简体中文", value: "zh-CN"}
          ]
        }
      },
      skin: {
        type: String,
        max: 20,
        optional: true,
        autoform: {
          type: 'select',
          label: I18n.t("profile_skin"),
          options: [
            {label: I18n.t("profile_skin_blue"), value: "blue"},
            {label: I18n.t("profile_skin_purple"), value: "purple"},
            {label: I18n.t("profile_skin_red"), value: "red"},
            {label: I18n.t("profile_skin_green"), value: "green"},
            {label: I18n.t("profile_skin_yellow"), value: "yellow"}
          ]
        }
      },
      message: {
        type: String,
        max: 100,
        optional: true,
        autoform: {
          type: 'text',
          label: I18n.t("profile_personal_message")
        }
      },
      signature: {
        type: String,
        max: 200,
        optional: true,
        autoform: {
          type: 'textarea',
          label: I18n.t("profile_signature")
        }
      }
    });
  },
  signature() {
    return Template.instance().signature.get();
  }
});

Template.ProfileModal.events({
  "keyup form textarea[name=signature]"(e, t) {
    t.signature.set($(e.target).val());
  },
  "change form select[name=language]"(e, t) {
    e.preventDefault();
    Meteor.call('updateProfile', {language: $(e.target).val()}, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        document.location.reload(true);
      }
    });
  },
  "change form select[name=skin]"(e, t) {
    e.preventDefault();
    Meteor.call('updateProfile', {skin: $(e.target).val()}, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        document.location.reload(true);
      }
    });
  },
  "click #btn-cancel"(e, t) {
    e.preventDefault();
    history.go(-1);
  },
  "click #btn-upload-avatar"(e, t) {
    e.preventDefault();
    $('#avatar-file').click();
  },
  "change #avatar-file"(e, t) {
    Modal.show('AvatarUploadModal', {
      file: e.target.files[0]
    }, {
      backdrop: 'static'
    });
    $(e.target).val(""); // reset file input
  },
  "click #btn-change-password"(e, t) {
    e.preventDefault();
    Modal.show("ChangePasswordModal", null, {
      backdrop: 'static'
    });
  },
  "click #btn-sign-out"(e, t) {
    e.preventDefault();
    Modal.hide("ProfileModal");
    Router.go('/');
    Meteor.logout();
  }
});

AutoForm.hooks({
  "profile-form": {
    onSubmit(insertDoc, updateDoc, currentDoc) {
      this.event.preventDefault();

      Meteor.call('updateProfile', insertDoc, (err, res) => {
        if (err) {
          Swal({
            title: err,
            type: "error"
          });
        } else {
          if (res) {
            Swal({
              title: I18n.t("Profile Saved"),
              type: "info"
            });
          }
        }
        $(".modal").modal('hide');
        this.done();
      });
    }
  },
  "change-password-form": {
    onSubmit(insertDoc, updateDoc, currentDoc) {
      this.event.preventDefault();

      if (insertDoc.password !== insertDoc.passwordConfirm) {
        Swal({
          title: I18n.t("profile_password_not_match"),
          type: "warning"
        });
        return this.done();
      }
      Accounts.changePassword(insertDoc.passwordCurrent, insertDoc.password, (err) => {
        if (err) {
          console.log(err);
          Swal({
            title: I18n.t(err.reason),
            type: "error"
          });
        } else {
          Swal({
            title: I18n.t("profile_password_saved"),
            type: "info"
          });
          Modal.hide("ChangePasswordModal");
        }
        this.done();
      });
    }
  }
});

Template.AvatarUploadModal.onCreated(function() {
  this.currentUpload = new ReactiveVar(false);
});

Template.AvatarUploadModal.onRendered(function() {
  loadImage(this.data.file, (img) => {
    $("#image-preview").html(img);
    $("#image-preview img").addClass("img-responsive center-block");
  }, {
    maxWidth:  "570",
    maxHeight: "350"
  });
});

Template.AvatarUploadModal.helpers({
  currentUpload() {
    return Template.instance().currentUpload.get();
  }
});

Template.AvatarUploadModal.events({
  "click #btn-send-image"(e, t) {
    e.preventDefault();

    $('#btn-send-image').attr("disabled", "disabled");
    const upload = AvatarFiles.insert({
      file: t.data.file,
      streams: 'dynamic',
      chunkSize: 'dynamic'
    }, false);

    upload.on('start', function() {
      t.currentUpload.set(this);
    });

    upload.on('end', function(error, fileObj) {
      if (error) {
        alert('Error during upload: ' + error);
        $('#btn-send-image').attr("disabled", false);
      } else {
        // alert('File "' + fileObj.name + '" successfully uploaded');
        Meteor.call('updateProfile', {
          avatar: AvatarFiles.link(fileObj, 'thumbnail')
        }, (err, res) => {
          Modal.hide('AvatarUploadModal');
        });
      }
      t.currentUpload.set(false);
    });

    upload.start();
  }
});

Template.ChangePasswordModal.helpers({
  formCollection() {
    return Users;
  },
  formSchema() {
    return new SimpleSchema({
      passwordCurrent: {
        type: String,
        max: 30,
        autoform: {
          type: 'password',
          label: I18n.t("profile_current_password")
        }
      },
      password: {
        type: String,
        max: 30,
        autoform: {
          type: 'password',
          label: I18n.t("profile_new_password")
        }
      },
      passwordConfirm: {
        type: String,
        max: 30,
        autoform: {
          type: 'password',
          label: I18n.t("profile_confirm_password")
        }
      }
    });
  }
});
