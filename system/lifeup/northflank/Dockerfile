FROM node:22-bookworm-slim

ARG LIFEUP_SDK_REF=f057ea4fcd2c6c6f38a51d092c29026f344b7c4b

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Ayagikei/LifeUp-SDK.git /opt/lifeup-sdk \
    && cd /opt/lifeup-sdk \
    && git checkout "$LIFEUP_SDK_REF" \
    && npm --prefix mcp ci \
    && npm --prefix mcp run build \
    && npm --prefix mcp install --no-save @modelcontextprotocol/express@^2 @modelcontextprotocol/node@^2 express@^5

COPY system/lifeup/northflank/server.mjs /opt/lifeup-sdk/mcp/remote-server.mjs

WORKDIR /opt/lifeup-sdk/mcp
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "remote-server.mjs"]
