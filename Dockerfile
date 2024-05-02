# This isn't a particularly elegant way to get the anki sync server running, but hey it works.
# If you wanna update it, don't let me stop you :)
FROM ubuntu:mantic
LABEL authors="sirberg"
WORKDIR /app
RUN DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install locales libgssapi-krb5-2 libasound2 libxdamage-dev libxkbcommon-tools libxcb-xinerama0 libxcb-cursor0 libnss3 wget xdg-utils tar zstd -y
RUN wget https://github.com/ankitects/anki/releases/download/24.04.1/anki-24.04.1-linux-qt6.tar.zst

RUN tar -xvf ./anki-24.04.1-linux-qt6.tar.zst

RUN cd anki-24.04.1-linux-qt6 && ./install.sh
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
ENV SYNC_BASE /ankiSync
RUN mkdir /ankiSync
ARG SYNC_USER1
EXPOSE 8080

CMD ["anki", "--syncserver"]
