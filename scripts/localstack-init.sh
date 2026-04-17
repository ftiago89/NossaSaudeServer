#!/bin/bash
# Runs automatically when LocalStack is ready (via /etc/localstack/init/ready.d/)
# Creates the development S3 bucket with versioning enabled

BUCKET="nossasaude-prescriptions-dev"

echo "Creating S3 bucket: $BUCKET"
awslocal s3 mb s3://$BUCKET --region sa-east-1

echo "Enabling versioning on: $BUCKET"
awslocal s3api put-bucket-versioning \
  --bucket $BUCKET \
  --versioning-configuration Status=Enabled

echo "LocalStack init complete. Bucket $BUCKET is ready."
