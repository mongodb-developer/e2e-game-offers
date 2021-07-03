#!/bin/bash

#-------------------------------------------------------------------------#
# This script sets up the E2E demo environment. It performs the following #
# tasks:                                                                  #
#   - Check and optionally install prerequisits                           #
#   - Create an Atlas cluster                                             #
#-------------------------------------------------------------------------#
# Date          Version      Author         Notes                         #
#-------------------------------------------------------------------------#
# 06-03-2021    1.0          Roy Kiesler    Initial version               #
#-------------------------------------------------------------------------#

#----------------------------------------------------------#
# This function verifies the config settings in env.config #
# and that all CLI commands used are installed. If any CLI #
# is missing, an option to install it is presented if one  #
# is available.                                            #
#----------------------------------------------------------#
checkPrerequisites() {
    echo "Checking prerequisites..."
    source env.config

    # verify Atlas API key
    if [[ "$ATLAS_API_PUBLIC_KEY" =~ ^\[.*\]$ || "$ATLAS_API_PRIVATE_KEY" =~ ^\[.*\]$ ]]; then
        echo >&2 "🛑 An API key is required to access Atlas. Please update env.config"
        echo >&2 "   See see https://docs.atlas.mongodb.com/configure-api-access/"
        exit 1
    else
        echo "✅ Atlas API key"
    fi

    # verify Atlas project
    if [[ "$ATLAS_GROUP_ID" =~ ^\[.*\]$ ]]; then
        echo >&2 "🛑 Please specify your Atlas project ID in env.config"
        exit 1
    else
        echo "✅ Atlas project"
    fi

    # verify AWS access key
    if [[ "$AWS_ACCESS_KEY_ID" =~ ^\[.*\]$ || "$AWS_SECRET_ACCESS_KEY" =~ ^\[.*\]$ ]]; then
        echo >&2 "🛑 An AWS access key is required to access S3. Please update env.config"
        echo >&2 "   See https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html"
        exit 1
    else
        echo "✅ AWS access key"
    fi

    # test aws cli
    (type aws >/dev/null 2>&1 && echo "✅ aws") || {
        echo >&2 "AWS CLI is not installed. Would you like to install it? [y/n]"
        read INSTALL_AWSCLI
        if [[ "$INSTALL_AWSCLI" == "y" || "$INSTALL_AWSCLI" == "Y" ]]; then
            curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
            sudo installer -pkg AWSCLIV2.pkg -target /
            rm -f AWSCLIV2.pkg
        else
            echo >&2 "🛑 Please install AWS CLI and try again"
            echo >&2 "   See https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
            exit 1
        fi
    }

    # test jq
    (type jq >/dev/null 2>&1 && echo "✅ jq") || {
        echo >&2 "jq is not installed. Would you like to install it? [y/n]";
        read INSTALL_JQ
        if [[ "$INSTALL_JQ" == "y" || "$INSTALL_JQ" == "Y" ]]; then
            brew install jq
        else
            echo >&2 "🛑 Please install jq and try again"
            echo >&2 "   See https://stedolan.github.io/jq/download/"
            exit 1
        fi
    }

    # test mongocli
    (type mongocli >/dev/null 2>&1 && echo "✅ mongocli") || {
        echo >&2 "mongocli is not installed. Would you like to install it? [y/n]"
        read INSTALL_MONGOCLI
        if [[ "$INSTALL_MONGOCLI" == "y" || "$INSTALL_MONGOCLI" == "Y" ]]; then
            brew tap mongodb/brew
            brew install mongocli
        else
            echo >&2 "🛑 Please install mongocli and try again"
            echo >&2 "   See https://docs.mongodb.com/mongocli/stable/install/"
            exit 1
        fi
    }

    # test realm-cli
    (type realm-cli >/dev/null 2>&1 && echo "✅ realm-cli") || {
        echo >&2 "realm-cli is not installed. Would you like to install it? [y/n]";
        read INSTALL_REALMCLI
        if [[ "$INSTALL_REALMCLI" == "y" || "$INSTALL_REALMCLI" == "Y" ]]; then
            type npm >/dev/null 2>&1 || {
                echo >&2 "🛑 npm is not installed and is required to install realm-cli. Please install npm and try again"
                echo >&2 "   See https://nodejs.org/en/"
                exit 1
            }
            npm install -g mongodb-realm-cli
        else
            echo >&2 "🛑 Please install realm-cli and try again. See https://docs.mongodb.com/realm/deploy/realm-cli-reference/";
            exit 1;
        fi
    }

    # test terraform
    (type terraform >/dev/null 2>&1 && echo "✅ terraform") || {
        echo >&2 "Terraform is not installed. Would you like to install it? [y/n]";
        read INSTALL_TF
        if [[ "$INSTALL_TF" == "y" || "$INSTALL_TF" == "Y" ]]; then
            brew tap hashicorp/tap
            brew install hashicorp/tap/terraform
        else
            echo >&2 "🛑 Please install Terraform and try again"
            echo >&2 "   See https://learn.hashicorp.com/tutorials/terraform/install-cli"
            exit 1
        fi
    }

    # test uuidgen
    (type uuidgen >/dev/null 2>&1 && echo "✅ uuidgen") || {
        echo >&2 "uuidgen is not installed. Would you like to install it? [y/n]";
        read INSTALL_UUID
        if [[ "$INSTALL_UUID" == "y" || "$INSTALL_UUID" == "Y" ]]; then
            brew install e2fsprogs
        else
            echo >&2 "🛑 Please install uuidgen and try again"
            echo >&2 "   See https://command-not-found.com/uuidgen"
            exit 1
        fi
    }

    echo ""
}

