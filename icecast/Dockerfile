FROM debian:bookworm-slim

RUN echo "icecast2 icecast2/icecast-setup boolean false" | debconf-set-selections \
    && apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        icecast2 \
        gettext-base \
    && rm -rf /var/lib/apt/lists/*

COPY icecast.xml.template /etc/icecast2/icecast.xml.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
