import {Statistics} from '../../../api/statistics/statistics';
import {StatisticsContext} from "./StatisticsContext";

export abstract class GetStatisticsData {
    protected profileId : string;
    protected startDate : Date;
    protected endDate : Date;
    protected timeZone : string;
    protected data : object;

    protected constructor(profileId : string, startDate : Date, endDate : Date, timeZone : string) {
        this.profileId = profileId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.timeZone = timeZone;
        this.data = this.getData();
    }

    private getData() : object {
        return Statistics.aggregate([
            {
                $match: {'profile': this.profileId}
            },
            {
                $unwind: '$statistics'
            },
            {
                $match: {
                    'statistics.updatedAt': {
                        $gte: this.startDate,
                        $lt: this.endDate
                    }
                }
            },
            {
                $group: {
                    '_id': null,
                    'statistics': {
                        '$push': {
                            'follows': '$statistics.follows',
                            'unfollows': '$statistics.unfollows',
                            'numberOfFollowers': '$statistics.numberOfFollowers',
                            'following': '$statistics.following',
                            'unfollowing': '$statistics.unfollowing',
                            'numberOfFollowing': '$statistics.numberOfFollowing',
                            'updatedAt': '$statistics.updatedAt'
                        }
                    }
                }
            },
            {
                $project: {
                    '_id': 0,
                    'statistics': 1
                }
            }
        ])[0];
    }

    public getStatistics() : object {
        let object = {};
        if (this.data) {
            (<any>Object).assign(object, this.getFollowsStatistics());
            (<any>Object).assign(object, this.getUnfollowsStatistics());
            (<any>Object).assign(object, this.getFollowersStatistics());
            (<any>Object).assign(object, this.getFollowingStatistics());
            (<any>Object).assign(object, this.getUnfollowingStatistics());
            (<any>Object).assign(object, this.getFollowingsStatistics());
        } else {
            (<any>Object).assign(object, {error: 'No data'});
        }
        StatisticsContext.destroyInstance();

        return object;
    }

    protected abstract getFollowsStatistics() : object;

    protected abstract getUnfollowsStatistics() : object;

    protected abstract getFollowersStatistics() : object;

    protected abstract getFollowingStatistics() : object;

    protected abstract getUnfollowingStatistics() : object;

    protected abstract getFollowingsStatistics() : object;
}