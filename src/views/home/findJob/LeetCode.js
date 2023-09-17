const fetch = require("node-fetch");

function fetchWithRetry(input, max = 3) {
  return new Promise((resolve, reject) => {
    let count = 0;

    async function doFetch() {
      try {
        const response = await fetch(input); // 使用 node-fetch 发起请求
        if (response.ok) {
          const data = await response.json(); // 获取响应数据
          resolve(data);
        } else {
          throw new Error("Request failed");
        }
      } catch (error) {
        if (count < max) {
          console.log(`Retry ${count + 1} time(s)`);
          count++;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待一段时间后重试
          await doFetch(); // 递归重试
        } else {
          reject(error); // 超过最大重试次数后，将错误传递给外部
        }
      }
    }

    doFetch();
  });
}

// 使用示例
fetchWithRetry("https://example.com/api/data")
  .then((data) => {
    console.log("Data:", data);
  })
  .catch((error) => {
    console.error("Failed:", error);
  });
