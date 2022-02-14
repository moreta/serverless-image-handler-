// https://github.com/Mrdev1ce/rs-shop-be/blob/bc6420345b6c29acfc062cba02246ad1b5a8dd9e/product-service/common/lambda-results-builder.ts#L16

import { APIGatewayProxyResult } from "aws-lambda"
import { StatusCodes } from "./enums"


const CORS_ORIGIN = "*"

const buildCorsHeaders = () => {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET"
    // "Access-Control-Allow-Methods": "OPTIONS,GET"
  }
}

export const buildBodyForJson = (body: unknown): string => {
  return body ? JSON.stringify(body, null, 2) : ""
}

// type BuildGatewayResultParams = Partial<Omit<APIGatewayProxyResult, "body"> & { body: unknown }>
type BuildGatewayResultParams = Partial<APIGatewayProxyResult>

export const buildGatewayResult = ({
  statusCode,
  body,
  headers,
  isBase64Encoded,
  ...rest
}: BuildGatewayResultParams): APIGatewayProxyResult => {
  const corsHeaders = buildCorsHeaders()
  return {
    ...rest,
    headers: { ...headers, ...corsHeaders },
    statusCode: statusCode || 200,
    isBase64Encoded: isBase64Encoded,
    body: body || ""
  }
}

export const buildCreatedGatewayResult = (body: unknown) => {
  return buildGatewayResult({
    statusCode: 201,
    body: buildBodyForJson(body)
  })
}

export const buildGatewayNotFoundResult = (message?: string) => {
  const response = {
    body: buildBodyForJson(message ? { message } : null),
    statusCode: StatusCodes.NOT_FOUND,
    isBase64Encoded: false,
    headers: { "Content-Type": "application/json" }
  }
  return buildGatewayResult(response)
}

export const buildGatewayBadRequestResult = (
  message?: string,
  data?: Record<string, unknown>
) => {
  const response = {
    body: buildBodyForJson({ message, ...data }),
    statusCode: StatusCodes.BAD_REQUEST,
    isBase64Encoded: false,
    headers: { "Content-Type": "application/json" }
  }
  return buildGatewayResult(response)
}

export const buildGatewayInternalErrorResult = () => {
  const response = {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    isBase64Encoded: false,
    body: buildBodyForJson({
      message: "Internal error. Please contact the system administrator.",
      code: "InternalError",
      status: StatusCodes.INTERNAL_SERVER_ERROR
    }),
    headers: { "Content-Type": "application/json" }
  }
  return buildGatewayResult(response)
}

export const buildCommonErrorResult = (error: Error & { status: number }) => {
  return buildGatewayResult({
    statusCode: error.status,
    isBase64Encoded: false,
    body: buildBodyForJson(error),
    headers: { "Content-Type": "application/json" }
  })
}
