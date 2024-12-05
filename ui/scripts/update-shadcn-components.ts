import { $, Glob } from "bun";

const glob = new Glob("*.tsx");

const ignoreList = ["calendar"];

for await (const file of glob.scan("./src/components/ui/")) {
  const [name] = file.split(".");

  if (ignoreList.includes(name)) {
    console.log(`name ${name} ignored`);
    continue;
  }

  try {
    await $`bunx --bun shadcn@latest add -y -o ${name}`;
  } catch {
    console.log(`name ${name} skipped`);
  }
}