#----------------------------------------------------------#
# This function creates a new Atlas cluster based on the   #
# parameters specified in env.config.                      #
#----------------------------------------------------------#
createAtlasCluster() {
    # configure mongocli
    configureMongoCli

    # create the cluster
    echo "⛅️ Creating the cluster..."
    local cliResp=`mongocli atlas cluster create "${CLUSTER_NAME}" \
    --provider AWS \
    --region "${ATLAS_REGION}" \
    --tier M20 \
    --output json`
    local rc=$?
    if [[ rc -eq 0 ]]; then
        local clusterState=`echo $cliResp | jq -r ".stateName"`
        if [[ -z "$clusterState" || "$clusterState" == "null" ]]; then
            echo "🛑 Error creating cluster"
            echo $cliResp | jq
            exit 1
        else
            echo -e "⌛️ Cluster ${CLUSTER_NAME} is ${clusterState} and will be ready in a few minutes..."
        fi
    else
        echo "🛑 Error creating cluster"
        echo $cliResp | jq
        exit 1
    fi
}

#----------------------------------------------------------#
# This function sets the project ID and public/private API #
# key config settings in mongocli.
#----------------------------------------------------------#
configureMongoCli() {
    echo "🖥  Configuring mongocli..."
    mongocli config set project_id ${ATLAS_GROUP_ID}
    mongocli config set public_api_key ${ATLAS_API_PUBLIC_KEY}
    mongocli config set private_api_key ${ATLAS_API_PRIVATE_KEY}
    echo ""
}

#----------------------------------------------------------#
# This function sets the region, public/private access     #
# keys and output format config settings in aws CLI.       #
#----------------------------------------------------------#
configureAwsCli() {
    echo "🖥  Configuring aws..."
    aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}
    aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY}
    aws configure set region ${AWS_REGION}
    aws configure set output json
    echo ""
}

#----------------------------------------------------------#
# This function sets the public/private API keys config    #
# settings in realm-cli.                                   #
#----------------------------------------------------------#
configureRealmCli() {
    echo "🖥  Configuring realm-cli..."
    realm-cli login -y --api-key "${ATLAS_API_PUBLIC_KEY}" --private-api-key "${ATLAS_API_PRIVATE_KEY}"
    echo ""
}

