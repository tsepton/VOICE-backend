import express, { NextFunction, Request, Response } from "npm:express@4.18.2";

const app = express();
const port = Number(Deno.env.get("PORT")) || 3000;

const reqLogger = function (req: Request, _res: Response, next: NextFunction) {
  console.info(`${req.method} request to "${req.url}" by ${req.hostname}`);
  next();
};

app.use(reqLogger);

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello, World!" });
});

app.listen(port, () => {
  console.log(`Listening on ${port} ...`);
});
