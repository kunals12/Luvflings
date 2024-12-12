import express from "express";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./backend/routes";
import TelegramBot from "./bot/bot";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

const telegramBot = new TelegramBot(process.env.BOT_TOKEN as string);
telegramBot.launch();

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
