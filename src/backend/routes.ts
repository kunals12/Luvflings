import { Router, Request, Response } from "express";
import multer from "multer";
import { UserService } from "./user.service";
import { uploadToS3 } from "./aws-upload";
import  { userStates } from "../bot/bot";
import { Telegraf } from "telegraf";

const router = Router();
const userService = new UserService();
const bot = new Telegraf(process.env.BOT_TOKEN as string);



// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
router.get("/health", (req: Request, res: Response) => {
  res.status(200).send("App is up and running");
});

router.get("/api/user/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const user = await userService.getUser(id);
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/api/user/profilePic/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const user = await userService.getUser(id);
    // console.log(user);

    res.send(user.profilePhoto);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch(
  "/api/user/profilePic",
  upload.single("img"),
  async (req: Request, res: Response) => {
    const id = req.body.id;
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const fileUrl = await uploadToS3(file.buffer, file.originalname);
      // console.log(fileUrl);

      await userService.updateProfilePic(+id, fileUrl);
      res.status(200).send("profilePic uploaded");
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

router.post(
  "/api/user/photos",
  upload.single("img"),
  async (req: Request, res: Response) => {
    const id = req.body.id;
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const fileUrl = await uploadToS3(file.buffer, file.originalname);
      await userService.updateUserImages(+id, fileUrl);
      res.status(200).send("Image uploaded");
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

router.delete("/api/user/photos", async (req: Request, res: Response) => {
  const { id, imgUrl } = req.body;

  if (!id || !imgUrl) {
    return res.status(400).send("Invalid request: id and imgUrl are required.");
  }

  try {
    await userService.removePhotoFromUser(Number(id), imgUrl);
    res.status(200).send("Image deleted");
  } catch (error) {
    // console.log("Error deleting image:", error);
    res.status(500).send("An error occurred while deleting the image.");
  }
});

router.get("/api/matches/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const matches = await userService.getMatches(Number(id));
    res.status(200).send(matches);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/api/matches/message", async (req: Request, res: Response) => {
  const { id, userId, message } = req.body; // Expecting `id`, `userId`, and `message` in the request body

  if (!id || !message) {
    return res.status(400).send("Missing id or message");
  }

  try {
    // Sending a message to the provided Telegram ID
    const msg = await bot.telegram.sendMessage(id, message);
    userStates.set(id, { waitingFor: "msg-reply" });

    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error); // Log the error for debugging
    res.status(500).send("Failed to send message");
  }
});
// router.get()

export default router;
