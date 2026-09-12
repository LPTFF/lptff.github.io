JavaScript 事件流描述了在 DOM 中事件是如何传播和处理的。DOM 中的每个元素都可以触发事件，事件流分为三个阶段：捕获阶段、目标阶段和冒泡阶段。在这些阶段中，事件会从文档根节点（或 window 对象）一直传播到触发事件的元素，然后再从触发元素冒泡回文档根节点（或 window 对象）。这个过程称为事件流。

事件流的三个阶段如下：

1. **捕获阶段（Capture Phase）：** 事件从文档根节点（或 window 对象）向下传播到触发事件的元素。在捕获阶段，事件会经过祖先元素，但不会触发实际的事件处理程序。

2. **目标阶段（Target Phase）：** 事件到达触发事件的元素。在目标阶段，如果绑定了事件处理程序，会触发元素上的事件处理程序。

3. **冒泡阶段（Bubbling Phase）：** 事件从触发元素开始冒泡回文档根节点（或 window 对象）。在冒泡阶段，事件会逐级经过祖先元素，触发它们上面绑定的事件处理程序。

基本来说，事件先捕获再冒泡。但是值得注意的是，不是所有的事件都会经历捕获和冒泡阶段，具体取决于事件类型以及是否绑定了事件处理程序。

你可以使用 `addEventListener` 方法来绑定事件处理程序，并选择是否在捕获阶段处理事件。默认情况下，事件处理程序在冒泡阶段执行。

```javascript
const element = document.getElementById("myElement");

element.addEventListener("click", function () {
  console.log("Target Phase: Clicked on the element");
});

element.addEventListener(
  "click",
  function () {
    console.log("Bubbling Phase: Clicked on the element");
  },
  false
); // 第三个参数为 false，表示在冒泡阶段处理事件
```

在这个示例中，当你点击 `myElement` 元素时，会先触发目标阶段的事件处理程序，然后触发冒泡阶段的事件处理程序。
