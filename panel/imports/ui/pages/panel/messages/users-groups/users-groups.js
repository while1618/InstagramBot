import {Meteor} from "meteor/meteor";
import {Profiles} from "../../../../../api/profiles/profiles";
import {ErrorEnum} from "../../../../../startup/both/error-enum";

import './users-groups.html';

Template.UsersGroupsTemplate.onRendered(function () {
    let routeName = 'messages-menu/when-followed';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');


    $('.svg-icon').each(function() {
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

Template.UsersGroupsTemplate.onCreated(function () {
    this.autorun(() => {
        if (!Session.get('selectedProfile')) {
            return;
        }

        this.subscribe('profiles', Session.get('selectedProfile'));
    });
});

Template.UsersGroupsTemplate.helpers({
    userGroupMembers() {
        if (Session.get('userGroupMembers'))
            return Session.get('userGroupMembers');
    },
    usersGroups() {
        if (Template.instance().subscriptionsReady()) {
            let profile = Profiles.findOne({_id: Session.get('selectedProfile')});
            if (profile)
                return profile.messageData.usersGroups;
        }
    }
});

Template.UsersGroupsTemplate.events({
    'submit #addUsersGroupsForm'(event) {
        event.preventDefault();
        let userGroupName = document.getElementById('userGroupName').value;
        Meteor.call('addUserGroup', Session.get('userGroupMembers'), userGroupName, Session.get('selectedProfile'), function (error) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                sAlert.success('User group added');
                Session.clear('userGroupMembers');
                document.getElementById('userGroupName').value = '';
            }
        })
    },
    'click #addUser'(event) {
        event.preventDefault();
        let username = document.getElementById('groupMember').value;
        Meteor.call('checkUsername', username, Session.get('selectedProfile'), function (error) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                let users = [];
                if (!Session.get('userGroupMembers')) {
                    users.push(username);
                } else {
                    users = Session.get('userGroupMembers');
                    if (users.length < 20) {
                        if (users.indexOf(username) > -1) {
                            sAlert.error(ErrorEnum.userGroupMemberExists.reason);
                        } else {
                            users.push(username);
                        }
                    } else {
                        sAlert.error(ErrorEnum.reachMaxUserGroupMembers.reason);
                    }
                }
                Session.set('userGroupMembers', users);
                document.getElementById('groupMember').value = '';
            }
        })
    },
    'click #delete'() {
        new Confirmation({
            message: 'Do you really want to delete users group?',
            title: 'Delete Users Group',
            cancelText: 'No',
            okText: 'Yes',
            success: true, // whether the button should be green or red
            focus: 'cancel' // which button to autofocus, 'cancel' (default) or 'ok', or 'none'
        }, (result) => {
            if (result) {
                Meteor.call('deleteUserGroup', this.userGroupId, Session.get('selectedProfile'), function(error) {
                    if (error)
                        sAlert.error(error.reason);
                });
            }
        });
    },
    'click'(e){
        let activeModal = $('.custom-group-modal.active');

        let inModal;
        inModal = $(e.currentTarget).parents('.custom-group-modal.active').length;

        if ( activeModal.length && !inModal) {
            activeModal.removeClass('active');
        }
    },
    'click #preview'(e) {
        // console.log()
        $(e.currentTarget).parents('.message').next('.custom-group-modal').addClass('active');
    },
    'click .close-modal'(e) {
        $(e.currentTarget).parents('.custom-group-modal').removeClass('active');
    },
});