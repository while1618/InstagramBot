import './panel.html';
import {Meteor} from "meteor/meteor";
import 'simplebar/dist/simplebar.min';
import 'simplebar/dist/simplebar.min.css';

Template.PanelLayout.helpers({
    darkThemeState() {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (user)
            return user.profile.darkTheme;
    }
});

Template.PanelLayout.events({
    'click'(e) {
        let target = $(e.currentTarget),
            customSelectValue = $('.custom-select-value'),
            customSelectOptions = $('.custom-select-options');

        if (!target.parents('.custom-select-wrapper').length && customSelectValue.hasClass('active')) {
            customSelectValue.removeClass('active');
            customSelectOptions.removeClass('active');
        }
    }
});