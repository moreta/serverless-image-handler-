/**
 * request parameterのquery stringを解析
 */
import { GetObjectOutput, GetObjectCommand } from "@aws-sdk/client-s3"
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda/trigger/api-gateway-proxy"
import * as path from "path"
import { s3Client } from "../s3/s3-client"

export const FileFormats = ["jpeg", "png", "webp"] as const
export type AllowedFormat = typeof FileFormats[number]

export const QueryStringParameterKeys: string[] = ["w", "h", "fit", "q", "f", "lossless", "near_lossless"]

export interface QueryStringParameters {
  w?: string // resize option - width
  h?: string // resize option -height
  fit?: string // resize option -fit mode (cover, contain, fill, inside, outside)
  q?: string // quality (1~100)
  f?: AllowedFormat // format (jpeg, png..)
  lossless?: boolean // webp option
  near_lossless?: boolean // webp option
}

export class ImageRequest {
  ContentType: string | number | boolean
  Expires: string | number | boolean
  LastModified: string | number | boolean
  CacheControl: string | number | boolean

  originalImage: GetObjectOutput
  outputOptions: QueryStringParameters | null
  imageExtension: string

  private bucket: string
  private imagePath: string

  async setup(requestPath: string, queryStringParameters: APIGatewayProxyEventQueryStringParameters | null): Promise<ImageRequest> {
    try {
      // bucket
      this.bucket = process.env.IMAGE_SOURCE_BUCKET!
      // imagePath
      this.imagePath = requestPath.replace(/^\//, "")
      this.imageExtension = path.extname(requestPath).replace(".", "")
      this.outputOptions = queryStringParameters as QueryStringParameters

      console.log(`get Images s3 path : ${this.bucket}/${this.imagePath}`)
      console.log("event outputOptions ===== ", this.outputOptions)

      await this.getOriginalImage(this.bucket, this.imagePath)

      return Promise.resolve(this)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  private async getOriginalImage(bucket: string, imagePath: string): Promise<boolean> {
    try {
      const originalImage = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: imagePath
      }))

      if (originalImage.ContentType) {
        this.ContentType = originalImage.ContentType
      } else {
        this.ContentType = "image"
      }

      if (originalImage.Expires) {
        this.Expires = new Date(originalImage.Expires).toUTCString()
      }

      if (originalImage.LastModified) {
        this.LastModified = new Date(originalImage.LastModified).toUTCString()
      }

      if (originalImage.CacheControl) {
        this.CacheControl = originalImage.CacheControl
      } else {
        this.CacheControl = "max-age=86400,public" // 1 day
      }

      this.originalImage = originalImage

      return Promise.resolve(true)
    } catch (err) {
      return Promise.reject({
        status: ("NoSuchKey" === err.code) ? 404 : 500,
        code: err.code,
        message: err.message
      })
    }
  }

}

