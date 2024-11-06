import express, { json, urlencoded } from "express";
import initControllers from "./controllers.ts";

const app = express();
const host = process.env.HOST || "0.0.0.0";
const port: number = +(process.env.PORT || 3000);

app.use(json({limit: '200mb'}));
app.use(urlencoded({ extended: true, limit: '200mb' }));

app.use((req, res, next) => {
  console.log(`Route accessed: ${req.method} ${req.originalUrl}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`Response sent: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
  });
  next();
});

initControllers(app);

app.listen(3000, host, () => {
  console.log(`Server is listening at ${host}:${port}`);
});
