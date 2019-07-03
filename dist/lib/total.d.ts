import { NPMContext } from '../index';
export default function Total(ctx: NPMContext): Promise<{
    db_name: string;
    data_size: number;
    total: {
        package: number;
        user: number;
        version: number;
    };
}>;
