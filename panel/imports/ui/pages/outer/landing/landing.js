import './landing.html';
import './landing.css';
import {Meteor} from "meteor/meteor";

Template.LandingTemplate.onRendered(function () {
    let weProvideExpandedSections = $('.wp-expanded-grid'),
        weProvideContents = $('.wp-contents');

    $(document).on('scroll', function() {
        triggerAnimation(weProvideContents, Math.floor(window.innerHeight * 0.9));
        triggerAnimation(weProvideExpandedSections, 'bottom');
    });

    function triggerAnimation(elements, placement) {
        let isTriggered = false;

        if (!isTriggered) {
            elements.each(function() {
                let offset = this.getBoundingClientRect().top - (placement === 'bottom' ? window.innerHeight : placement),
                    $this = $(this);

                if (offset < 0) {
                    $this.addClass('active');
                    isTriggered = true;
                }
            });
        }
    }
});

Template.LandingTemplate.events({
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
    }
});
