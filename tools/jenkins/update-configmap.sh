envValue=$1
APP_NAME=$2
PEN_NAMESPACE=$3
COMMON_NAMESPACE=$4
APP_NAME_UPPER=${APP_NAME^^}

TZVALUE="America/Vancouver"
SOAM_KC_REALM_ID="master"
KCADM_FILE_BIN_FOLDER="/tmp/keycloak-9.0.3/bin"
SOAM_KC=soam-$envValue.apps.silver.devops.gov.bc.ca
NATS_URL="nats://nats.${COMMON_NAMESPACE}-${envValue}.svc.cluster.local:4222"

oc project "$COMMON_NAMESPACE-$envValue"
SOAM_KC_LOAD_USER_ADMIN=$(oc -o json get secret sso-admin-"${envValue}" | sed -n 's/.*"username": "\(.*\)"/\1/p' | base64 --decode)
SOAM_KC_LOAD_USER_PASS=$(oc -o json get secret sso-admin-"${envValue}" | sed -n 's/.*"password": "\(.*\)",/\1/p' | base64 --decode)

oc project "$PEN_NAMESPACE-$envValue"

$KCADM_FILE_BIN_FOLDER/kcadm.sh config credentials --server "https://$SOAM_KC/auth" --realm $SOAM_KC_REALM_ID --user "$SOAM_KC_LOAD_USER_ADMIN" --password "$SOAM_KC_LOAD_USER_PASS"

#GENERATE_PEN_REPORT
$KCADM_FILE_BIN_FOLDER/kcadm.sh create client-scopes -r $SOAM_KC_REALM_ID --body "{\"description\": \"Generate reports related to PEN\",\"id\": \"GENERATE_PEN_REPORT\",\"name\": \"GENERATE_PEN_REPORT\",\"protocol\": \"openid-connect\",\"attributes\" : {\"include.in.token.scope\" : \"true\",\"display.on.consent.screen\" : \"false\"}}"

###########################################################
#Setup for student-admin-flb-sc-config-map
###########################################################
CDOGS_CLIENT_ID=$(oc -o json get configmaps "${APP_NAME}-${envValue}"-setup-config | sed -n "s/.*\"CDOGS_CLIENT_ID\": \"\(.*\)\",/\1/p")
CDOGS_CLIENT_SECRET=$(oc -o json get configmaps "${APP_NAME}-${envValue}"-setup-config | sed -n "s/.*\"CDOGS_CLIENT_SECRET\": \"\(.*\)\",/\1/p")
CDOGS_TOKEN_ENDPOINT=$(oc -o json get configmaps "${APP_NAME}-${envValue}"-setup-config | sed -n "s/.*\"CDOGS_TOKEN_ENDPOINT\": \"\(.*\)\",/\1/p")
CDOGS_BASE_URL=$(oc -o json get configmaps "${APP_NAME}-${envValue}"-setup-config | sed -n "s/.*\"CDOGS_BASE_URL\": \"\(.*\)\",/\1/p")
SPLUNK_TOKEN=$(oc -o json get configmaps "${APP_NAME}-${envValue}-setup-config" | sed -n "s/.*\"SPLUNK_TOKEN_${APP_NAME_UPPER}\": \"\(.*\)\"/\1/p")

SPLUNK_URL="gww.splunk.educ.gov.bc.ca"
FLB_CONFIG="[SERVICE]
   Flush        1
   Daemon       Off
   Log_Level    debug
   HTTP_Server   On
   HTTP_Listen   0.0.0.0
   HTTP_Port     2020
[INPUT]
   Name   tail
   Path   /mnt/log/*
   Mem_Buf_Limit 20MB
[FILTER]
   Name record_modifier
   Match *
   Record hostname \${HOSTNAME}
[OUTPUT]
   Name   stdout
   Match  *
[OUTPUT]
   Name  splunk
   Match *
   Host  $SPLUNK_URL
   Port  443
   TLS         On
   TLS.Verify  Off
   Message_Key $APP_NAME
   Splunk_Token $SPLUNK_TOKEN
"

echo Creating config map "$APP_NAME"-config-map
oc create -n "$PEN_NAMESPACE"-"$envValue" configmap "$APP_NAME"-config-map --from-literal=TZ=$TZVALUE --from-literal=JWKS_URL="https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID/protocol/openid-connect/certs" --from-literal=LOG_LEVEL=info --from-literal=REDIS_HOST=redis --from-literal=REDIS_PORT=6379 --from-literal=BODY_LIMIT="50MB"  --from-literal=NATS_URL="$NATS_URL"  --from-literal=CDOGS_TOKEN_ENDPOINT="$CDOGS_TOKEN_ENDPOINT" --from-literal=CDOGS_CLIENT_SECRET="$CDOGS_CLIENT_SECRET" --from-literal=CDOGS_CLIENT_ID="$CDOGS_CLIENT_ID" --from-literal=CDOGS_BASE_URL="$CDOGS_BASE_URL" --from-literal=NATS_MAX_RECONNECT=60  --dry-run -o yaml | oc apply -f -

echo
echo Setting environment variables for "$APP_NAME-main" application
oc project "$PEN_NAMESPACE-$envValue"
oc set env --from=configmap/"$APP_NAME"-config-map dc/"$APP_NAME-main"

echo Creating config map "$APP_NAME-flb-sc-config-map"
oc create -n "$PEN_NAMESPACE-$envValue" configmap "$APP_NAME"-flb-sc-config-map --from-literal=fluent-bit.conf="$FLB_CONFIG" --dry-run -o yaml | oc apply -f -
