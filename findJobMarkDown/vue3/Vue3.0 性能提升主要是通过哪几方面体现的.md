Vue 3.0的性能提升主要体现在以下几个方面：

1. **虚拟DOM 的优化：** Vue 3.0使用了更高效的虚拟DOM算法，减少了不必要的渲染操作，从而提高了渲染性能。

2. **基于Proxy的响应式系统：** Vue 3.0的响应式系统采用了Proxy代理对象，能够更精确地捕获属性的变化，从而减少了重渲染的次数。

3. **编译优化：** Vue 3.0的模板编译器进行了优化，生成更高效的渲染函数，提高了组件的渲染性能。

4. **Tree-shaking 支持：** Vue 3.0采用了Tree-shakable的架构，可以按需加载和删除不必要的模块，减小了构建后的文件体积。

以下是一个简单的示例，展示了Vue 3.0性能优化方面的代码示例：

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

在这个示例中，我们使用了Vue 3.0的Composition API，其中`ref`函数用于创建响应式数据。通过这种方式，Vue 3.0能够更高效地追踪数据的变化，从而在需要更新视图时进行更精确的操作，减少不必要的渲染。

尽管以上示例可能不会明显地展示出性能提升，但Vue 3.0在大型复杂应用中的性能优化效果更为显著。使用Composition API、基于Proxy的响应式系统以及编译优化，Vue 3.0能够提供更快的渲染速度和更好的用户体验。