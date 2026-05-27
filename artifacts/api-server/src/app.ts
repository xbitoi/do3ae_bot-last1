import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the latest video for Webhook platforms
app.get("/api/latest-video", (req, res) => {
  const fbPath = path.join(__dirname, "..", "last-video-fb.mp4");
  const hqPath = path.join(__dirname, "..", "last-video-hq.mp4");
  const stdPath = path.join(__dirname, "..", "last-video.mp4");
  
  if (req.query.fb === "1" && require("fs").existsSync(fbPath)) {
    res.sendFile(fbPath);
  } else if (require("fs").existsSync(hqPath)) {
    res.sendFile(hqPath);
  } else if (require("fs").existsSync(stdPath)) {
    res.sendFile(stdPath);
  } else {
    res.status(404).send("No video found");
  }
});

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
