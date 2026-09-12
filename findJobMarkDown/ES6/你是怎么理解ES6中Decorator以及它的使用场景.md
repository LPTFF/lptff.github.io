在 ES6 中，装饰器（Decorator）是一种特殊的语法，用于修改类、方法、属性等的行为，以达到增强功能、注入逻辑、修改元数据等目的。装饰器可以让你在不修改原始代码的情况下，对现有的代码进行扩展和定制。

`Decorator` 的主要特点是：

1. **语法**：装饰器使用 `@` 符号紧跟在目标之前，可以是类、方法、属性等。
2. **适用范围**：装饰器可以用于类、类的方法、类的属性等多种情况。
3. **链式应用**：可以使用多个装饰器，它们按照从上到下的顺序应用于目标。

注意：装饰器目前还是一个实验性功能，可能未被所有环境完全支持，使用时请注意环境的兼容性。

以下是一个简单的装饰器使用示例：

```javascript
// 装饰器函数
function log(target, key, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    console.log(`Calling ${key} with arguments: ${args}`);
    const result = originalMethod.apply(this, args);
    console.log(`Method ${key} returned: ${result}`);
    return result;
  };
  return descriptor;
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(3, 5);
// 输出:
// Calling add with arguments: 3,5
// Method add returned: 8
```

在这个示例中，`@log` 是一个装饰器函数，它会修改 `Calculator` 类的 `add` 方法，添加了日志输出的功能。当 `add` 方法被调用时，装饰器会在前后分别输出调用信息和返回结果。

装饰器在实现 AOP（面向切面编程）、元编程和代码增强等方面非常有用。它们可以帮助你在不侵入原始代码的情况下，灵活地增强和定制功能。