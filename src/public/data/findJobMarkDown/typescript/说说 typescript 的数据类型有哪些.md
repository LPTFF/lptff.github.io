TypeScript 支持多种数据类型，包括基本数据类型、对象类型、函数类型等。以下是 TypeScript 中常见的数据类型及其示例代码：

1. **基本数据类型：**
   - **number：** 表示数字，可以是整数或浮点数。
   - **string：** 表示字符串。
   - **boolean：** 表示布尔值，只有 `true` 和 `false` 两个值。
   - **null 和 undefined：** 表示值为 null 或 undefined。
   - **void：** 表示没有返回值的函数。

```typescript
let num: number = 42;
let message: string = "Hello, TypeScript!";
let isTrue: boolean = true;
let emptyValue: null = null;
let noValue: undefined = undefined;

function sayHello(): void {
    console.log("Hello!");
}
```

2. **对象类型：**
   - **object：** 表示非原始数据类型，即除 number、string、boolean、null 和 undefined 之外的类型。

```typescript
let person: object = { name: "Alice", age: 25 };
```

3. **数组类型：**
   - **Array：** 表示数组，可以指定数组元素的类型。

```typescript
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];
```

4. **元组类型：**
   - **Tuple：** 表示固定长度的数组，每个元素可以有不同的类型。

```typescript
let coordinate: [number, number] = [10, 20];
```

5. **枚举类型：**
   - **Enum：** 表示一组具有名称的常数值。

```typescript
enum Color {
    Red,
    Green,
    Blue
}

let selectedColor: Color = Color.Green;
```

6. **任意类型：**
   - **any：** 表示任意类型，关闭类型检查。

```typescript
let dynamicValue: any = "This could be anything.";
dynamicValue = 42;
```

7. **联合类型：**
   - **Union Types：** 表示变量可以是多种类型之一。

```typescript
let value: string | number = "Hello";
value = 42;
```

8. **交叉类型：**
   - **Intersection Types：** 表示多个类型的结合。

```typescript
interface A {
    propA: number;
}

interface B {
    propB: string;
}

let combined: A & B = { propA: 10, propB: "abc" };
```

这些是 TypeScript 中常见的数据类型，通过使用它们，可以更精确地定义变量和函数的类型，从而提高代码的可读性和维护性。