FROM postgres:17-alpine

# Keep the initialization script inside the image. Rootless container engines
# cannot reliably read executable bind mounts from every host filesystem.
COPY --chmod=0755 init-databases.sh /docker-entrypoint-initdb.d/10-init-databases.sh
