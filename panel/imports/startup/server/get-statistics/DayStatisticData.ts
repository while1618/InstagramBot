import {GetStatisticsData} from "./GetStatisticsData";
import * as momentTimezone from "moment-timezone";

export class DayStatisticData extends GetStatisticsData {
    private readonly numberOfFollowsPerHour : object;
    private readonly numberOfUnfollowsPerHour : object;
    private readonly numberOfFollowersPerHour : object;
    private readonly numberOfFollowingPerHour : object;
    private readonly numberOfUnfollowingPerHour : object;
    private readonly numberOfFollowingsPerHour : object;

    public constructor(profileId, startDate, endDate, timeZone) {
        super(profileId, startDate, endDate, timeZone);
        this.numberOfFollowsPerHour = DayStatisticData.setKeys();
        this.numberOfUnfollowsPerHour = DayStatisticData.setKeys();
        this.numberOfFollowersPerHour = DayStatisticData.setKeys();
        this.numberOfFollowingPerHour = DayStatisticData.setKeys();
        this.numberOfUnfollowingPerHour = DayStatisticData.setKeys();
        this.numberOfFollowingsPerHour = DayStatisticData.setKeys();
    }

    private static setKeys() {
        return {
            '00:00': null, '01:00': null, '02:00': null, '03:00': null, '04:00': null, '05:00': null, '06:00': null,
            '07:00': null, '08:00': null, '09:00': null, '10:00': null, '11:00': null, '12:00': null, '13:00': null,
            '14:00': null, '15:00': null, '16:00': null, '17:00': null, '18:00': null, '19:00': null, '20:00': null,
            '21:00': null, '22:00': null, '23:00': null
        };
    }

    public calculate() {
        if (this.data) {
            for (let i = 0; i < this.data['statistics'].length; i++) {
                let hour = momentTimezone(this.data['statistics'][i]['updatedAt']).tz(this.timeZone).format('HH:00');
                this.numberOfFollowsPerHour[hour] += this.data['statistics'][i]['follows'];
                this.numberOfUnfollowsPerHour[hour] += this.data['statistics'][i]['unfollows'];
                this.numberOfFollowersPerHour[hour] = this.data['statistics'][i]['numberOfFollowers'];
                this.numberOfFollowingPerHour[hour] += this.data['statistics'][i]['following'];
                this.numberOfUnfollowingPerHour[hour] += this.data['statistics'][i]['unfollowing'];
                this.numberOfFollowingsPerHour[hour] = this.data['statistics'][i]['numberOfFollowing'];
            }
        }
    }

    protected getFollowersStatistics(): object {
        let object = {follows: {labels: [], data: []}};
        Object.keys(this.numberOfFollowsPerHour).forEach((key) => {
            object.follows.labels.push(key);
            object.follows.data.push(this.numberOfFollowsPerHour[key]);
        });
        return object;
    }

    protected getFollowingStatistics(): object {
        let object = {unfollows: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowsPerHour).forEach((key) => {
            object.unfollows.labels.push(key);
            object.unfollows.data.push(this.numberOfUnfollowsPerHour[key]);
        });
        return object;
    }

    protected getFollowingsStatistics(): object {
        let object = {followers: {labels: [], data: []}};
        Object.keys(this.numberOfFollowersPerHour).forEach((key) => {
            object.followers.labels.push(key);
            object.followers.data.push(this.numberOfFollowersPerHour[key]);
        });
        return object;
    }

    protected getFollowsStatistics(): object {
        let object = {following: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingPerHour).forEach((key) => {
            object.following.labels.push(key);
            object.following.data.push(this.numberOfFollowingPerHour[key]);
        });
        return object;
    }

    protected getUnfollowingStatistics(): object {
        let object = {unfollowing: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowingPerHour).forEach((key) => {
            object.unfollowing.labels.push(key);
            object.unfollowing.data.push(this.numberOfUnfollowingPerHour[key]);
        });
        return object;
    }

    protected getUnfollowsStatistics(): object {
        let object = {followings: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingsPerHour).forEach((key) => {
            object.followings.labels.push(key);
            object.followings.data.push(this.numberOfFollowingsPerHour[key]);
        });
        return object;
    }
}