#!/usr/bin/env bash
# One-time setup of a Debian 12 or 13 machine as a build host: installs Docker Engine, the
# Compose plugin and rsync, so scripts/remote.sh can run things there.
#
#   scp scripts/server-setup.sh HOST:/tmp/ && ssh -t HOST bash /tmp/server-setup.sh
#
# It uses sudo, which may ask for your password, so it needs a terminal (the -t); piping the
# script into ssh would give sudo nowhere to ask. The account you connect as needs sudo rights.
# Safe to run again: packages already installed are left alone and the Docker repository entry
# is simply rewritten.
set -euo pipefail

if [ ! -r /etc/os-release ]; then
  echo "This script is for Debian (no /etc/os-release found)." >&2
  exit 1
fi
. /etc/os-release
if [ "${ID:-}" != "debian" ] || [ -z "${VERSION_CODENAME:-}" ]; then
  echo "This script is for Debian 12 or 13; found ${PRETTY_NAME:-an unknown system}." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y rsync ca-certificates curl

# Docker's own apt repository and signing key.
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $VERSION_CODENAME stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Let this user run docker without sudo.
sudo usermod -aG docker "$USER"

echo
echo "Done. Log out and back in (so the docker group applies), then check that"
echo "  docker compose version"
echo "works."
