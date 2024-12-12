import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  buffer: Buffer,
  fileName: string
): Promise<string | any> => {
  const bucketName = process.env.S3_BUCKET_NAME!;
  const key = fileName;

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: "image/jpeg",
    // ACL: 'public-read',
  });

  try {
    await s3.send(putObjectCommand);
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return publicUrl;
  } catch (error) {
    // console.log("Error uploading to S3:", error);
    // throw error;
  }
};
