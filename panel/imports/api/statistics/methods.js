import {Security} from "../../startup/server/security";
import {ErrorEnum} from "../../startup/both/error-enum";
import {StatisticsContext} from "../../startup/server/get-statistics/StatisticsContext";

Meteor.methods({
    'getChartData'(selectedStatisticsType, startDate, endDate, selectedProfile, timeZone) {
        try {
            Security.isLogged();
            Security.checkSelectedProfile(selectedProfile);
            Security.isProfileExpired(selectedProfile);
            Security.checkStatisticsType(selectedStatisticsType);
            Security.isDate(startDate);
            Security.isDate(endDate);
            Security.checkTimeZone(timeZone);
        } catch (exception) {
            throw new Meteor.Error('sAlertError', exception.reason);
        }

        let statistics = getStatistics(selectedProfile, startDate, endDate, selectedStatisticsType, timeZone);

        if (statistics.error)
            throw new Meteor.Error('sAlertError', ErrorEnum.noStatisticsRecord.reason);

        let charts = {
            followsChart: barChart(statistics.follows.labels, statistics.follows.data, 'Number of follows'),
            unfollowsChart: barChart(statistics.unfollows.labels, statistics.unfollows.data, 'Number of unfollows'),
            followersChart: lineChart(statistics.followers.labels, statistics.followers.data, 'Followers')
        };
        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
            Object.assign(charts,
                {
                    followingsChart: barChart(statistics.following.labels, statistics.following.data, 'Number of followings'),
                    unfollowingsChart: barChart(statistics.unfollowing.labels, statistics.unfollowing.data, 'Number of unfollowings'),
                    followingChart: lineChart(statistics.followings.labels, statistics.followings.data, 'Following')
                });
        }
        return charts;
    }
});

function getStatistics(selectedProfile, startDate, endDate, selectedStatisticsType, timeZone) {
    let statistics = StatisticsContext.getInstance(selectedProfile, moment.utc(startDate, 'DD.MM.YYYY. HH:mm:ss').toDate()
        , moment.utc(endDate, 'DD.MM.YYYY. HH:mm:ss').toDate(), timeZone).pickStatistics(selectedStatisticsType);
    statistics.calculate();
    return  statistics.getStatistics();
}

function barChart(labels, data, text) {
    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data
            }]
        },
        options: {
            title: {
                display: true,
                text: text
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    gridLines: {
                        display: false
                    }
                }]
            }
        }
    };
}

function lineChart(labels, data, text) {
    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data
            }]
        },
        options: {
            title: {
                display: true,
                text: text
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        display: false
                    }
                }]
            }
        }
    };
}