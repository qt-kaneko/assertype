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

#### About `${number}` template literal

TypeScript's `${number}` is kinda weird. It tries to follow JS's number coercion algorithm, i.e:

- +"10" => 10
- +"&nbsp;" => 0
- +"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" => 0
- +"\n" => 0
- +"\r\n" => 0
- +"10e1" => 100
- +"10e-1" => 1

But "" results in error, even though in JS

- +"" => 0

So for now generator does not support `${number}` template literal. If you need to check for an actual integers, you can use `${bigint}` which is consistent with TypeScript and produces `/-?\d+/` for checking numbers, so only valid values are:

- 1
- -12
- etc.

If you need support for floating point numbers or TypeScript's strange `${number}` bahaviour please open an issue.

#### About `${boolean}` template literal

Never ever use `${boolean}` as TypeScript, for some reason, parses it as `"false"`, so your typechecking will not be valid.