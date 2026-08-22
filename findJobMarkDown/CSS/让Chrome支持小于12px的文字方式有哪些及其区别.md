在较新版本的Chrome中，默认情况下是支持小于12px的文字的，不再需要额外的处理。过去，小于12px的文字可能会出现渲染问题，但现代浏览器已经在渲染方面做了很多优化，使得小字号的文字也能够显示得很清晰。

然而，如果您仍然遇到小字号文字显示不清晰的问题，可以考虑以下几种方法：

1. **使用 `transform` 进行缩放**：通过应用 `transform: scale(0.8);` 或类似的缩放来达到显示小字号文字的效果。这不会影响文本的可选文本内容，但可能会影响其他的布局。

```css
.small-text {
  font-size: 10px;
  transform: scale(0.8);
  transform-origin: top left;
}
```

2. **使用 `text-rendering` 属性**：`text-rendering` 属性可以用于优化文字渲染，尤其是在小字号上。

```css
.small-text {
  font-size: 10px;
  text-rendering: optimizeLegibility;
}
```

3. **使用 `@media` 查询**：在小屏幕设备上使用不同的字号，以适应不同的显示效果。

```css
@media (max-width: 768px) {
  .small-text {
    font-size: 10px;
  }
}
```

请注意，尽管现代浏览器已经在小字号文字的渲染方面做了优化，但在某些情况下，特别是在高分辨率显示器上，仍可能出现问题。在这种情况下，可以尝试上述方法来优化字号的显示效果。