import { NPMContext } from '../index';
import { Component } from '@nelts/nelts';
export default class StatisticsService extends Component.Service<NPMContext> {
    private configs;
    constructor(ctx: NPMContext);
    SomeDay(day: number, pathname: string, version?: string): Promise<object[]>;
    Week(pathname: string, version?: string): Promise<object[]>;
    Month(pathname: string, version?: string): Promise<object[]>;
}