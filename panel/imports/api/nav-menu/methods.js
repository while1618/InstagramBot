import {Security} from "../../startup/server/security";

Meteor.methods({
    'changeDarkThemeState'(darkThemeState) {
        try {
            Security.isLogged();
            Security.isBoolean(darkThemeState);
            Meteor.users.update({_id: Meteor.userId()}, {$set: {'profile.darkTheme': darkThemeState}})
        } catch (exception) {
            throw new Meteor.Error(exception.error, exception.reason);
        }
    }
});