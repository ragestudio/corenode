FROM node:16-alpine

RUN addgroup -g 1001 corenode
RUN adduser -u 1001 -G corenode -s /bin/bash -D corenode

COPY ./build/alpine-x64/corenode /bin/corenode
COPY ./docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod -R 775 /bin/corenode
RUN chmod -R 755 /usr/local/bin/docker-entrypoint.sh

USER corenode

RUN corenode version

ENTRYPOINT ["docker-entrypoint.sh"]