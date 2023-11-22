#!/bin/bash
# Navigate to the functions directory

ACCOUNT_ID=924061656603
REGION="us-east-1" # Replace with your actual AWS region
REPO_NAME="924061656603.dkr.ecr.us-east-1.amazonaws.com" # Replace with your actual ECR repository name
FUNCTIONS_DIR="src/functions"  # Specify the path to the functions directory

# Loop over each directory (function) and build its Docker image
for FUNCTION_DIR in "$FUNCTIONS_DIR"/* ; do
    # Remove the path and trailing slash to get the FUNCTION_NAME
    FUNCTION_NAME=$(basename "$FUNCTION_DIR")

    # Build the Docker image for the function
    if docker build --platform linux/amd64 --build-arg FUNCTION_DIR="$FUNCTION_NAME" -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$FUNCTION_NAME:latest .; then
        echo "Successfully built image for $FUNCTION_NAME"
    else
        echo "Failed to build image for $FUNCTION_NAME"
        exit 1
    fi

    # Login to ECR
    if aws ecr get-login-password --no-cli-pager --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com; then
        echo "Logged in to ECR for $FUNCTION_NAME"
    else
        echo "Failed to log in to ECR for $FUNCTION_NAME"
        exit 1
    fi

    # Create the ECR repository (if it doesn't exist)
    if aws ecr describe-repositories --no-cli-pager --repository-names $FUNCTION_NAME 2>/dev/null; then
        echo "ECR repo $FUNCTION_NAME already exists"
    else
        if aws ecr create-repository --no-cli-pager --repository-name $FUNCTION_NAME --region $REGION --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE; then
            echo "Created ECR repo for $FUNCTION_NAME"
        else
            echo "Failed to create ECR repo for $FUNCTION_NAME"
            exit 1
        fi
    fi

    if docker tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$FUNCTION_NAME:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$FUNCTION_NAME:latest; then
        echo "Tagged image for $FUNCTION_NAME"
    else
        echo "Failed to tag image for $FUNCTION_NAME"
        exit 1
    fi

    # Push the image to ECR
    if docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$FUNCTION_NAME:latest; then
        echo "Pushed image to ECR for $FUNCTION_NAME"
    else
        echo "Failed to push image to ECR for $FUNCTION_NAME"
        exit 1
    fi

    # Update the Lambda function
    if aws lambda get-function --no-cli-pager --function-name $FUNCTION_NAME 2>/dev/null; then
        if aws lambda update-function-code --no-cli-pager --function-name $FUNCTION_NAME --image-uri $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$FUNCTION_NAME:latest; then
            echo "Updated Lambda function $FUNCTION_NAME"
        else
            echo "Failed to update Lambda function $FUNCTION_NAME"
            exit 1
        fi
    else
        if aws lambda create-function --no-cli-pager --function-name $FUNCTION_NAME --package-type Image --code ImageUri=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$FUNCTION_NAME:latest --role arn:aws:iam::$ACCOUNT_ID:role/lambda-ex; then
            echo "Created Lambda function $FUNCTION_NAME"
        else
            echo "Failed to create Lambda function $FUNCTION_NAME"
            exit 1
        fi
    fi
done
