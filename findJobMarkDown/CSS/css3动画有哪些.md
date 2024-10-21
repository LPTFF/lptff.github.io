CSS3引入了多种动画特性，让开发者能够在不使用JavaScript的情况下，通过CSS来创建丰富的动画效果。以下是一些常见的CSS3动画特性以及相应的代码示例：

1. **过渡动画（Transition）**：通过在状态变化时平滑地过渡样式。

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

2. **关键帧动画（@keyframes、Animation）**：通过关键帧定义多个阶段的样式，从而创建复杂的动画。

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

3. **转换动画（Transform）**：使用`transform`属性对元素进行旋转、缩放、位移等转换，从而创建动画效果。

```css
.transform-box {
  width: 100px;
  height: 100px;
  background-color: red;
  transition: transform 0.5s ease;
}

.transform-box:hover {
  transform: rotate(45deg) scale(1.5);
}
```

4. **透明度动画（Opacity）**：通过`opacity`属性实现元素的淡入淡出效果。

```css
.opacity-box {
  width: 100px;
  height: 100px;
  background-color: purple;
  transition: opacity 0.5s ease;
}

.opacity-box:hover {
  opacity: 0.5;
}
```

5. **阴影动画（Box-shadow）**：通过`box-shadow`属性实现阴影效果的动画。

```css
.shadow-box {
  width: 100px;
  height: 100px;
  background-color: gray;
  transition: box-shadow 0.5s ease;
}

.shadow-box:hover {
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);
}
```

这些示例仅仅是CSS3动画中的一小部分。通过这些特性，您可以创造各种各样的动画效果，从而为网页增添生动感和交互性。