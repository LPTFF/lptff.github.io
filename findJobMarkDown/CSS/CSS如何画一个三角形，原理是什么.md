通过CSS可以使用一个元素的边框和尺寸属性来绘制一个简单的三角形。实际上，三角形的绘制是通过控制边框的大小和颜色，从而只显示一个或多个边框，使其形成一个三角形的效果。

以下是一个使用CSS绘制三角形的示例：

```html
<!DOCTYPE html>
<html>
<head>
<style>
  .triangle {
    width: 0;
    height: 0;
    border-left: 50px solid transparent;
    border-right: 50px solid transparent;
    border-bottom: 100px solid red;
  }
</style>
</head>
<body>

<div class="triangle"></div>

</body>
</html>
```

在上述示例中，`.triangle` 元素的宽度和高度都设置为0，然后使用`border`属性创建三角形的三条边。`border-left` 和 `border-right` 两条边都设置为透明，以形成三角形的底边，`border-bottom` 设置为红色，以形成三角形的斜边。

这种方法是通过控制边框的绘制来实现三角形效果的，原理是利用了CSS的边框属性，非常简单且适用于一些基本的形状需求。当然，对于更复杂的形状，可能需要使用其他技术或工具来实现。