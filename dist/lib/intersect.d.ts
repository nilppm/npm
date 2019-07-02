declare type ArrayType = (string | number)[];
export declare type intersectResult = {
    removes: ArrayType;
    commons: ArrayType;
    adds: ArrayType;
};
export default function intersect(a: ArrayType, b: ArrayType): intersectResult;
export {};
