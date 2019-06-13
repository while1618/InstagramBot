import {GetStatisticsData} from "./GetStatisticsData";
import * as momentTimezone from 'moment-timezone'

export class WeekStatisticData extends GetStatisticsData {
    private readonly numberOfFollowsPerDay : object;
    private readonly numberOfUnfollowsPerDay : object;
    private readonly numberOfFollowersPerDay : object;
    private readonly numberOfFollowingPerDay : object;
    private readonly numberOfUnfollowingPerDay : object;
    private readonly numberOfFollowingsPerDay : object;

    public constructor(profileId, startDate, endDate, timeZone) {
        super(profileId, startDate, endDate, timeZone);
        this.numberOfFollowsPerDay = WeekStatisticData.setKeys();
        this.numberOfUnfollowsPerDay = WeekStatisticData.setKeys();
        this.numberOfFollowersPerDay = WeekStatisticData.setKeys();
        this.numberOfFollowingPerDay = WeekStatisticData.setKeys();
        this.numberOfUnfollowingPerDay = WeekStatisticData.setKeys();
        this.numberOfFollowingsPerDay = WeekStatisticData.setKeys();
    }

    private static setKeys() {
        return {
            'Monday': null, 'Tuesday': null, 'Wednesday': null, 'Thursday': null, 'Friday': null, 'Saturday': null,
            'Sunday': null
        };
    }

    public calculate() {
        if (this.data) {
            for (let i = 0; i < this.data['statistics'].length; i++) {
                let day = momentTimezone(this.data['statistics'][i]['updatedAt']).tz(this.timeZone).format('dddd');
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
        Object.keys(this.numberOfFollowsPerDay).forEach((key) => {
            object.follows.labels.push(key);
            object.follows.data.push(this.numberOfFollowsPerDay[key]);
        });
        return object;
    }

    protected getFollowingStatistics(): object {
        let object = {unfollows: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowsPerDay).forEach((key) => {
            object.unfollows.labels.push(key);
            object.unfollows.data.push(this.numberOfUnfollowsPerDay[key]);
        });
        return object;
    }

    protected getFollowingsStatistics(): object {
        let object = {followers: {labels: [], data: []}};
        Object.keys(this.numberOfFollowersPerDay).forEach((key) => {
            object.followers.labels.push(key);
            object.followers.data.push(this.numberOfFollowersPerDay[key]);
        });
        return object;
    }

    protected getFollowsStatistics(): object {
        let object = {following: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingPerDay).forEach((key) => {
            object.following.labels.push(key);
            object.following.data.push(this.numberOfFollowingPerDay[key]);
        });
        return object;
    }

    protected getUnfollowingStatistics(): object {
        let object = {unfollowing: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowingPerDay).forEach((key) => {
            object.unfollowing.labels.push(key);
            object.unfollowing.data.push(this.numberOfUnfollowingPerDay[key]);
        });
        return object;
    }

    protected getUnfollowsStatistics(): object {
        let object = {followings: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingsPerDay).forEach((key) => {
            object.followings.labels.push(key);
            object.followings.data.push(this.numberOfFollowingsPerDay[key]);
        });
        return object;
    }
}