Template.registerHelper('company', function() {
  return Instance.company();
});

Template.registerHelper('countUnread', function() {
  return Counts.get('count-unread-inbox');
});

Template.registerHelper('countUnreadChannel', function(channel) {
  return Counts.get(`count-unread-channel-${channel}`);
});

Template.registerHelper('domain', function() {
  return Instance.domain();
});

Template.registerHelper('isMe', (user) => {
  return Meteor.user().isMe(user);
});

Template.registerHelper('inRouter', function(router) {
  return Router.current().route.getName() === router;
});

let moment = require('moment');
const formattedDate = function(date, format) {
  date = moment(date);
  if (format === 'simple') {
    // today
    if (date.isBetween(moment().startOf('day'), moment().endOf('day'))) {
      return date.format('HH:mm');
    }
    // this week
    if (date.isBetween(moment().startOf('week'), moment().endOf('week'))) {
      return date.format('ddd');
    }
    // this month
    if (date.isBetween(moment().startOf('month'), moment().endOf('month'))) {
      return date.format('MM-DD');
    }
    // this year
    if (date.isBetween(moment().startOf('year'), moment().endOf('year'))) {
      return date.format('MM-DD');
    }
    return date.format('l');
  } else if (format === 'simpleDayWithTime') {
    // today
    if (date.isBetween(moment().startOf('day'), moment().endOf('day'))) {
      return date.format('a h:mm');
    }
    // yesterday
    if (date.isBetween(moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day'))) {
      return date.format('昨天 ah:mm');
    }
    // this week
    if (date.isBetween(moment().startOf('week'), moment().endOf('week'))) {
      return date.format('ddd a h:mm');
    }
    // this month
    if (date.isBetween(moment().startOf('month'), moment().endOf('month'))) {
      return date.format('MM-DD a h:mm');
    }
    // this year
    if (date.isBetween(moment().startOf('year'), moment().endOf('year'))) {
      return date.format('MM-DD a h:mm');
    }
    return date.format('YYYY-MM-DD HH:mm');
  } else {
    return date.format(format);
  }
};

Template.registerHelper('formattedDate', formattedDate);