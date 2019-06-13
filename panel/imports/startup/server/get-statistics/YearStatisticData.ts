import {GetStatisticsData} from "./GetStatisticsData";
import * as momentTimezone from "moment-timezone";

export class YearStatisticData extends GetStatisticsData {
    private readonly numberOfFollowsPerMonth;
    private readonly numberOfUnfollowsPerMonth;
    private readonly numberOfFollowersPerMonth;
    private readonly numberOfFollowingPerMonth;
    private readonly numberOfUnfollowingPerMonth;
    private readonly numberOfFollowingsPerMonth;

    public constructor(profileId, startDate, endDate, timeZone) {
        super(profileId, startDate, endDate, timeZone);
        this.numberOfFollowsPerMonth = YearStatisticData.setKeys();
        this.numberOfUnfollowsPerMonth = YearStatisticData.setKeys();
        this.numberOfFollowersPerMonth = YearStatisticData.setKeys();
        this.numberOfFollowingPerMonth = YearStatisticData.setKeys();
        this.numberOfUnfollowingPerMonth = YearStatisticData.setKeys();
        this.numberOfFollowingsPerMonth = YearStatisticData.setKeys();
    }

    private static setKeys() {
        return {
            'January': null, 'February': null, 'March': null, 'April': null, 'May': null, 'June': null, 'July': null,
            'August': null, 'September': null, 'October': null, 'November': null, 'December': null
        };
    }

    public calculate() {
        if (this.data) {
            for (let i = 0; i < this.data['statistics'].length; i++) {
                let month = momentTimezone(this.data['statistics'][i]['updatedAt']).tz(this.timeZone).format('MMMM');
                this.numberOfFollowsPerMonth[month] += this.data['statistics'][i]['follows'];
                this.numberOfUnfollowsPerMonth[month] += this.data['statistics'][i]['unfollows'];
                this.numberOfFollowersPerMonth[month] = this.data['statistics'][i]['numberOfFollowers'];
                this.numberOfFollowingPerMonth[month] += this.data['statistics'][i]['following'];
                this.numberOfUnfollowingPerMonth[month] += this.data['statistics'][i]['unfollowing'];
                this.numberOfFollowingsPerMonth[month] = this.data['statistics'][i]['numberOfFollowing'];
            }
        }
    }

    protected getFollowersStatistics(): object {
        let object = {follows: {labels: [], data: []}};
        Object.keys(this.numberOfFollowsPerMonth).forEach((key) => {
            object.follows.labels.push(key);
            object.follows.data.push(this.numberOfFollowsPerMonth[key]);
        });
        return object;
    }

    protected getFollowingStatistics(): object {
        let object = {unfollows: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowsPerMonth).forEach((key) => {
            object.unfollows.labels.push(key);
            object.unfollows.data.push(this.numberOfUnfollowsPerMonth[key]);
        });
        return object;
    }

    protected getFollowingsStatistics(): object {
        let object = {followers: {labels: [], data: []}};
        Object.keys(this.numberOfFollowersPerMonth).forEach((key) => {
            object.followers.labels.push(key);
            object.followers.data.push(this.numberOfFollowersPerMonth[key]);
        });
        return object;
    }

    protected getFollowsStatistics(): object {
        let object = {following: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingPerMonth).forEach((key) => {
            object.following.labels.push(key);
            object.following.data.push(this.numberOfFollowingPerMonth[key]);
        });
        return object;
    }

    protected getUnfollowingStatistics(): object {
        let object = {unfollowing: {labels: [], data: []}};
        Object.keys(this.numberOfUnfollowingPerMonth).forEach((key) => {
            object.unfollowing.labels.push(key);
            object.unfollowing.data.push(this.numberOfUnfollowingPerMonth[key]);
        });
        return object;
    }

    protected getUnfollowsStatistics(): object {
        let object = {followings: {labels: [], data: []}};
        Object.keys(this.numberOfFollowingsPerMonth).forEach((key) => {
            object.followings.labels.push(key);
            object.followings.data.push(this.numberOfFollowingsPerMonth[key]);
        });
        return object;
    }
}