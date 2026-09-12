CSS选择器用于选择要应用样式的HTML元素。不同的选择器可以根据元素的标签、类名、ID等属性来选择元素。CSS选择器有很多种，下面列举一些常见的选择器：

1. **标签选择器**：选择所有指定标签的元素。
   ```css
   p {
     color: blue;
   }
   ```

2. **类选择器**：选择具有指定类名的元素。
   ```css
   .highlight {
     background-color: yellow;
   }
   ```

3. **ID选择器**：选择具有指定ID的元素。
   ```css
   #header {
     font-size: 24px;
   }
   ```

4. **属性选择器**：选择具有指定属性的元素。
   ```css
   [type="submit"] {
     background-color: green;
   }
   ```

5. **伪类选择器**：选择处于特定状态的元素，如:hover、:active等。
   ```css
   a:hover {
     text-decoration: underline;
   }
   ```

6. **伪元素选择器**：选择元素的特定部分，如::before、::after等。
   ```css
   p::before {
     content: "→ ";
   }
   ```

7. **后代选择器**：选择某元素的后代元素。
   ```css
   ul li {
     list-style-type: disc;
   }
   ```

8. **子元素选择器**：选择某元素的直接子元素。
   ```css
   ul > li {
     font-weight: bold;
   }
   ```

9. **相邻兄弟选择器**：选择紧接在另一个元素后的元素。
   ```css
   h2 + p {
     margin-top: 10px;
   }
   ```

CSS中的选择器具有优先级，当同一个元素被多个选择器选中并应用样式时，优先级决定了哪个样式会被应用。一般来说，优先级按照以下规则计算：

1. **内联样式**（在元素的`style`属性中指定）具有最高优先级。
2. **ID选择器**的优先级高于**类选择器**和**标签选择器**。
3. **属性选择器**和**伪类选择器**的优先级相当于类选择器。
4. **元素选择器**的优先级最低。

如果优先级相同，则后面的样式会覆盖前面的样式。

以下是一些可以继承的常见CSS属性，以及示例代码：

1. **字体属性**：`font-family`、`font-size`、`font-weight`等。
   ```css
   body {
     font-family: Arial, sans-serif;
   }
   ```

2. **文本属性**：`color`、`line-height`、`text-align`等。
   ```css
   p {
     color: #333;
   }
   ```

3. **链接属性**：`text-decoration`、`color`等。
   ```css
   a {
     text-decoration: none;
     color: blue;
   }
   ```

4. **列表属性**：`list-style-type`等。
   ```css
   ul {
     list-style-type: disc;
   }
   ```

5. **表格属性**：`border-collapse`、`text-align`等。
   ```css
   table {
     border-collapse: collapse;
   }
   ```

需要注意的是，并非所有属性都可以继承。只有一些通用的样式属性才会被子元素继承。