import esbuild from "esbuild";

await esbuild.build({
  bundle: true,
  outdir: `dist`,
  entryPoints: [
    `src/main.ts`
  ],
  platform: `node`,
  format: `esm`,
  external: [`typescript`],
  sourcemap: true
});