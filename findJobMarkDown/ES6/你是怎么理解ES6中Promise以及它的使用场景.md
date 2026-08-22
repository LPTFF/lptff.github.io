在 ES6 中，`Promise` 是一种用于处理异步操作的机制，它可以更优雅地管理回调地狱（Callback Hell）问题，使异步代码变得更可读和可维护。`Promise` 主要用于处理那些需要等待一些异步操作完成后才能继续执行的情况，如网络请求、文件读取等。

`Promise` 的主要特点是：

1. **状态**：`Promise` 有三种状态：`pending`（进行中）、`fulfilled`（已成功）、`rejected`（已失败）。
2. **值传递**：`Promise` 在状态改变后可以传递一个值，表示操作的结果。
3. **链式调用**：`then()` 方法可以用于链式调用，使异步操作更清晰。

下面是一个简单的 `Promise` 使用示例，模拟一个异步操作（定时器）：

```javascript
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`Operation completed after ${ms} ms`);
    }, ms);
  });
}

delay(2000)
  .then(result => {
    console.log(result); // 输出: Operation completed after 2000 ms
    return delay(1000);
  })
  .then(result => {
    console.log(result); // 输出: Operation completed after 1000 ms
    return delay(1500);
  })
  .then(result => {
    console.log(result); // 输出: Operation completed after 1500 ms
  })
  .catch(error => {
    console.error(error);
  });
```

在这个示例中，`delay` 函数返回一个 `Promise`，在定时器结束后，`resolve` 方法被调用，将结果传递给 `then` 方法。通过链式调用，我们可以在每个步骤中等待异步操作完成后继续执行。

`Promise` 在处理异步代码时非常有用，特别是在需要多个异步操作顺序执行或者在某些操作完成后执行后续操作时。这使得代码更具可读性和可维护性，避免了嵌套的回调函数。