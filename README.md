# Ts To Readme

- 导出任何的实体创建文档
- 结合 JSDoc + TypeScript 注解
- 包括参数、返回类型、描述，甚至是示例块

## 安装

```sh
mnpm i @yyfe/ts-md
# global
mnpm i -g @yyfe/ts-md
```

## 使用

只需运行 `ts-md`，它会获取 `src` 文件夹中的所有文件并生成文档。

```json
{
  "scripts": {
    "docs": "ts-md"
  }
}
```

并将这段代码插入到你的 `README.md` 中

```md
<!-- INSERT GENERATED DOCS START -->

<!-- INSERT GENERATED DOCS END -->
```

**命令参数**
| 属性 | 类型 | 必填 | 默认值 | 说明 |
| -------- | -------------------| ---- | --------------------------| ----------------------- |
| matcher | RegExp | ❎ | INSERT GENERATED DOCS | 匹配自述文件部分的正则表达式 |
| pattern | string \| string[] | ❎ |['./src/\*\*/*.(ts\|tsx)'] | 用于匹配文件 |
| filePath | string | ❎ | ./README.md | 指定文档产出文件 |
| type | string | ❎ | variable,function,type,class,interface | 需要导出的类型 |

**使用实例**

```ts
// test/index.ts
/**
 * Add two numbers
 *
 * @param one - the first number
 * @param two - the second number
 *
 * @default two = 2
 *
 * @example
 * add(1, 2)
 */
export default interface Interface {
  one: boolean | number;
  two?: number;
}

/**
 * Add two numbers
 *
 * @param name - the first number
 * @param age - the second number
 *
 * @default age = 2
 *
 * @example
 * add(1, 2)
 */
export type Person = {
  name?: string;
  age: number;
  getName: () => string;
};
```

在 `package.json` 中添加

```json
{
  "scripts": {
    "docs": "ts-md test/index.ts --matcher=INSERT GENERATED DOCS --type=type,interface"
  }
}
```

执行以下命令 _(确保当前执行目录存在 README.md)_

```bash
mnpm run docs
```

**得到如下输出**

----------
### test/index.ts

#### Interface (interface)

> Add two numbers

**属性：**

| 属性 | 类型              | 必填 | 默认值 | 说明              |
| ---- | ----------------- | ---- | ------ | ----------------- |
| one  | number \| boolean | ✅   |        | the first number  |
| two  | number            | ❎   | 2      | the second number |

**实例：**

```tsx
add(1, 2);
```

#### Person (type)

> Add two numbers

**属性：**

| 属性    | 类型         | 必填 | 默认值 | 说明              |
| ------- | ------------ | ---- | ------ | ----------------- |
| name    | string       | ❎   |        | the first number  |
| age     | number       | ✅   | 2      | the second number |
| getName | () => string | ✅   |        | -                 |

**实例：**

```tsx
add(1, 2);
```
----------
### 帮助

如果您需要有关 `ts-md` 的任何文档，只需从终端运行以下命令:

```sh
npx ts-md --help
```

### 定位更多文件

`ts-md` 还支持定位其他可能不在 `src` 中的文件.
只需向 `ts-md` 提供一个路径，它还会为这些文件生成文档.

```json
{
  "scripts": {
    "docs": "ts-md components/**/*.(ts|tsx)"
  }
}
```