#----------------------------------------------------------#
# This function creates a new S3 bucket in the AWS region  #
# specified in env.config. It stores the name of the new   #
# bucket in the S3_BUCKET_NEW variable.                    #
#----------------------------------------------------------#
createS3Bucket() {
    # Configure aws CLI
    configureAwsCli

    # S3 bucket names must be globally unique, so we append a UUID to the
    # the bucket prefix "e2e-player-activity". Buckets also cannot have any
    # UPPERCASE letters in them, so we lowercase the UUID
    local uuid=`uuidgen | tr "[:upper:]" "[:lower:]"`
    local s3bucket="${S3_BUCKET_PREFIX}-$uuid"
    
    # ==> need to update the Realm "e2eS3Bucket" value with the new bucket name before importing
    #     realm-cli secrets update -y --name e2eS3Bucket --value <newBucketName>
    #                              --app-id=e2e-game-offers-app-<xxxxx>

    # Note: Regions outside of us-east-1 require the appropriate `LocationConstraint`
    # to be specified in order to create the bucket in the desired region
    echo "🪣  Creating S3 bucket..."
    local cliResp=`aws s3api create-bucket --bucket "$s3bucket" --region "${AWS_REGION}"`
    local rc=$?
    if [[ rc -eq 0 ]]; then
        echo $cliResp | jq
        S3_BUCKET_NEW=${s3bucket}
    else
        echo "🛑 Error creating S3 bucket"
        echo $cliResp | jq
        exit 1
    fi
    echo ""
}

#----------------------------------------------------------#
# This function imports the Realm app into the Atlas       #
# project specified in env.config.                         #
#----------------------------------------------------------#
importRealmApp() {
    # configure realm-cli
    configureRealmCli

    # save current directory
    pushd backend/realm/e2e-game-offers-app >/dev/null 2>&1

    # import the app
    realm-cli import -y --project-id "${ATLAS_GROUP_ID}" --app-name e2e-game-offers-app  --include-dependencies --strategy replace-by-name

    # save realm app ID

    # update values/secrets (e.g., S3 bucket name -> ${S3_BUCKET_NEW})

    # done
    popd >/dev/null 2>&1
    echo -e "\n"
}

#----------------------------------------------------------#
# This function returns the current status of the Atlas    #
# cluster.                                                 #
#----------------------------------------------------------#
getClusterState() {
    local currState=`mongocli atlas clusters describe "${CLUSTER_NAME}" | jq -r ".stateName"`
    local rc=$?
    if [[ rc -eq 0 ]]; then
        echo $currState
    fi
}

#----------------------------------------------------------#
# This function returns the current status of the Atlas    #
# cluster.                                                 #
#----------------------------------------------------------#
isClusterPaused() {
    local paused=`mongocli atlas clusters describe "${CLUSTER_NAME}" | jq -r ".paused"`
    local rc=$?
    echo $paused
    if [[ rc -eq 0 ]]; then
        [ "$paused" == "true" ]
    else
        false
    fi
}

#----------------------------------------------------------#
# This function displays a simple progress indicator (...) #
# while waiting for the newly created cluster to be ready. #
#----------------------------------------------------------#
waitForClusterReady() {
    # max wait 15 minutes
    local maxLoops=90
    local i=1

    while [ $i -le $maxLoops ]
    do
        local state=`getClusterState` >/dev/null 2>&1
        if [[ "$state" == "IDLE" ]];
        then
            echo -e "\n✅ Cluster is ready\n"
            break
        else
            printf "."
        fi
        sleep 10
        ((i++))
    done
    if [[ "$state" -ne "IDLE" ]];
    then
        echo "Cluster still not ready..."
    fi
}

#----------------------------------------------------------#
# This is the actual setup script driver.                  #
#----------------------------------------------------------#
checkPrerequisites

# Check if cluster exists
if [[ getClusterState ]]; then
    # cluster already exists -- check if paused
    if [[ `isClusterPaused` == 'true' ]]; then
        echo "⏯ Cluster is paused -- resuming..."
        mongocli atlas clusters start "${CLUSTER_NAME}" >/dev/null 2>&1
    else
        echo "Cluster already exists"
    fi
else
    # Cluster does not exist yet -- create it
    createAtlasCluster
fi

# Wait for cluster to be created/resumed
waitForClusterReady

# create a new S3 bucet
createS3Bucket

# TODO: deploy Google project assets

# TODO: import collection data to Atlas (player email/profile/roster, 
#       snapshots of activity and offer collections)

# TODO: import Realm app
#importRealmApp
