import './messages.css';
import './messages-menu.html';

Template.MessagesMenuTemplate.helpers({
    messageSection() {
        return FlowRouter.getParam('section');
    },
    pageNotFound() {
        FlowRouter.go('/not-found');
    }
});