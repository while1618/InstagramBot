import {Meteor} from "meteor/meteor";
import {Profiles} from "../../../api/profiles/profiles";
import {Files} from "../../../api/file-upload/file-upload";

import './nav-menu.css';
import './nav-menu.html';

Template.NavMenuTemplate.onCreated(function () {
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
        this.subscribe('files', Session.get('selectedProfile'));
    });
});

Template.NavMenuTemplate.onRendered(function () {
    let actions = $(`.actions`),
        actionsMenu = $(`.actions-menu`);

    actions.on('click', function() {
        actionsMenu.toggleClass('show-menu');
        actions.toggleClass('menu-active');
    });

    $(document).click(function (e) {
        if (e.target !== actions[0] && !$(e.target).parents(`.actions`).length && actionsMenu.hasClass('show-menu')) {
            actionsMenu.removeClass('show-menu');
            actions.removeClass('menu-active')
        }
    });

    $('.nav-menu').find('img').each(function(){

        let $img = jQuery(this);
        let imgID = $img.attr('id');
        let imgClass = $img.attr('class');
        let imgURL = $img.attr('src');

        jQuery.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            let $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if(typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if(typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass+' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');
    });
});

Template.NavMenuTemplate.helpers({
    selectedProfile() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.instagramData.instagramUsername;
        }
    },
    darkThemeState() {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        if (user)
            return user.profile.darkTheme;
    },
    getFile() {
        if (Template.instance().subscriptionsReady())
            return Files.findOne({"meta.profileId": Session.get('selectedProfile')});
    }
});

Template.NavMenuTemplate.events({
    'click #logout'(event) {
        event.preventDefault();
        Meteor.logout(function (error) {
            if (error) {
                console.log(error.reason);
            } else {
                FlowRouter.go('/');
                Session.clear();
            }
        })
    },
    'click #dark-theme-toggle'() {
        let darkThemeState = document.getElementById('dark-theme-toggle').checked;
        Meteor.call('changeDarkThemeState', darkThemeState, function (error) {
            if (error) {
                console.log(error);
            }
        });

        let classToAdd = darkThemeState ? 'theme-dark' : 'theme-light',
            classToDisable = darkThemeState ? 'theme-light' : 'theme-dark';

        $('.main-app').removeClass(classToDisable).addClass(classToAdd);
    }
});