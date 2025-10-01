import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

import authRouter from "./routes/auth";
import { requireSession, AuthedReq } from "./mw/requireSession";

async function main() {

  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/healthz", (_req: Request, res: Response) =>
    res.json({ ok: true, service: "user" })
  );

  app.use("/auth", authRouter);

  app.get("/auth/me", requireSession, (req: AuthedReq, res: Response) => {
    res.json({ user: req.user });
  });

  const port = Number(process.env.PORT) || 4001;
  app.listen(port, () => {
    console.log(`User service on http://localhost:${port}`);
  });

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN, 
      credentials: true,               
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});