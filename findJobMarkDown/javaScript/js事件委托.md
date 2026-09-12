JavaScript 事件委托（Event Delegation）是一种利用事件冒泡原理，将事件处理程序绑定在一个父元素上，而不是直接绑定在多个子元素上。通过这种方式，你可以在父元素上统一处理多个子元素的相同类型事件，从而减少事件处理程序的数量，提高性能，并简化代码。

事件委托的基本思想是，你在父元素上监听事件，当事件冒泡到父元素时，通过检查事件的目标（`event.target`）来确定触发事件的具体子元素，然后根据子元素的特征执行相应的操作。

以下是一个使用事件委托的示例，假设你有一个列表，里面有多个子项，你希望点击列表中的任何子项时都会弹出子项的文本内容：

```html
<ul id="itemList">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
  <!-- 更多子项... -->
</ul>
```

```javascript
const itemList = document.getElementById("itemList");

itemList.addEventListener("click", function (event) {
  if (event.target.tagName === "LI") {
    // 检查目标元素是否为 LI 元素
    const itemText = event.target.textContent;
    alert(`Clicked on: ${itemText}`);
  }
});
```

在这个示例中，事件处理程序被绑定在了父元素 `itemList` 上，但是只有当点击的子元素是 `<li>` 元素时，才会执行相应的操作。通过事件委托，你不需要为每个子元素都绑定事件处理程序，而是统一在父元素上处理。

事件委托的好处包括减少内存消耗、提高性能，尤其在处理大量子元素时更加明显。同时，它还能够自动适应新添加的子元素，因为它们会自动继承父元素上的事件处理逻辑。
