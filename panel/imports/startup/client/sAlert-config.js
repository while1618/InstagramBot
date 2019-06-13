sAlert.config({
    effect: 'scale',
    position: 'top-right',
    timeout: 5000,
    html: false,
    onRouteClose: true,
    stack: true,
    offset: '50px', // in px - will be added to first alert (bottom or top - depends of the position in config)
    beep: false,
});