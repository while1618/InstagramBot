import Chart from 'chart.js'

//global
Chart.defaults.global.legend.display = false;
Chart.defaults.global.title.fontSize = 30;
Chart.defaults.global.title.fontFamily = 'Montserrat';
Chart.defaults.global.title.fontStyle = 'normal';
Chart.defaults.global.title.padding = 45;
Chart.defaults.global.title.fontColor = '#7b838f';

Chart.defaults.scale.gridLines.color = '#7b838f';

// bar chart configuration
Chart.defaults.global.elements.rectangle.backgroundColor = 'rgba(219, 88, 86, 0.7)';
Chart.defaults.global.elements.rectangle.borderColor = 'rgba(219, 88, 86, 1)';
Chart.defaults.global.elements.rectangle.borderWidth = 1;

//line chart configuration
Chart.defaults.global.elements.point.radius = 5;
Chart.defaults.global.elements.point.backgroundColor = 'rgba(219, 88, 86, 1)';
Chart.defaults.global.elements.point.borderColor = 'rgba(219, 88, 86, 1)';

Chart.defaults.global.elements.line.fill = true;
Chart.defaults.global.elements.line.tension = 0.2;
Chart.defaults.global.elements.line.backgroundColor = 'rgba(219, 88, 86, 0.7)';
Chart.defaults.global.elements.line.borderColor = 'rgba(219, 88, 86, 1)';
