import Chart from 'chart.js';
import momentTimezone from 'moment-timezone';
import {ReactiveDict} from "meteor/reactive-dict";

import './statistics.css';
import './statistics.html';

Template.StatisticsTemplate.onCreated(function () {
    this.reactiveDict = new ReactiveDict();
});

Template.StatisticsTemplate.onRendered(function () {
    this.reactiveDict.set('loading', true);
    this.reactiveDict.set('date', moment().format("DD.MM.YYYY."));
    this.reactiveDict.set('statisticsType', 'week');

    if (Template.instance().subscriptionsReady()) {
        this.chartObjects = {
            'followsChart': new Chart(document.getElementById('followsChart').getContext('2d'), emptyChart('bar')).stop(),
            'unfollowsChart': new Chart(document.getElementById('unfollowsChart').getContext('2d'), emptyChart('bar')).stop(),
            'followersChart': new Chart(document.getElementById('followersChart').getContext('2d'), emptyChart('line')).stop(),
        };
        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
            Object.assign(this.chartObjects,
                {
                    'followingsChart': new Chart(document.getElementById('followingsChart').getContext('2d'), emptyChart('bar')).stop(),
                    'unfollowingsChart': new Chart(document.getElementById('unfollowingsChart').getContext('2d'), emptyChart('bar')).stop(),
                    'followingChart': new Chart(document.getElementById('followingChart').getContext('2d'), emptyChart('line')).stop()
                });
        }

        Meteor.call('getChartData', 'week',
            moment.utc(moment().startOf('week')).format("DD.MM.YYYY. HH:mm:ss"),
            moment.utc(moment().endOf('week')).format("DD.MM.YYYY. HH:mm:ss"),
            Session.get('selectedProfile'),
            momentTimezone.tz.guess(true),
            (error, respond) => {
                if (error) {
                    sAlert.error(error.reason);
                    this.reactiveDict.set('loading', false);
                } else {
                    updateCharts(respond, this);
                    this.reactiveDict.set('loading', false);
                }
            }
        );
    }

    this.$('#datetimepicker').datetimepicker({
        format: 'DD.MM.YYYY.',
        allowInputToggle: true,
    }).on('dp.change', () => {
        showStatistics(this);
    });

    let routeName = 'statistics';
    $('.navigation').find('a').removeClass('active');
    $('.navigation').find(`[href='/${routeName}']`).addClass('active');


    let $img = jQuery(this);
    let imgID = $img.attr('id');
    let imgClass = $img.attr('class');
    let imgURL = $img.attr('src');

    jQuery.get(imgURL, function (data) {
        // Get the SVG tag, ignore the rest
        let $svg = jQuery(data).find('svg');

        // Add replaced image's ID to the new SVG
        if (typeof imgID !== 'undefined') {
            $svg = $svg.attr('id', imgID);
        }
        // Add replaced image's classes to the new SVG
        if (typeof imgClass !== 'undefined') {
            $svg = $svg.attr('class', imgClass + ' replaced-svg');
        }

        // Remove any invalid XML tags as per http://validator.w3.org
        $svg = $svg.removeAttr('xmlns:a');

        // Replace image with new SVG
        $img.replaceWith($svg);

    }, 'xml');

});

Template.StatisticsTemplate.helpers({
    currentDate() {
        return moment().format('DD.MM.YYYY.');
    },
    loading() {
        return Template.instance().reactiveDict.get('loading');
    },
    fromDate() {
        return moment(Template.instance().reactiveDict.get('date'), "DD.MM.YYYY.").startOf(Template.instance().reactiveDict.get('statisticsType')).format("ll");
    },
    fromTime() {
        return moment(Template.instance().reactiveDict.get('date'), "DD.MM.YYYY.").startOf(Template.instance().reactiveDict.get('statisticsType')).format("HH:mm");
    },
    toDate() {
        return moment(Template.instance().reactiveDict.get('date'), "DD.MM.YYYY.").endOf(Template.instance().reactiveDict.get('statisticsType')).format("ll");
    },
    toTime() {
        return moment(Template.instance().reactiveDict.get('date'), "DD.MM.YYYY.").endOf(Template.instance().reactiveDict.get('statisticsType')).format("HH:mm");
    }
});

Template.StatisticsTemplate.events({
    'change #statisticsType'(event, instance) {
        event.preventDefault();
        showStatistics(instance);
    },
    'click .stat-filter-select .custom-select-value'(e) {
        let $this = $(e.currentTarget);

        $this.removeClass('error');
        $this.toggleClass('active');
        $('.stat-filter-select .custom-select-options').toggleClass('active');
    },
    'click .stat-filter-select .custom-select-options .option'(e) {
        let $this = $(e.currentTarget),
            value = $this.data('value'),
            name = $this.text(),
            customSelectValue = $('.stat-filter-select .custom-select-value');

        $('.stat-filter-select select').val(value);

        customSelectValue.addClass('active-value').find('.value').text(name);
        customSelectValue.trigger('click');

        $('.stat-filter-select select').trigger('change');
    }
});

function showStatistics(instance) {
    let selectedStatisticsType = document.getElementById('statisticsType').value;
    let date = document.getElementById('date').value;
    Meteor.call('getChartData', selectedStatisticsType,
        moment.utc(moment(date, "DD.MM.YYYY.").startOf(selectedStatisticsType)).format("DD.MM.YYYY. HH:mm:ss"),
        moment.utc(moment(date, "DD.MM.YYYY.").endOf(selectedStatisticsType)).format("DD.MM.YYYY. HH:mm:ss"),
        Session.get('selectedProfile'),
        momentTimezone.tz.guess(true),
        function (error, respond) {
            if (error) {
                sAlert.error(error.reason);
            } else {
                updateCharts(respond, instance);
                instance.reactiveDict.set('date', date);
                instance.reactiveDict.set('statisticsType', selectedStatisticsType);
            }
        }
    );
}

function updateCharts(respond, instance) {
    Object.keys(instance.chartObjects).forEach((key) => {
        instance.chartObjects[key].type = respond[key].type;
        instance.chartObjects[key].data = respond[key].data;
        instance.chartObjects[key].options = respond[key].options;
        instance.chartObjects[key].update();
    });
}

function emptyChart(type) {
    return {
        type: type,
        data: {
            labels: [],
            datasets: [{
                data: []
            }]
        },
        options: {}
    };
}