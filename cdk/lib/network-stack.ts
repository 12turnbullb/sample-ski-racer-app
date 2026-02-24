import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with 2 AZs, no NAT gateways — VPC endpoints used instead
    this.vpc = new ec2.Vpc(this, 'SkiAppVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Lambda',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for Lambda functions (outbound to VPC endpoints)
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Gateway endpoint for S3 — avoids NAT gateway data transfer costs
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Interface endpoint for Bedrock Runtime
    this.vpc.addInterfaceEndpoint('BedrockRuntimeEndpoint', {
      service: new ec2.InterfaceVpcEndpointAwsService('bedrock-runtime'),
      subnets: { subnetGroupName: 'Lambda' },
      securityGroups: [this.lambdaSecurityGroup],
      privateDnsEnabled: true,
    });

    // Interface endpoint for Secrets Manager
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetGroupName: 'Lambda' },
      securityGroups: [this.lambdaSecurityGroup],
      privateDnsEnabled: true,
    });

    // Interface endpoints for ECR (required for Lambda container images)
    this.vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetGroupName: 'Lambda' },
      securityGroups: [this.lambdaSecurityGroup],
      privateDnsEnabled: true,
    });

    this.vpc.addInterfaceEndpoint('EcrDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetGroupName: 'Lambda' },
      securityGroups: [this.lambdaSecurityGroup],
      privateDnsEnabled: true,
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
