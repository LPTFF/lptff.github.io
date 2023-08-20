JavaScript 中的宏任务（Macrotasks）和微任务（Microtasks）都是异步任务，它们具有不同的执行优先级。微任务的执行优先级高于宏任务。以下是一些常见的宏任务和微任务类型，以及相应的代码示例：

**宏任务（Macrotasks）：**

1. **定时器（Timers）：** 使用`setTimeout`和`setInterval`注册的回调函数，以指定的时间间隔执行。

2. **网络请求（Network Requests）：** 使用`XMLHttpRequest`或`fetch`进行的网络请求。

3. **事件处理程序（Event Handlers）：** 用户交互引发的事件，如鼠标点击、键盘输入等。

4. **`postMessage`和`MessageChannel`：** 在不同上下文之间通信的机制。

5. **`requestAnimationFrame`：** 用于在浏览器渲染之前执行的回调，通常用于动画等操作。

**微任务（Microtasks）：**

1. **Promise 回调：** Promise 对象的`then`、`catch`、`finally`方法的回调函数。

2. **Mutation Observer：** 用于监听 DOM 变化的异步观察器。

下面是一些示例代码：

**微任务示例：**

```javascript
console.log("Start");

Promise.resolve().then(() => {
  console.log("Microtask 1");
});

Promise.resolve().then(() => {
  console.log("Microtask 2");
});

console.log("End");
```

**定时器和微任务混合示例：**

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout 1 (Macrotask)");
  Promise.resolve().then(() => {
    console.log("Microtask inside Timeout 1");
  });
}, 0);

setTimeout(() => {
  console.log("Timeout 2 (Macrotask)");
}, 0);

Promise.resolve().then(() => {
  console.log("Microtask 1");
});

console.log("End");
```

在这个示例中，微任务会优先于宏任务执行，即使在定时器的回调函数中也是如此。

需要注意的是，微任务的优先级高于宏任务，因此在事件循环中，会首先处理微任务队列中的所有任务，然后再执行宏任务队列中的任务。这种顺序确保了在进行下一次渲染之前，能够处理完所有微任务，保持页面的一致性。
