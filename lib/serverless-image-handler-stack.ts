import * as cdk from "aws-cdk-lib"
import { Stack, StackProps } from "aws-cdk-lib"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { NodejsFunctionProps, NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import * as s3 from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import * as path from "path"
import { ResourceName } from "./resource-name"

// References
// https://dev.classmethod.jp/articles/aws-cdk-api-gateway-custom-domain/
// https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-apigateway.html
export class ServerlessImageHandlerStack extends Stack {
  constructor(scope: Construct, resourceName: ResourceName, props?: StackProps) {
    const id = resourceName.stackName("App")
    super(scope, id, props)

    // s3
    const imageSourceBucketName = resourceName.bucketName("bucket")
    const imageBucket = s3.Bucket.fromBucketName(this, imageSourceBucketName, imageSourceBucketName)

    // lambda
    const { getImageFunction } = this.createLambda(resourceName, imageSourceBucketName)

    // lambdaにec2へのread権限を付与
    imageBucket.grantReadWrite(getImageFunction) // was: handler.role);

    // apigateway
    const apiGatewayProps: apigateway.LambdaRestApiProps = {
      handler: getImageFunction,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.NONE
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        statusCode: 200
      },
      proxy: false,
      binaryMediaTypes: ["*/*"]
    }

    const apiName = resourceName.apiName("image-handler")
    const api = new apigateway.LambdaRestApi(this, apiName, apiGatewayProps)
    api.root.addMethod("GET", new apigateway.LambdaIntegration(getImageFunction))
    api.root.addResource("{proxy+}").addMethod("GET", new apigateway.LambdaIntegration(getImageFunction))

    const apiEndPointUrlWithoutProtocol = cdk.Fn.select(1, cdk.Fn.split("://", api.url))
    const apiEndPointDomainName = cdk.Fn.select(0, cdk.Fn.split("/", apiEndPointUrlWithoutProtocol))

    // cloudfront
    const cdnName = resourceName.cdnName("image-handler")
    new cloudfront.Distribution(this, cdnName, {
      defaultBehavior: {
        origin: new origins.HttpOrigin(apiEndPointDomainName, {
          originPath: `/${api.deploymentStage.stageName}`
        })
      }
    })
  }

  private createLambda(resourceName: ResourceName, imageSourceBucketName: string) {
    const lambdasPath = path.join(__dirname, "lambda")
    console.log("lambdasPath : ", lambdasPath)

    console.log("imageSourceBucketName : ", imageSourceBucketName)

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        forceDockerBundling: true,
        nodeModules: [
          "date-fns",
          "source-map-support",
          "@aws-sdk/client-s3",
          "sharp"
        ]
      },
      depsLockFilePath: path.join(__dirname, "../", "package-lock.json"),
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 256,
      // memorySize: 1024,
      environment: {
        IMAGE_SOURCE_BUCKET: imageSourceBucketName
      }
      // tracing: lambda.Tracing.ACTIVE // X-Ray tracing
    }

    const getImageFunctionName = resourceName.lambdaName("getImage")
    const getImageFunction = new NodejsFunction(this, getImageFunctionName, {
      entry: path.join(lambdasPath, "get-image.handler.ts"),
      handler: "getImage",
      functionName: getImageFunctionName,
      ...nodeJsFunctionProps
    })
    return {
      getImageFunction
    }
  }
}
