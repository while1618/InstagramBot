// Set up all routes in the app
FlowRouter.route('/', {
    action() {
        if (Meteor.userId())
            FlowRouter.redirect('/get-followers');
        else
            FlowRouter.redirect('/landing');
    },
});

FlowRouter.route('/landing', {
    action() {
        BlazeLayout.render('OuterPagesLayout', {OuterPagesTemplates: 'LandingTemplate'});
    },
});

FlowRouter.route('/guides', {
    action() {
        BlazeLayout.render('OuterPagesLayout', {OuterPagesTemplates: 'GuidesTemplate'});
    },
});

FlowRouter.route('/pricing', {
    action() {
        BlazeLayout.render('OuterPagesLayout', {OuterPagesTemplates: 'PricingTemplate'});
    },
});

FlowRouter.route('/login', {
    action() {
        if (Meteor.userId())
            FlowRouter.redirect('/get-followers');
        else
            BlazeLayout.render('AccountsLayout', {AccountsTemplates: 'LoginTemplate'});
    },
});

FlowRouter.route('/sign-up', {
    action() {
        BlazeLayout.render('AccountsLayout', {AccountsTemplates: 'SignUpTemplate'});
    },
});

FlowRouter.route('/forgot-password', {
    action() {
        BlazeLayout.render('AccountsLayout', {AccountsTemplates: 'ForgotPasswordTemplate'});
    }
});

FlowRouter.route('/reset-password/:token', {
    action() {
        BlazeLayout.render('AccountsLayout', {AccountsTemplates: 'ResetPasswordTemplate'});
    }
});

FlowRouter.route('/get-followers', {
    action() {
        if (!Meteor.userId())
            FlowRouter.redirect('/login');
        else
            BlazeLayout.render('PanelLayout', {PanelTemplates: 'GetFollowersTemplate'});
    }
});

FlowRouter.route('/posts-menu/:section', {
    action() {
        if (!Meteor.userId())
            FlowRouter.redirect('/login');
        else
            BlazeLayout.render('PanelLayout', {PanelTemplates: 'PostsMenuTemplate'});
    }
});

FlowRouter.route('/messages-menu/:section', {
    action() {
        if (!Meteor.userId())
            FlowRouter.redirect('/login');
        else
            BlazeLayout.render('PanelLayout', {PanelTemplates: 'MessagesMenuTemplate'});
    }
});

FlowRouter.route('/statistics', {
    action() {
        if (!Meteor.userId())
            FlowRouter.redirect('/login');
        else
            BlazeLayout.render('PanelLayout', {PanelTemplates: 'StatisticsTemplate'});
    }
});

FlowRouter.route('/config', {
    action() {
        if (!Meteor.userId())
            FlowRouter.redirect('/login');
        else
            BlazeLayout.render('PanelLayout', {PanelTemplates: 'ConfigTemplate'});
    }
});

FlowRouter.route('/instagram-login/:token', {
    action() {
        BlazeLayout.render('InstagramLoginLayout', {InstagramLoginTemplates: 'InstagramLoginTemplate'});
    }
});

FlowRouter.route('/is-this-you', {
    action() {
        BlazeLayout.render('InstagramLoginLayout', {InstagramLoginTemplates: 'IsThisYouTemplate'});
    }
});

FlowRouter.route('/challenge-required', {
    action() {
        BlazeLayout.render('InstagramLoginLayout', {InstagramLoginTemplates: 'ChallengeRequiredTemplate'});
    }
});

FlowRouter.notFound = {
    action() {
        BlazeLayout.render('NotFoundLayout');
    },
};
