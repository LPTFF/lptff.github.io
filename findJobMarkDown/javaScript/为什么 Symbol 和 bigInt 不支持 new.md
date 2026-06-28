`Symbol` 和 `BigInt` 不支持使用 `new` 关键字来创建新实例，这是因为它们的设计初衷和特性与普通的构造函数不同。

**1. Symbol：**
`Symbol` 是一种原始数据类型，用于创建唯一且不可修改的值。每个通过 `Symbol()` 函数创建的 `Symbol` 值都是独一无二的，它们不应该被视为构造函数的实例。因为 `Symbol` 值是不可变的，并且不需要进行实例化过程，所以不支持使用 `new Symbol()`。正确的用法是直接调用 `Symbol()` 函数。

**2. BigInt：**
`BigInt` 是一种用于表示超出 JavaScript 标准数字范围的大整数的数据类型。`BigInt` 是一个特殊的数据类型，它不是对象，而是类似于基本数据类型的原始类型。同样，`BigInt` 的设计意图是为了满足处理大整数的需求，不同于普通对象实例化的过程。因此，不支持使用 `new BigInt()` 来创建实例，而是直接使用 `BigInt()` 函数来创建 `BigInt` 值。

以下是示例，展示为什么 `Symbol` 和 `BigInt` 不支持使用 `new` 关键字：

**Symbol 示例：**

```javascript
// 正确的创建方式
const symbol1 = Symbol("description");
const symbol2 = Symbol("description");

console.log(symbol1 === symbol2); // false，每个 Symbol 值都是独一无二的
```

**BigInt 示例：**

```javascript
// 正确的创建方式
const bigIntValue = BigInt("1234567890123456789012345678901234567890");
console.log(bigIntValue); // 1234567890123456789012345678901234567890n
```

总之，`Symbol` 和 `BigInt` 的设计使其与其他类型不同，不支持使用 `new` 来创建实例，而应直接使用对应的函数来创建这些值。
