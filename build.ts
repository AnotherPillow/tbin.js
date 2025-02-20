import { Glob } from "bun";

const sourceDirectory = "./src/";
const glob = new Glob('*.ts');
var entrypoints = [...glob.scanSync(sourceDirectory)];
entrypoints = entrypoints.map((x) => sourceDirectory + x);
console.log("Compiling " + entrypoints.length + " typescript files...");

const results = await Bun.build({
  entrypoints: entrypoints,
  publicPath: "",
  sourcemap: "inline",
  outdir: './build',
  plugins: [],
});