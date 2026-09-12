JavaScript 事件循环（Event Loop）是一种机制，用于处理异步操作和事件处理程序。它确保 JavaScript 在单线程环境中能够处理多个任务，而不会阻塞主线程。以下是 JavaScript 事件循环执行顺序的简要描述：

1. **执行同步代码：** 从调用栈（Call Stack）中执行当前位于栈顶的同步代码，直到栈为空。同步代码是按顺序执行的，不会被中断。

2. **处理微任务（Microtasks）：** 在同步代码执行完毕后，事件循环会检查微任务队列。微任务包括 Promise 的回调函数、MutationObserver 的回调等。微任务会优先于下一次渲染执行。

3. **处理宏任务（Macrotasks）：** 如果微任务队列为空，事件循环会从宏任务队列中选取一个任务来执行。宏任务包括定时器（setTimeout、setInterval）、事件（鼠标点击、网络请求等）等。

4. **执行渲染（Render）：** 如果需要进行渲染（比如在浏览器环境中），则会执行渲染操作，更新页面的显示。

5. **重复循环：** 事件循环会不断重复上述步骤，不断从微任务和宏任务队列中选取任务执行，直到两个队列都为空。

需要注意的是，微任务优先级高于宏任务，因此微任务会在宏任务之前执行。这是为了确保在渲染前能够处理完所有微任务，以保证页面显示的一致性。

以下是一个示意的代码执行顺序，假设有一段包含异步操作的代码：

```javascript
console.log("Sync 1");

setTimeout(() => {
  console.log("Timeout 1");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise Microtask 1");
});

console.log("Sync 2");
```

执行顺序将是：

1. 执行第一个同步`console.log("Sync 1");`
2. 注册定时器和 Promise 微任务
3. 执行第二个同步`console.log("Sync 2");`
4. 执行 Promise 微任务`console.log("Promise Microtask 1");`
5. 执行定时器宏任务`console.log("Timeout 1");`

这只是一个简单的例子，实际中可能会有更复杂的情况。理解事件循环对于编写有效的异步代码至关重要。
