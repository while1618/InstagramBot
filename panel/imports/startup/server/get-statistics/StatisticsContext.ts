import {IStatistics} from "./IStatistics";
import {DayStatisticData} from './DayStatisticData';
import {WeekStatisticData} from './WeekStatisticData';
import {MonthStatisticData} from './MonthStatisticData';
import {YearStatisticData} from './YearStatisticData';

export class StatisticsContext implements IStatistics {
    private readonly strategyObject : object;
    private static instance : object;

    private constructor(profileId : string, startDate : Date, endDate : Date, timeZone : string) {
        this.strategyObject = {};
        (<any>Object).assign(this.strategyObject, {day: new DayStatisticData(profileId, startDate, endDate, timeZone)});
        (<any>Object).assign(this.strategyObject, {week: new WeekStatisticData(profileId, startDate, endDate, timeZone)});
        (<any>Object).assign(this.strategyObject, {month: new MonthStatisticData(profileId, startDate, endDate, timeZone)});
        (<any>Object).assign(this.strategyObject, {year: new YearStatisticData(profileId, startDate, endDate, timeZone)});
    }

    public static getInstance(profileId : string, startDate : Date, endDate : Date, timeZone : string) : object {
        if(!StatisticsContext.instance)
            StatisticsContext.instance = new StatisticsContext(profileId, startDate, endDate, timeZone);

        return StatisticsContext.instance;
    }

    public pickStatistics(statisticType : string) : object {
        return this.strategyObject[statisticType];
    }

    public static destroyInstance() {
        StatisticsContext.instance = null;
    }
}