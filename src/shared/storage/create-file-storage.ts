import type { FileStorage } from "./file-storage";
import { LocalFileStorage } from "./local-file-storage";
import { S3FileStorage } from "./s3-file-storage";

export function createFileStorage(): FileStorage {
  const s3Enabled = process.env.S3_ENABLED === "true";

  if (!s3Enabled) {
    return new LocalFileStorage(process.env.LOCAL_STORAGE_PATH ?? "./storage");
  }

  const bucketList = process.env.S3_BUCKET ?? "";
  const bucket = bucketList.split(",")[0]?.trim();

  if (
    !bucket ||
    !process.env.S3_ACCESS_KEY ||
    !process.env.S3_SECRET_KEY ||
    !process.env.S3_ENDPOINT
  ) {
    throw new Error("Configuracao S3 incompleta");
  }

  return new S3FileStorage({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    port: Number(process.env.S3_PORT ?? 9000),
    useSsl: process.env.S3_USE_SSL === "true",
  });
}
