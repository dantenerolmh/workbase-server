import '../chat';
import './roster-menu-item';
import './roster';
import './add-roster-modal';
import './style.css';

RosterController = ApplicationController.extend({
  template: 'Roster',
  subscriptions() {
    this.subscribe("roster");
    this.subscribe("threads", "Chat");
  },
  user() {
    return Users.findOne(this.params._id);
  },
  chat() {
    let userId = this.params._id;
    let tu = ThreadUsers.findOne({category: 'Chat', userType: 'Users', "params.chat": userId});
    return tu && Threads.findOne(tu.threadId);
  },
  detail() {
    return this.params.query.detail;
  },
  data() {
    return {
      users: Users.find({"profile.channel": {$ne: true}}, {sort: {"profile.name": 1}}),
      user: this.user(),
      chat: this.chat(),
      detail: this.detail()
    };
  }
});

Router.route('/roster/:_id?', {
  name: 'roster',
  controller: 'RosterController'
});
