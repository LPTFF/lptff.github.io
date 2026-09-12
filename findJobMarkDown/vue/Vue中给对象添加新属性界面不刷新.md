在 Vue 中，如果直接给对象添加新属性，界面不会自动刷新。这是因为 Vue 在实例化时会对数据进行响应式处理，但只会对已经存在的属性进行代理和监听。如果你想要新添加的属性也具有响应式能力，需要使用`Vue.set`或者`this.$set`方法来添加新属性。

以下是一个示例，演示如何在 Vue 中给对象添加新属性，并使界面能够刷新：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Vue Add Property Example</title>
  </head>
  <body>
    <div id="app">
      <p>{{ user.name }}</p>
      <p>{{ user.age }}</p>
      <button @click="addNewProperty">添加新属性</button>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
    <script>
      new Vue({
        el: "#app",
        data: {
          user: {
            name: "John",
          },
        },
        methods: {
          addNewProperty() {
            // 使用 Vue.set 或 this.$set 添加新属性
            this.$set(this.user, "age", 30);
          },
        },
      });
    </script>
  </body>
</html>
```

在这个示例中，开始时`user`对象只有一个`name`属性。当点击"添加新属性"按钮时，`addNewProperty`方法通过`this.$set`方法向`user`对象添加了一个新的`age`属性。由于使用了`this.$set`，Vue 会使新添加的属性具有响应式能力，从而使界面能够刷新并显示新属性的值。

总结起来，如果想要在 Vue 中给对象添加新属性，并使界面能够刷新，应该使用`Vue.set`或者`this.$set`方法，而不是直接赋值添加。这样可以确保新属性也具有响应式能力，从而实现界面的更新。
