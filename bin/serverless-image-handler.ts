#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { ResourceName } from "../lib/resource-name"
import { ServerlessImageHandlerStack } from "../lib/serverless-image-handler-stack"

const app = new cdk.App()


/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const commonEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
}
const commonSystemName = "ServerlessImageHandler"

// https://dev.classmethod.jp/articles/aws-cdk-resource-name-rule-logic/
const prodResourceName = new ResourceName(commonSystemName, "prod")
new ServerlessImageHandlerStack(app, prodResourceName, {
  env: commonEnv
})

const stagResourceName = new ResourceName(commonSystemName, "stag")
new ServerlessImageHandlerStack(app, stagResourceName, {
  env: commonEnv
})
