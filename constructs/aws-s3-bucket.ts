import { Construct } from 'constructs';
import { s3 } from '@cdktf/provider-aws';

export interface AwsS3BucketProps {
  readonly bucket: string;
  readonly acl:
    | 'private'
    | 'public-read'
    | 'public-read-write'
    | 'authenticated-read'
    | 'bucket-owner-read'
    | 'bucket-owner-full-control';
  readonly policy?: string;
  readonly website?: s3.S3BucketWebsite;
  readonly corsRule?: s3.S3BucketCorsRule[];
  readonly tags?: { [key: string]: string };
}

export class AwsS3Bucket extends Construct {
  public readonly bucket: s3.S3Bucket;

  constructor(scope: Construct, id: string, props: AwsS3BucketProps) {
    super(scope, id);
    const { bucket, acl, policy, website, corsRule, tags } = props;
    this.bucket = new s3.S3Bucket(this, `${bucket}-bucket`, {
      bucket,
      acl,
      policy,
      website,
      corsRule,
      tags,
    });
  }
}
