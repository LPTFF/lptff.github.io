在 ES6 中，`Generator` 是一种特殊类型的函数，它可以被暂停和恢复执行。`Generator` 允许在函数执行期间多次进出，以产生一系列值。这在处理异步操作、惰性求值以及控制流方面非常有用。

`Generator` 的主要特点是：

1. **暂停与恢复**：`Generator` 函数可以在执行过程中通过 `yield` 关键字暂停执行，然后通过调用 `.next()` 方法恢复执行。
2. **产生值**：`Generator` 可以产生一系列值，每次调用 `.next()` 方法时，函数会执行到下一个 `yield` 关键字处，并返回一个包含 `value` 和 `done` 属性的对象。
3. **惰性求值**：`Generator` 适合用于延迟计算，仅在需要时才产生值。

下面是一个简单的 `Generator` 使用示例，模拟产生斐波那契数列：

```javascript
function* fibonacciGenerator() {
  let a = 0;
  let b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fibonacci = fibonacciGenerator();

for (let i = 0; i < 10; i++) {
  console.log(fibonacci.next().value);
}
// 输出: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

在这个示例中，`fibonacciGenerator` 是一个 `Generator` 函数，通过 `yield` 关键字在每次迭代中产生斐波那契数列的下一个值。通过调用 `.next()` 方法，我们可以逐步获得这些值。

`Generator` 在处理需要惰性求值、逐步获取数据或需要暂停和恢复执行的情况下非常有用。例如，处理大数据集、异步操作、流处理等都可以使用 `Generator` 来实现更高效的代码。