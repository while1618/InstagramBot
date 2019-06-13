import './posts.css';
import './posts-menu.html';

Template.PostsMenuTemplate.helpers({
    postSection() {
        return FlowRouter.getParam('section');
    },
    pageNotFound() {
        FlowRouter.go('/not-found');
    }
});