`requestAnimationFrame`（RAF）是一种用于执行动画和优化性能的浏览器 API，它不属于宏任务（Macrotasks）或微任务（Microtasks）。它是一种特殊的异步任务，用于在浏览器下一次重新渲染之前执行指定的回调函数。

由于`requestAnimationFrame`的执行时间与浏览器的渲染周期相关，因此它通常用于创建平滑的动画效果，并在最佳的渲染时机执行相关逻辑。

以下是一个使用`requestAnimationFrame`的示例：

```javascript
function animate(timestamp) {
  // 在这里执行动画逻辑
  // 通过 timestamp 参数可以获取当前的时间戳，可以用来计算动画的进度

  // 请求下一次动画帧
  requestAnimationFrame(animate);
}

// 启动动画
requestAnimationFrame(animate);
```

在这个示例中，`animate`函数会被反复调用，每次调用都会在下一次浏览器渲染之前执行。这可以确保动画在每一帧都得到平滑的更新，而不会导致掉帧或卡顿。

需要注意的是，虽然`requestAnimationFrame`的执行优先级介于宏任务和微任务之间，但它的主要目的是与浏览器的渲染同步，以获得流畅的动画效果。因此，它不同于一般的异步任务处理方式。
