import './guides.html';
import './guides.css';
import {Meteor} from "meteor/meteor";

Template.GuidesTemplate.onRendered(function(){

    let itemsMainSection = $('.gn-main-section');
    itemsMainSection.on('click', function(){
        let $this = $(this);

        itemsMainSection.siblings('.gn-expand-section').removeClass('active');
        $('.arrow').removeClass('active');

        $this.find('.arrow').addClass('active');
        $this.siblings('.gn-expand-section').addClass('active');
    });






    $('.svg-icon').each(function(){

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

Template.GuidesTemplate.events({
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
