在 TypeScript 中，高级类型（Advanced Types）是一组用于处理复杂类型情况的工具类型。这些工具类型允许你操作和转换类型，从而更灵活地处理复杂的数据结构和类型。TypeScript 中的高级类型包括联合类型、交叉类型、映射类型、条件类型等。

以下是对 TypeScript 中几种常见高级类型的理解以及示例代码：

1. **联合类型（Union Types）：** 联合类型允许一个变量可以具有多种类型之一。使用 `|` 符号表示。

```typescript
let value: string | number;
value = "hello";
value = 42;
```

2. **交叉类型（Intersection Types）：** 交叉类型表示一个变量同时具有多个类型的属性和方法。使用 `&` 符号表示。

```typescript
interface A {
    propA: number;
}

interface B {
    propB: string;
}

let combined: A & B = { propA: 10, propB: "abc" };
```

3. **映射类型（Mapped Types）：** 映射类型可以从一个类型生成另一个类型，通常用于批量更新类型的属性。

```typescript
type Status = "success" | "error";
type Response<T> = {
    status: Status;
    data: T;
};

type NumberResponse = Response<number>;
type StringResponse = Response<string>;
```

4. **条件类型（Conditional Types）：** 条件类型根据某个条件来决定返回的类型。通常与 `keyof` 和 `extends` 结合使用。

```typescript
type TypeName<T> = T extends string ? "string" :
                  T extends number ? "number" :
                  T extends boolean ? "boolean" :
                  "unknown";

let strTypeName: TypeName<string> = "string"; // "string"
let numTypeName: TypeName<number> = "number"; // "number"
let boolTypeName: TypeName<boolean> = "boolean"; // "boolean"
let objTypeName: TypeName<object> = "unknown"; // "unknown"
```

5. **索引类型查询与索引访问操作符：** 使用 `keyof` 获取类型的属性名称集合，并使用索引访问操作符 `obj[key]` 来访问属性。

```typescript
interface Person {
    name: string;
    age: number;
}

type PersonKeys = keyof Person; // "name" | "age"
let person: Person = { name: "Alice", age: 25 };
let name: string = person["name"];
```

这些是 TypeScript 中的一些常见高级类型示例。高级类型可以让你更好地处理复杂类型场景，提高代码的灵活性和可维护性。