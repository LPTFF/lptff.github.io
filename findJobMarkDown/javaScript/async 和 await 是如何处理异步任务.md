`async`和`await`是 JavaScript 中用于处理异步操作的语法糖，它们让异步代码的编写和阅读更加简洁和直观。`async`关键字用于定义一个函数，表示这个函数内部可能包含异步操作，而`await`关键字用于等待一个 Promise 对象的解决（或拒绝）并返回其结果。

使用`async`和`await`来处理异步任务时，代码看起来像是同步的，但实际上仍然是非阻塞的。下面是一个示例来说明它们的用法：

```javascript
// 模拟一个异步操作返回Promise的函数
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("Data fetched successfully");
    }, 1000);
  });
}

async function processData() {
  console.log("Start processing");

  try {
    const result = await fetchData(); // 等待异步操作完成
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }

  console.log("Processing finished");
}

processData();
console.log("After calling processData");
```

在这个示例中，`fetchData`函数返回一个 Promise，模拟一个异步操作（等待 1 秒后解决 Promise）。在`processData`函数中，使用`await`关键字等待`fetchData`函数的执行结果。尽管使用了`await`，但是代码不会阻塞，而是会让出线程继续执行其他任务。

代码的执行顺序如下：

1. 执行`processData`函数。
2. 输出："Start processing"
3. 调用`fetchData`函数，开始等待异步操作完成。
4. 执行外部`console.log("After calling processData");`
5. 在等待的过程中，异步操作完成，`fetchData`的 Promise 解决，控制权回到`processData`函数。
6. 输出："Data fetched successfully"
7. 输出："Processing finished"

需要注意的是，`async`函数总是返回一个 Promise 对象，即使在函数内部没有显式地返回一个 Promise。如果`async`函数内部抛出了异常，那么返回的 Promise 会被拒绝，并包含该异常。

使用`async`和`await`可以使异步代码更易于阅读和编写，同时仍然能够充分利用 JavaScript 的单线程非阻塞特性。
