import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  lambdaSecurityGroup: ec2.SecurityGroup;
  uploadsBucket: s3.Bucket;
  dbSecret: secretsmanager.ISecret;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda function — zip package built by scripts/build_lambda.sh
    // Run `npm run build:lambda` (or scripts/build_lambda.sh) before deploying.
    const lambdaPkgPath = path.join(__dirname, '..', '..', 'backend', 'lambda_pkg');

    const fn = new lambda.Function(this, 'SkiAppFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(lambdaPkgPath),
      handler: 'app.main.handler',
      vpc: props.vpc,
      vpcSubnets: { subnetGroupName: 'Lambda' },
      securityGroups: [props.lambdaSecurityGroup],
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      environment: {
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
        AWS_REGION_NAME: this.region,
        DB_SECRET_ARN: props.dbSecret.secretArn,
        ENVIRONMENT: 'production',
        // Set after FrontendStack deploy: CLOUDFRONT_DOMAIN
      },
    });

    // Grant Lambda read access to the DB credentials secret
    props.dbSecret.grantRead(fn);

    // Grant Lambda read/write access to the uploads bucket
    props.uploadsBucket.grantReadWrite(fn);

    // Grant Lambda permission to call Bedrock InvokeModel
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      })
    );

    // API Gateway HTTP API with Lambda proxy integration
    const httpApi = new apigatewayv2.HttpApi(this, 'SkiAppApi', {
      apiName: 'ski-app-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        // Tighten to CloudFront domain after first deploy
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const lambdaIntegration = new apigatewayv2integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      fn
    );

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    this.apiUrl = httpApi.apiEndpoint;

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway HTTP API endpoint URL',
    });
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: fn.functionArn,
    });
  }
}
