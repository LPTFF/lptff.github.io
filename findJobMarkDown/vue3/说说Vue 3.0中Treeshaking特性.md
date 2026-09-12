Vue 3.0引入了Tree-shaking特性，旨在减小构建后的文件体积。Tree-shaking是一个优化技术，它可以从代码中删除未使用的模块，以减少最终生成的代码量。

在Vue 3.0中，你可以通过模块导入的方式来实现Tree-shaking。以下是一个代码示例，演示了如何在Vue 3.0中使用Tree-shaking：

假设我们有一个`utils.js`文件，其中包含一些工具函数：

```javascript
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}
```

现在，我们只想在应用中使用`add`函数，而`subtract`函数并不需要。

在Vue 3.0中，通过以下方式导入和使用工具函数：

```vue
<template>
  <div>
    <p>Result: {{ result }}</p>
  </div>
</template>

<script>
import { add } from './utils';

export default {
  data() {
    return {
      result: 0,
    };
  },
  mounted() {
    this.result = add(10, 5);
  },
};
</script>
```

在这个示例中，我们只导入了`add`函数，并在组件中使用它。由于我们没有使用`subtract`函数，Tree-shaking特性将在构建时自动移除未使用的代码，从而减小最终生成的代码体积。

请注意，Tree-shaking的效果可能会受到其他因素的影响，例如Webpack或Rollup等构建工具的配置。要确保Tree-shaking正常工作，你需要正确配置你的构建工具，以便它可以识别和消除未使用的代码。