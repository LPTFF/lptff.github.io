/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var subarraySum = function (nums, k) {
  //找出所有连续子数组
  //判断对应子数组的元素和是否满足k
  let result = 0;
  for (let m = 0; m <= nums.length; m++) {
    //m即为子数组的长度
    for (let n = 0; n <= nums.length - m; n++) {
      //起始索引为n,结束索引为
      console.log("n", n);
      console.log("m", m);
      let newArr = nums.slice(n, n + m);
      console.log("newArr", newArr);
      let sum = null;
      for (let i = 0; i < newArr.length; i++) {
        sum = sum + newArr[i];
      }
      if (sum == k) {
        result++;
      }
    }
  }
  return result;
};

let nums = [1];
let k = 0;
let permutations = subarraySum(nums, k);
console.log("permutations", permutations);
