// Fill the DB with example data on startup

import { Meteor } from 'meteor/meteor';
import {Proxies} from "../../api/proxy/proxy";

Meteor.startup(() => {
    if (Meteor.users.find().count() === 0) {
        admin();
    }
    if (Proxies.find().count() === 0) {
        proxies();
    }
});

function admin() {
    //TODO:
    let userId = Accounts.createUser({
        username: 'admin',
        email: 'your-email',
        password: 'your-password',
        profile: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            numberOfValidationEmailsSent: 0,
            darkTheme: false
        }
    });
    Roles.addUsersToRoles(userId, 'normal-user');
    Roles.addUsersToRoles(userId, 'admin');
    Meteor.users.update({_id: userId}, {$set: {'emails.0.verified': true}});
}

function proxies() {
    //TODO:
    let proxies = [
        {proxy: 'your-proxy-ips', numberOfUses: 4},
        {proxy: 'your-proxy-ips', numberOfUses: 5},
        {proxy: 'your-proxy-ips', numberOfUses: 3},
        {proxy: 'your-proxy-ips', numberOfUses: 2},
        {proxy: 'your-proxy-ips', numberOfUses: 1},
    ];
    proxies.forEach(doc => {
        Proxies.insert(doc);
    });
}
