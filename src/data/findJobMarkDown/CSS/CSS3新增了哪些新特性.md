CSS3引入了许多新的特性和属性，使得网页设计更加丰富和灵活。以下是一些CSS3的新特性以及相应的代码示例：

1. **圆角边框（border-radius）**：允许您创建圆角的边框效果。

```css
.box {
  width: 100px;
  height: 100px;
  border: 2px solid #000;
  border-radius: 10px;
}
```

2. **渐变背景（linear-gradient、radial-gradient）**：可以创建平滑的渐变背景。

```css
.gradient-box {
  width: 200px;
  height: 150px;
  background: linear-gradient(to bottom, red, yellow);
}
```

3. **阴影效果（box-shadow、text-shadow）**：添加阴影效果到元素的边框、文字等。

```css
.shadow-box {
  width: 100px;
  height: 100px;
  background-color: gray;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);
}
```

4. **过渡效果（transition）**：允许您在状态变化时平滑地过渡样式。

```css
.transition-box {
  width: 100px;
  height: 100px;
  background-color: blue;
  transition: background-color 0.5s ease;
}

.transition-box:hover {
  background-color: green;
}
```

5. **动画（@keyframes、animation）**：可以创建复杂的动画效果。

```css
@keyframes slide {
  0% { transform: translateX(0); }
  100% { transform: translateX(100px); }
}

.slide-box {
  width: 100px;
  height: 100px;
  background-color: orange;
  animation: slide 2s infinite alternate;
}
```

6. **弹性盒子（Flexbox）**：用于创建灵活的一维布局。

```css
.flex-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.flex-item {
  width: 100px;
  height: 100px;
  background-color: pink;
}
```

这只是CSS3的一小部分特性，它引入了许多更多的能力，以提供更丰富的样式和交互效果。注意，某些CSS3特性可能在不同浏览器中的兼容性存在差异，因此在使用时需要考虑浏览器兼容性。