import {GetStatisticsData} from "./GetStatisticsData";
import * as momentTimezone from "moment-timezone";

export class MonthStatisticData extends GetStatisticsData {
    private readonly numberOfFollowsPerDay;
    private readonly numberOfUnfollowsPerDay;
    private readonly numberOfFollowersPerDay;
    private readonly numberOfFollowingPerDay;
    private readonly numberOfUnfollowingPerDay;
    private readonly numberOfFollowingsPerDay;

    public constructor(profileId, startDate, endDate, timeZone) {
        super(profileId, startDate, endDate, timeZone);
        this.numberOfFollowsPerDay = MonthStatisticData.setKeys();
        this.numberOfUnfollowsPerDay = MonthStatisticData.setKeys();
        this.numberOfFollowersPerDay = MonthStatisticData.setKeys();
        this.numberOfFollowingPerDay = MonthStatisticData.setKeys();
        this.numberOfUnfollowingPerDay = MonthStatisticData.setKeys();
        this.numberOfFollowingsPerDay = MonthStatisticData.setKeys();
    }

    private static setKeys() {
        return {
            '1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null,
            '10': null, '11': null, '12': null, '13': null, '14': null, '15': null, '16': null, '17': null, '18': null,
            '19': null, '20': null, '21': null, '22': null, '23': null, '24': null, '25': null, '26': null, '27': null,
            '28': null, '29': null, '30': null, '31': null
        };
    }

    public calculate() {
        if (this.data) {
            for (let i = 0; i < this.data['statistics'].length; i++) {
                let day = momentTimezone(this.data['statistics'][i]['updatedAt']).tz(this.timeZone).format('D');
                this.numberOfFollowsPerDay[day] += this.data['statistics'][i]['follows'];
                this.numberOfUnfollowsPerDay[day] += this.data['statistics'][i]['unfollows'];
                this.numberOfFollowersPerDay[day] = this.data['statistics'][i]['numberOfFollowers'];
                this.numberOfFollowingPerDay[day] += this.data['statistics'][i]['following'];
                this.numberOfUnfollowingPerDay[day] += this.data['statistics'][i]['unfollowing'];
                this.numberOfFollowingsPerDay[day] = this.data['statistics'][i]['numberOfFollowing'];
            }
        }
    }

    protected getFollowersStatistics(): object {
        let object = {follows: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfFollowsPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.follows.labels.push(key);
                object.follows.data.push(this.numberOfFollowsPerDay[key]);
            }
        });
        return object;
    }

    protected getFollowingStatistics(): object {
        let object = {unfollows: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfUnfollowsPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.unfollows.labels.push(key);
                object.unfollows.data.push(this.numberOfUnfollowsPerDay[key]);
            }
        });
        return object;
    }

    protected getFollowingsStatistics(): object {
        let object = {followers: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfFollowersPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.followers.labels.push(key);
                object.followers.data.push(this.numberOfFollowersPerDay[key]);
            }
        });
        return object;
    }

    protected getFollowsStatistics(): object {
        let object = {following: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfFollowingPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.following.labels.push(key);
                object.following.data.push(this.numberOfFollowingPerDay[key]);
            }
        });
        return object;
    }

    protected getUnfollowingStatistics(): object {
        let object = {unfollowing: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfUnfollowingPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.unfollowing.labels.push(key);
                object.unfollowing.data.push(this.numberOfUnfollowingPerDay[key]);
            }
        });
        return object;
    }

    protected getUnfollowsStatistics(): object {
        let object = {followings: {labels: [], data: []}};
        let numberOfDaysInMonth = momentTimezone(this.startDate).tz(this.timeZone).daysInMonth();
        Object.keys(this.numberOfFollowingsPerDay).forEach((key) => {
            if (parseInt(key) <= numberOfDaysInMonth) {
                object.followings.labels.push(key);
                object.followings.data.push(this.numberOfFollowingsPerDay[key]);
            }
        });
        return object;
    }
}