"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function intersect(a, b) {
    const removes = [];
    const commons = [];
    a = a.slice().sort();
    b = b.slice().sort();
    for (let i = 0; i < a.length; i++) {
        const value = a[i];
        const index = b.indexOf(value);
        if (index === -1) {
            removes.push(value);
        }
        else {
            commons.push(value);
            b.splice(index, 1);
        }
    }
    return {
        removes, commons,
        adds: b
    };
}
exports.default = intersect;
