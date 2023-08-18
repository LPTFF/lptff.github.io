/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function (intervals) {
  let result = [];
  let newArr = [];
  //先给数组排序
  newArr = intervals.sort((a, b) => a[0] - b[0]);
  //对于新的数组，取第一个start和最后一个end，置于新的result
  let start = "";
  let end = "";
  for (let i = 0; i < newArr.length; i++) {
    if (i == 0) {
      start = newArr[i][0];
      end = newArr[i][1];
    }
    if (newArr[i][0] > end) {
      result.push([start, end]);
      start = newArr[i][0];
      end = newArr[i][1];
      if (i == newArr.length - 1) {
        result.push(newArr[i]);
      }
    } else {
      start = start < newArr[i][0] ? start : newArr[i][0];
      end = end > newArr[i][1] ? end : newArr[i][1];
      if (i == newArr.length - 1) {
        result.push([start, end]);
      }
    }
  }
  return result;
};

let intervals = [
  [1, 4],
  [4, 5],
];
let permutations = merge(intervals);
console.log("permutations", permutations);
