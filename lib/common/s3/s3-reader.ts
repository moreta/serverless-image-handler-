import { GetObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream"
import { s3Client } from "./s3-client"

export async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    stream.on("data", chunk => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
  })
}

export async function streamToUint8Array(stream: Readable): Promise<Uint8Array> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    stream.on("data", chunk => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks)))
  })
}

export async function readTextBucket(bucketName: string, bucketKey: string) {
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: bucketKey
  }))

  return await streamToString(response.Body as Readable)
}

export async function readBinaryBucket(bucketName: string, bucketKey: string) {
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: bucketKey
  }))

  return await streamToUint8Array(response.Body as Readable)
}

// https://github.com/Scorocode/sc-v2-js-server-sdk/blob/6a2b508cd4d7b5ab73a7f91928d8a3cbd7071537/src/utils/index.ts
export function uint8ArrayToString(arr: Uint8Array, encoding = "base64"): string {
  const buffer = Buffer.from(arr)

  return buffer.toString(encoding)
}
