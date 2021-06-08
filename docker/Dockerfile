FROM amd64/debian:stable-slim

RUN addgroup --gid 1000 corenode
RUN adduser --uid 1000 --ingroup corenode --shell /bin/bash --disabled-password corenode

COPY ./build/linux-x64/corenode /bin/corenode
COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod -R 775 /bin/corenode
RUN chmod -R 755 /usr/local/bin/docker-entrypoint.sh

USER corenode

RUN corenode version

ENTRYPOINT ["docker-entrypoint.sh"]
