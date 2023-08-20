JavaScript 中的宏任务（Macrotasks）包括多种类型的异步操作，以下是一些常见的宏任务类型以及相应的代码示例：

1. **定时器（Timers）：** 使用`setTimeout`和`setInterval`注册的回调函数，以指定的时间间隔执行。

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout 1");
}, 1000);

setTimeout(() => {
  console.log("Timeout 2");
}, 500);

console.log("End");
```

2. **网络请求（Network Requests）：** 使用`XMLHttpRequest`或`fetch`进行的网络请求。

```javascript
console.log("Start");

fetch("https://api.example.com/data")
  .then((response) => response.json())
  .then((data) => {
    console.log("Received data:", data);
  });

console.log("End");
```

3. **事件处理程序（Event Handlers）：** 用户交互引发的事件，如鼠标点击、键盘输入等。

```javascript
document.addEventListener("click", () => {
  console.log("Click event handler");
});

console.log("Click somewhere in the document");
```

4. **`postMessage`和`MessageChannel`：** 在不同上下文之间通信的机制。

```javascript
const channel = new MessageChannel();

channel.port1.onmessage = (event) => {
  console.log("Message received:", event.data);
};

channel.port2.postMessage("Hello from the other side!");
```

5. **`requestAnimationFrame`：** 用于在浏览器渲染之前执行的回调，通常用于动画等操作。

```javascript
function animate(timestamp) {
  console.log("Animation frame");
  // 执行动画逻辑
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

6. **I/O 操作（Input/Output Operations）：** 涉及文件读写、数据库查询等操作。

在 Node.js 环境中，可以使用`fs`模块来执行文件读写等 I/O 操作，这些操作会被添加到宏任务队列中。由于 I/O 操作的示例相对复杂，这里不提供具体的代码示例。

总之，宏任务包括了多种类型的异步操作，它们会被添加到事件循环的宏任务队列中，按照它们的注册顺序依次执行。需要注意的是，在不同的宿主环境（如浏览器和 Node.js）中，宏任务的种类可能会有所不同。
