#!/bin/sh
set -e

: "${ICECAST_SOURCE_PASSWORD:=hackme}"
: "${ICECAST_ADMIN_PASSWORD:=adminhackme}"
: "${ICECAST_RELAY_PASSWORD:=relayhackme}"
: "${ICECAST_HOSTNAME:=icecast}"

export ICECAST_SOURCE_PASSWORD ICECAST_ADMIN_PASSWORD ICECAST_RELAY_PASSWORD ICECAST_HOSTNAME

envsubst '${ICECAST_SOURCE_PASSWORD} ${ICECAST_ADMIN_PASSWORD} ${ICECAST_RELAY_PASSWORD} ${ICECAST_HOSTNAME}' \
    < /etc/icecast2/icecast.xml.template > /etc/icecast2/icecast.xml

mkdir -p /var/log/icecast2
chown -R icecast2:icecast /var/log/icecast2

exec icecast2 -c /etc/icecast2/icecast.xml
