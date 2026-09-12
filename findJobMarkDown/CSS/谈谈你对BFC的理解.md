BFC，即“块级格式化上下文”（Block Formatting Context），是CSS中一个重要的概念。它是一个独立的渲染区域，具有一些特定的规则和特性，影响了元素的布局、浮动、定位等。

BFC的主要特性包括：

1. **内部的盒子会在垂直方向上一个接一个地排列**，形成一个垂直的流。

2. **在BFC中，每个盒子的左外边距边缘会贴着包含块的左边缘**，即不会出现外边距折叠。

3. **BFC可以包含浮动的元素，不会被浮动元素覆盖**，从而避免浮动元素造成的布局混乱。

4. **BFC在计算高度时会包含浮动元素的高度**，这意味着父元素不会坍塌为0高度。

5. **BFC可以阻止元素间的 margin 折叠**。

如何创建BFC？

1. 浮动元素：一个元素浮动后会创建BFC。

2. 绝对定位元素：一个元素设置了绝对定位后，也会创建BFC。

3. 根元素（html）：根元素自身就是一个BFC。

4. `display: inline-block;` 和 `display: table-cell;`：这些属性可以让元素成为一个BFC。

下面是一个BFC的简单示例：

```html
<!DOCTYPE html>
<html>
<head>
<style>
  .parent {
    overflow: hidden; /* 创建 BFC */
    border: 1px solid black;
    padding: 10px;
  }
  
  .float {
    float: left;
    width: 100px;
    height: 100px;
    background-color: red;
    margin-right: 10px;
  }
</style>
</head>
<body>

<div class="parent">
  <div class="float"></div>
  <p>This is some text.</p>
</div>

</body>
</html>
```

在上述示例中，父元素 `.parent` 创建了一个BFC（通过 `overflow: hidden;`），因此它的高度会包含浮动元素 `.float` 的高度，不会坍塌为0。这避免了浮动元素对布局的影响。