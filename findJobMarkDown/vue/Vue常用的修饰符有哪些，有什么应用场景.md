Vue的修饰符是一种可以在指令后面添加的特殊标记，用于修改指令的行为。以下是Vue中常用的一些指令修饰符、它们的应用场景以及相关的代码示例：

1. **`.prevent` 修饰符：**
   - 用于阻止默认事件的发生。
   - 应用场景：在点击某个元素时，阻止默认的表单提交或链接跳转行为。
   - 示例：

```vue
<template>
  <div>
    <form @submit.prevent="submitForm">
      <input type="text" />
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
export default {
  methods: {
    submitForm() {
      // 表单提交逻辑
    },
  },
};
</script>
```

2. **`.stop` 修饰符：**
   - 阻止事件冒泡，即阻止事件从当前元素向上级元素传播。
   - 应用场景：防止点击某个元素时，父元素的点击事件也被触发。
   - 示例：

```vue
<template>
  <div @click="parentClick">
    <button @click.stop="childClick">Click me</button>
  </div>
</template>

<script>
export default {
  methods: {
    parentClick() {
      console.log('Parent clicked');
    },
    childClick() {
      console.log('Child clicked');
    },
  },
};
</script>
```

3. **`.capture` 修饰符：**
   - 使用事件捕获模式，即从外向内触发事件。
   - 应用场景：当你需要在父组件处理事件之前先处理子组件的事件。
   - 示例：

```vue
<template>
  <div @click.capture="captureClick">
    <button @click="regularClick">Click me</button>
  </div>
</template>

<script>
export default {
  methods: {
    captureClick() {
      console.log('Capture click');
    },
    regularClick() {
      console.log('Regular click');
    },
  },
};
</script>
```

4. **`.once` 修饰符：**
   - 使指令只绑定一次，只触发一次。
   - 应用场景：确保只在特定情况下执行一次处理逻辑，例如只显示一次弹窗。
   - 示例：

```vue
<template>
  <div>
    <button @click.once="showPopup">Show Popup</button>
  </div>
</template>

<script>
export default {
  methods: {
    showPopup() {
      // 显示弹窗逻辑
    },
  },
};
</script>
```

这些是一些常见的Vue指令修饰符，它们可以让你更加灵活地控制指令的行为。根据不同的应用场景，你可以选择合适的修饰符来实现所需的功能。