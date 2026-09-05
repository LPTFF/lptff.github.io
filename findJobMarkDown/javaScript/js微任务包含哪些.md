JavaScript中的微任务（Microtask）是一种异步任务，会在当前任务执行完成后立即执行，不会等待其他任务，比如宏任务。微任务通常用于处理异步操作，例如Promise的回调、MutationObserver等。

以下是一些常见的微任务：

1. **Promise**：Promise的回调函数会被放入微任务队列，当Promise状态改变时（resolved、rejected），对应的微任务会被执行。

```javascript
console.log('Start');

Promise.resolve().then(() => {
  console.log('Promise Microtask 1');
});

Promise.resolve().then(() => {
  console.log('Promise Microtask 2');
});

console.log('End');
```

2. **MutationObserver**：当DOM发生变化时，MutationObserver会将其回调函数放入微任务队列。

```javascript
console.log('Start');

const observer = new MutationObserver(() => {
  console.log('MutationObserver Microtask');
});

observer.observe(document.body, { childList: true });

console.log('End');

document.body.appendChild(document.createElement('div')); // 触发MutationObserver
```

3. **queueMicrotask**：该方法用于将一个微任务函数放入队列中，它会在当前任务结束后执行。

```javascript
console.log('Start');

queueMicrotask(() => {
  console.log('queueMicrotask Microtask');
});

console.log('End');
```

在上述示例中，所有的微任务都会在当前任务执行完毕之前被执行。微任务队列会在每个宏任务执行完毕后清空，然后再执行下一个宏任务。

需要注意的是，微任务的处理方式可能在不同的运行环境（如浏览器和Node.js）中有些许差异，但基本的概念是一致的：微任务会在当前任务的末尾执行。