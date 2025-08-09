当我知识截至到2021年9月时，Vue.js的版本是2.x系列。在Vue 2中，并没有名为`Vue.observable`的核心API。然而，在Vue 3中，引入了`Vue.observable`作为一个全局方法，用于创建可观察的对象，用于在应用程序中跟踪状态的变化。

`Vue.observable`接受一个普通的JavaScript对象作为参数，并返回一个能够被Vue响应式系统观察的对象。这意味着，当你修改返回的对象的属性时，Vue将会自动地更新依赖于该属性的视图。

以下是一个示例，演示了如何在Vue 3中使用`Vue.observable`：

```javascript
// 引入Vue库
import { createApp, Vue } from 'vue';

// 使用Vue.observable创建可观察对象
const observableState = Vue.observable({
  count: 0,
});

// 创建Vue应用程序
const app = createApp({
  data() {
    return {
      // 使用可观察对象的属性
      state: observableState,
    };
  },
  methods: {
    increment() {
      // 修改可观察对象的属性
      this.state.count++;
    },
  },
  template: `
    <div>
      <p>Count: {{ state.count }}</p>
      <button @click="increment">Increment</button>
    </div>
  `,
});

// 挂载应用程序到DOM元素
app.mount('#app');
```

在这个示例中，我们通过`Vue.observable`创建了一个名为`observableState`的可观察对象，其中包含一个`count`属性。然后，在Vue应用程序中，我们将这个可观察对象作为数据的一部分，然后通过点击按钮来递增`count`属性的值。由于`count`属性是可观察的，视图将会自动更新以显示新的值。

请注意，由于Vue的发展可能会超出我截至知识的范围，所以如果在2023年有了新的版本或更改，建议查阅最新的Vue文档以获取最准确的信息。