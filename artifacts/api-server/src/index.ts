import app from "./app.js";
import { logger } from "./lib/logger.js";
import { tryAutoStartBot, stopBot } from "./lib/bot-manager.js";
import { initProxy } from "./lib/proxy-manager.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

try {
  console.log("Installing python requirements...");
  try {
    execSync("python3 -m pip --version", { stdio: "ignore" });
  } catch (e) {
    console.log("pip is missing. Attempting to install pip via get-pip.py...");
    try {
      execSync("curl -sSL https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3 get-pip.py --break-system-packages", { stdio: "inherit" });
    } catch (pipErr) {
      console.error("Failed to download and run get-pip.py:", pipErr);
    }
  }
  execSync("python3 -m pip install Pillow arabic-reshaper python-bidi edge-tts gTTS --break-system-packages || pip3 install Pillow arabic-reshaper python-bidi edge-tts gTTS --break-system-packages || pip install Pillow arabic-reshaper python-bidi edge-tts gTTS || true", { stdio: "inherit" });
} catch (e) {
  console.error("Failed to install python requirements", e);
}

try {
  console.log("Checking and downloading missing Arabic fonts...");
  let fontsDir = path.resolve(process.cwd(), "..", "telegram-studio", "public", "fonts");
  if (process.env.NODE_ENV === "production" || !fs.existsSync(path.dirname(fontsDir))) {
    fontsDir = path.resolve(process.cwd(), "dist", "public", "fonts");
  }
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }
  const fontUrls: Record<string, string> = {
    "reqaa.ttf": "https://github.com/google/fonts/raw/main/ofl/arefruqaa/ArefRuqaa-Regular.ttf",
    "naskh.ttf": "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
    "diwani.ttf": "https://github.com/AmrSobhy/arabic-fonts/raw/master/fonts/Diwani_Letter.ttf",
    "diwani_jali.ttf": "https://github.com/AmrSobhy/arabic-fonts/raw/master/fonts/Diwani_Bent.ttf",
    "thuluth.ttf": "https://github.com/AmrSobhy/arabic-fonts/raw/master/fonts/Thuluth_Regular.ttf",
    "nastaliq.ttf": "https://github.com/google/fonts/raw/main/ofl/notonastaliqurdu/NotoNastaliqUrdu-Regular.ttf",
    "shikasteh.ttf": "https://github.com/shahre-farang/fonts/raw/master/IranNastaliq.ttf"
  };
  for (const [filename, url] of Object.entries(fontUrls)) {
    const filePath = path.join(fontsDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`Downloading font: ${filename} from ${url}...`);
      try {
        execSync(`curl -L -o "${filePath}" "${url}" || wget -O "${filePath}" "${url}"`, { stdio: "ignore" });
        console.log(`Font ${filename} downloaded successfully.`);
      } catch (err) {
        console.error(`Failed to download font: ${filename}`, err);
      }
    }
  }
} catch (e) {
  console.error("Failed to check or download fonts", e);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  initProxy().then((proxyStatus) => {
    logger.info({ connectionType: proxyStatus.type, proxy: proxyStatus.proxyUrl }, "Connection type determined");
    return tryAutoStartBot();
  }).then((result) => {
    logger.info({ result }, "Auto-start bot result");
  }).catch((err) => {
    logger.warn({ err }, "Startup sequence failed");
  });
});

function gracefulShutdown() {
  logger.info("Shutting down gracefully...");
  stopBot();
  server.close(() => {
    process.exit(0);
  });
}
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

