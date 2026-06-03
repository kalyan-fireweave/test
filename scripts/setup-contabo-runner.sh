#!/usr/bin/env bash
# Run on Contabo as root (or a dedicated user) after generating a fresh registration token:
# GitHub → kalyan-fireweave/test → Settings → Actions → Runners → New self-hosted runner
set -euo pipefail

RUNNER_VERSION="${RUNNER_VERSION:-2.334.0}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner-test}"
REPO_URL="${REPO_URL:-https://github.com/kalyan-fireweave/test}"
RUNNER_NAME="${RUNNER_NAME:-contabo-test-$(hostname -s)}"

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "Set RUNNER_TOKEN to the one-time registration token from GitHub."
  echo "Example: RUNNER_TOKEN=XXXX ./setup-contabo-runner.sh"
  exit 1
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64)
    PKG="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
    SHA256="048024cd2c848eb6f14d5646d56c13a4def2ae7ee3ad12122bee960c56f3d271"
    ;;
  aarch64|arm64)
    PKG="actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz"
    SHA256="f44255bd3e80160eb25f71bc83d06ea025f6908748807a584687b3184759f7e4"
    ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f "$PKG" ]]; then
  curl -fsSL -o "$PKG" "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${PKG}"
fi

echo "${SHA256}  ${PKG}" | shasum -a 256 -c -
tar xzf "./${PKG}"

# Required when configuring as root (e.g. Contabo default login)
export RUNNER_ALLOW_RUNASROOT=1

./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "self-hosted,Linux,X64,contabo" \
  --unattended \
  --replace

./svc.sh install
./svc.sh start
./svc.sh status

echo "Runner installed in ${RUNNER_DIR} as ${RUNNER_NAME}"
