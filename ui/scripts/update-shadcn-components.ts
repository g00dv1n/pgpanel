import { execSync } from "child_process";
import { readdir } from "fs/promises";

const ignoreList = ["calendar"];

const files = await readdir("./src/components/ui/");

for (const file of files) {
  if (!file.endsWith(".tsx")) continue;

  const [name] = file.split(".");

  if (ignoreList.includes(name)) {
    console.log(`name ${name} ignored`);
    continue;
  }

  try {
    execSync(`pnpm dlx shadcn@latest add ${name} --yes --overwrite`);
  } catch {
    console.log(`name ${name} skipped`);
  }
}
