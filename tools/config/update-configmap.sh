envValue=$1
APP_NAME=$2
PEN_NAMESPACE=$3
COMMON_NAMESPACE=$4
SPLUNK_TOKEN=$5
CDOGS_CLIENT_ID=$6
CDOGS_CLIENT_SECRET=$7
CDOGS_TOKEN_ENDPOINT=$8
CDOGS_BASE_URL=$9

TZVALUE="America/Vancouver"
SOAM_KC_REALM_ID="master"
SOAM_KC=soam-$envValue.apps.silver.devops.gov.bc.ca
NATS_URL="nats://nats.${COMMON_NAMESPACE}-${envValue}.svc.cluster.local:4222"

SOAM_KC_LOAD_USER_ADMIN=$(oc -n "$COMMON_NAMESPACE-$envValue" -o json get secret sso-admin-"${envValue}" | sed -n 's/.*"username": "\(.*\)"/\1/p' | base64 --decode)
SOAM_KC_LOAD_USER_PASS=$(oc -n "$COMMON_NAMESPACE-$envValue" -o json get secret sso-admin-"${envValue}" | sed -n 's/.*"password": "\(.*\)",/\1/p' | base64 --decode)

echo Fetching SOAM token
TKN=$(curl -s \
  -d "client_id=admin-cli" \
  -d "username=$SOAM_KC_LOAD_USER_ADMIN" \
  -d "password=$SOAM_KC_LOAD_USER_PASS" \
  -d "grant_type=password" \
  "https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID/protocol/openid-connect/token" | jq -r '.access_token')

echo
echo Writing scope GENERATE_PEN_REPORT
curl -sX POST "https://$SOAM_KC/auth/admin/realms/$SOAM_KC_REALM_ID/client-scopes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TKN" \
  -d "{\"description\": \"Generate reports related to PEN\",\"id\": \"GENERATE_PEN_REPORT\",\"name\": \"GENERATE_PEN_REPORT\",\"protocol\": \"openid-connect\",\"attributes\" : {\"include.in.token.scope\" : \"true\",\"display.on.consent.screen\" : \"false\"}}"

###########################################################
#Setup for student-admin-flb-sc-config-map
###########################################################

SPLUNK_URL="gww.splunk.educ.gov.bc.ca"
FLB_CONFIG="[SERVICE]
   Flush        1
   Daemon       Off
   Log_Level    debug
   HTTP_Server   On
   HTTP_Listen   0.0.0.0
   HTTP_Port     2020
   Parsers_File parsers.conf
[INPUT]
   Name   tail
   Path   /mnt/log/*
   Exclude_Path *.gz,*.zip
   Parser docker
   Mem_Buf_Limit 20MB
   Buffer_Chunk_Size 5MB
   Buffer_Max_Size 5MB
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
PARSER_CONFIG="
[PARSER]
    Name        docker
    Format      json
"


echo Creating config map "$APP_NAME"-config-map
oc create -n "$PEN_NAMESPACE"-"$envValue" configmap "$APP_NAME"-config-map --from-literal=TZ=$TZVALUE --from-literal=JWKS_URL="https://$SOAM_KC/auth/realms/$SOAM_KC_REALM_ID/protocol/openid-connect/certs" --from-literal=LOG_LEVEL=info --from-literal=REDIS_HOST=redis --from-literal=REDIS_PORT=6379 --from-literal=BODY_LIMIT="50MB"  --from-literal=NATS_URL="$NATS_URL"  --from-literal=CDOGS_TOKEN_ENDPOINT="$CDOGS_TOKEN_ENDPOINT" --from-literal=CDOGS_CLIENT_SECRET="$CDOGS_CLIENT_SECRET" --from-literal=CDOGS_CLIENT_ID="$CDOGS_CLIENT_ID" --from-literal=CDOGS_BASE_URL="$CDOGS_BASE_URL" --from-literal=NATS_MAX_RECONNECT=60  --dry-run -o yaml | oc apply -f -

echo
echo Setting environment variables for "$APP_NAME-main" application
oc -n "$PEN_NAMESPACE-$envValue" set env --from=configmap/"$APP_NAME"-config-map deployment/"$APP_NAME-main"

echo Creating config map "$APP_NAME-flb-sc-config-map"
oc create -n "$PEN_NAMESPACE-$envValue" configmap "$APP_NAME"-flb-sc-config-map --from-literal=fluent-bit.conf="$FLB_CONFIG" --from-literal=parsers.conf="$PARSER_CONFIG" --dry-run -o yaml | oc apply -f -
