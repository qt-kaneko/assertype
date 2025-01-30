Simple TypeScript user-defined type guards generator.

1. Annotate type guard with @assertype
```ts
interface Foo
{
  a: string;
  b: number;
  c: boolean;
}

/** @assertype */
function Foo() {}
```

2. Run `npx assertype tsconfig.json`
> tsconfig.json is path to your tsconfig

```ts
interface Foo
{
  a: string;
  b: number;
  c: boolean;
}

/** @ts-ignore @assertype */ // eslint-disable-next-line
function Foo(v): v is Foo { return typeof v === "object" && v !== null && typeof v.a === "string" && typeof v.b === "number" && typeof v.c === "boolean"; }
```

3. Get your type guard 🥳

- Type guard name must be the same as type name.
- Type guard must be defined in the same file as type.

Generator supports both `interface` and `type` declarations.