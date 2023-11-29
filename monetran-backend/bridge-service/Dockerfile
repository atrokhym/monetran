#FROM ubuntu:18.04
FROM debian:buster-slim


RUN apt-get update
RUN apt-get -y install curl gettext-base


COPY install.sh /tmp/
RUN /tmp/install.sh

#RUN cat horizontestnetstellarorg.pem >> /etc/ssl/certs/ca-certificates.crt
#COPY bridge.cfg /etc/bridge.cfg
#COPY bridge /usr/local/bin/bridge
COPY bridge.cfg.template /etc/bridge.cfg.template
COPY run.sh /run.sh

WORKDIR /tmp

ENV BRIDGE_CONFIG_FILE=/etc/bridge.cfg
ENV BRIDGE_SKIP_DB_INIT=false

EXPOSE 8006

#ENTRYPOINT ["/run.sh"]
CMD ["/run.sh"]
#CMD ["/bin/sh"]

