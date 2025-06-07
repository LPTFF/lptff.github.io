Vue 3.0的Composition API与Vue 2.x使用的Options API有很大的不同。Composition API更加灵活，更适合组织逻辑功能，而Options API更关注组件选项的方式。以下是两者的主要不同之处，并附带一个简单的代码示例：

**Options API（Vue 2.x）：**

Options API在Vue 2.x中是使用`data`、`methods`、`computed`、`watch`等选项来组织组件的逻辑和状态。这种方式对于小型组件是有效的，但在大型组件中可能导致逻辑分散和难以维护。

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="increment">Increment</button>
    <p>Count: {{ count }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue 2!',
      count: 0,
    };
  },
  methods: {
    increment() {
      this.count++;
    },
  },
};
</script>
```

**Composition API（Vue 3.0）：**

Composition API允许开发者将逻辑功能组织成更小的函数，使得逻辑更加清晰，易于重用和测试。通过`setup`函数来设置逻辑，并使用`ref`、`reactive`等函数来创建响应式数据。

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="increment">Increment</button>
    <p>Count: {{ count }}</p>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const message = ref('Hello Vue 3!');
    const count = ref(0);

    const increment = () => {
      count.value++;
    };

    return {
      message,
      count,
      increment,
    };
  },
};
</script>
```

在这个示例中，使用了Composition API的`setup`函数来组织组件逻辑。`ref`函数用于创建响应式数据，而`increment`函数也是在`setup`中定义的。这种方式使得逻辑更加模块化和可维护。

总的来说，Composition API在大型应用中可以提供更好的代码组织、重用性和可维护性。但在小型应用或简单组件中，Options API仍然是有效的选择。