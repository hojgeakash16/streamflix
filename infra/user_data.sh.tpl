#!/bin/bash
# Runs once when an app server boots: installs Node, pulls the code, starts the API as a service.
set -e

dnf install -y git
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

git clone ${repo_url} /opt/app
cd /opt/app/${backend_path}
npm install --omit=dev

cat > /etc/streamflix.env <<EOF
PORT=3000
DB_HOST=${db_host}
DB_PORT=5432
DB_USER=streamflix
DB_PASSWORD=${db_password}
DB_NAME=streamflix
DB_SSL=true
JWT_SECRET=${jwt_secret}
EOF
chmod 600 /etc/streamflix.env

cat > /etc/systemd/system/streamflix.service <<EOF
[Unit]
Description=StreamFlix API
After=network.target

[Service]
WorkingDirectory=/opt/app/${backend_path}
EnvironmentFile=/etc/streamflix.env
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now streamflix
