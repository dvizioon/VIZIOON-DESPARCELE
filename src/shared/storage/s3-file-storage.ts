import { randomUUID } from "node:crypto";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { FileStorage, StoredFile, StoredFileRead } from "./file-storage";

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  port: number;
  useSsl: boolean;
};

export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;

  constructor(private readonly config: S3Config) {
    const endpoint = normalizeEndpoint(config.endpoint, config.port, config.useSsl);

    this.client = new S3Client({
      region: config.region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
  }

  async save(file: StoredFile, folder: string): Promise<string> {
    const extension = path.extname(file.filename);
    const key = `${folder}/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType,
      }),
    );

    return key;
  }

  async remove(storedUrl: string): Promise<void> {
    const key = storedUrl.replace(/^\/api\/files\//, "");
    if (!key || key.includes("..")) {
      return;
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }

  async read(storedUrl: string): Promise<StoredFileRead | null> {
    const key = storedUrl.replace(/^\/api\/files\//, "");
    if (!key || key.includes("..")) {
      return null;
    }

    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        return null;
      }
      return {
        buffer: Buffer.from(bytes),
        mimeType: result.ContentType || "application/octet-stream",
      };
    } catch {
      return null;
    }
  }
}

function normalizeEndpoint(endpoint: string, port: number, useSsl: boolean): string {
  if (endpoint.includes("://")) {
    const url = new URL(endpoint);
    if (!url.port) {
      url.port = String(port);
    }
    return url.toString().replace(/\/$/, "");
  }

  const protocol = useSsl ? "https" : "http";
  return `${protocol}://${endpoint}:${port}`;
}
