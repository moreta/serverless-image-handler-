# Serverless Image Handler

Image CDN stack with Cloudfront, ApiGateway, Lambda, S3.

Customizing [aws-solutions/serverless-image-handler](https://github.com/aws-solutions/serverless-image-handler) repository to my taste.

# script
 
* cdk-deploy.sh
* cdk-destroy.sh
* cdk-diff.sh
* cdk-synth.sh


# Example - Deploy specific stack only 
```
cdk deploy "ServerlessImageHandler-prod-App-stack" --profile=my-aws-profile
cdk deploy "ServerlessImageHandler-stag-App-stack" --profile=my-aws-profile
```
