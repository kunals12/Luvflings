import sharp from "sharp";
import axios from "axios";

// Function to fetch image from URL with error handling
const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    // console.log(`Failed to fetch image from URL: ${url}`, error);
    return null;
  }
};

// Function to create combined image
export const createCombinedImage = async (photo1: string, photo2: string) => {
  // console.log({ photo1, photo2 });

  try {
    const heart = await fetchImageBuffer(
      "https://flirtu-imgs.s3.us-east-1.amazonaws.com/AgACAgUAAxkBAAIPg2ajz116ruxuAAEE8TqfwPa3iLekZAACI78xG3ObIVVYhIPf3qh6wAEAAwIAA3kAAzUE.jpg"
    );
    const buffer1 = await fetchImageBuffer(photo1);
    const buffer2 = await fetchImageBuffer(photo2);

    if (!heart || !buffer1 || !buffer2) {
      // console.log("!buffer");
      
      return null;
    }

    const img1 = sharp(buffer1).resize(100, 100);
    const img2 = sharp(buffer2).resize(100, 100);
    const heartImg = sharp(heart).resize(50, 50);

    const metadata1 = await img1.metadata();
    const metadata2 = await img2.metadata();

    const w1 = metadata1.width ?? 100;
    const h1 = metadata1.height ?? 100;
    const w2 = metadata2.width ?? 100;
    const h2 = metadata2.height ?? 100;

    const combinedWidth = w1 + w2 + 50; // 50 is the heart width
    const combinedHeight = Math.max(h1, h2);

    // console.log("combining..");
    

    const combinedImage = await sharp({
      create: {
        width: combinedWidth,
        height: combinedHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .composite([
        { input: await img1.toBuffer(), left: 0, top: 0 },
        {
          input: await heartImg.toBuffer(),
          left: w1,
          top: (combinedHeight - 50) / 2,
        },
        { input: await img2.toBuffer(), left: w1 + 50, top: 0 },
      ])
      .toBuffer();

      // console.log({ combinedImage });
      

    return combinedImage;
  } catch (error) {
    // console.log(error);
    return null;
  }
};
