type ArrayType = (string | number)[];
export type intersectResult = {
  removes: ArrayType,
  commons: ArrayType,
  adds: ArrayType,
}
export default function intersect(a: ArrayType, b: ArrayType): intersectResult {
  const removes: ArrayType = [];
  const commons: ArrayType = [];
  
  a = a.slice().sort();
  b = b.slice().sort();
  
  for (let i = 0; i < a.length; i++) {
    const value = a[i];
    const index = b.indexOf(value);
    if (index === -1) {
      removes.push(value);
    } else {
      commons.push(value);
      b.splice(index, 1);
    }
  }
  return {
    removes, commons,
    adds: b
  }
}