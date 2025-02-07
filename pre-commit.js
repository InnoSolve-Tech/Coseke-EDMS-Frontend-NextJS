const { execSync } = require("child_process");

try {
  console.log("Running Prettier...");
  execSync('npx prettier --write . "--ignore-path .prettierignore"', {
    stdio: "inherit",
  });
  execSync("git add -A", { stdio: "inherit" });
  console.log("Prettier formatting complete.");
} catch (error) {
  console.error("Error running Prettier:", error);
  process.exit(1);
}
