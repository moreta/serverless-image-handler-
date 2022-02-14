import { GetObjectCommand } from "@aws-sdk/client-s3"
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { ImageHandler } from "../common/get-image/image-handler"
import { ImageRequest } from "../common/get-image/image-request"
import { Headers } from "../common/interface"
import {
  buildGatewayResult,
  buildGatewayInternalErrorResult,
  buildCommonErrorResult
} from "../common/lambda-results-builder"
import { Logger } from "../common/logger"
import { s3Client } from "../common/s3/s3-client"
import { streamToUint8Array, uint8ArrayToString } from "../common/s3/s3-reader"

const logger = new Logger("GetProductsListHandler")

const defaultImageHandler = async (): Promise<APIGatewayProxyResult> => {
  const bucketName = process.env.IMAGE_SOURCE_BUCKET
  logger.info("Bucket Name", bucketName)

  const bucketKey = "default.png"
  const defaultFallbackImage = await s3Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: bucketKey
  }))

  let headers: Headers = {
    // "Cache-Control": "max-age=31536000,public"
  }
  headers["Content-Type"] = defaultFallbackImage.ContentType
  headers["Last-Modified"] = defaultFallbackImage.LastModified
  const body = await streamToUint8Array(defaultFallbackImage.Body)

  // const now = formatNow()
  // const body = buildBodyForJson({
  //   result: `こんにちは, ${now}`,
  //   event: event
  // })
  return buildGatewayResult({
    headers: headers,
    body: uint8ArrayToString(body),
    isBase64Encoded: true
  })
}

// https://github.com/aws-solutions/serverless-image-handler/blob/e6655c69cf9f54bd3b18e9e594e4c244246c7c2f/source/image-handler/index.ts
// https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/lambda-proxy-binary-media.html
export const getImage: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  logger.info("Input", event)


  try {
    const imageRequest = new ImageRequest()
    const imageHandler = new ImageHandler()
    const path = event.path // "/test.jpg"
    const queryStringParameters = event.queryStringParameters

    const requestedImage = await imageRequest.setup(path, queryStringParameters)
    const processedImage = await imageHandler.process(requestedImage)

    let headers: Headers = {
      // "Cache-Control": "max-age=31536000,public"
    }
    headers["Content-Type"] = requestedImage.ContentType
    headers["Last-Modified"] = requestedImage.LastModified
    return buildGatewayResult({
      headers: headers,
      body: processedImage,
      isBase64Encoded: true
    })
  } catch (error) {
    logger.error("Internal server error", error)
    // return await defaultImageHandler()

    if (error.status) {
      return buildCommonErrorResult(error)
    } else {
      return buildGatewayInternalErrorResult()
    }
  }
}
