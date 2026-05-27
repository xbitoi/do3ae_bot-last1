import fs from "fs";
import path from "path";

function fixCatalog(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git") {
        fixCatalog(fullPath);
      }
    } else if (file === "package.json") {
      try {
        let content = fs.readFileSync(fullPath, "utf-8");
        let changed = false;
        
        if (content.includes('"catalog:"')) {
          content = content.replace(/"catalog:"/g, '"*"');
          changed = true;
        }

        if (content.includes('"workspace:"')) {
            content = content.replace(/"workspace:[^"]*"/g, '"*"');
            changed = true;
        }

        if (changed) {
          fs.writeFileSync(fullPath, content);
          console.log("Fixed " + fullPath);
        }
      } catch (e) {}
    }
  }
}

fixCatalog(process.cwd());

fs.writeFileSync('package.json', JSON.stringify({
  "name": "do3aelasto-workspace",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "cd artifacts/telegram-studio && npm run dev",
    "build": "cd artifacts/telegram-studio && npm run build",
    "start": "cd artifacts/api-server && npm run start"
  },
  "workspaces": [
    "artifacts/*",
    "lib/*",
    "scripts"
  ]
}, null, 2));

fs.writeFileSync('pnpm-workspace.yaml', `packages:
  - 'artifacts/*'
  - 'lib/*'
  - 'scripts'
`);

fs.rmSync('package-lock.json', {force: true});
  
