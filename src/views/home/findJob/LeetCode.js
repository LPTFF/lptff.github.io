var maxSubArray = function (nums) {
  let result = null;
  console.log("nums", nums);
  for (let i = 0; i < nums.length; i++) {
    for (let m = 0; m < nums.length - i; m++) {
      //start m end m+i
      let sum = null;
      console.log("start", m);
      console.log("end", m + i);
      for (let n = m; n <= m + i; n++) {
        sum = sum + nums[n];
      }
      console.log("sum", sum);
      console.log("result1", result);
      if (m == 0 && i == 0) {
        result = sum;
      } else {
        result = sum > result ? sum : result;
      }
      console.log("result2", result);
    }
  }
  return result;
};
let nums = [-1, 0, -2];
let test = maxSubArray(nums);
console.log("test", test);
