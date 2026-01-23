#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
DEB_ROOT="$ROOT_DIR/build/armController-deb"

rm -rf "$  "

mkdir -p "$DEB_ROOT/DEBIAN"
mkdir -p "$DEB_ROOT/opt/armController/app"
mkdir -p "$DEB_ROOT/etc/systemd/system"

cp -r "$ROOT_DIR/app" "$DEB_ROOT/opt/armController"
cp -r "$ROOT_DIR/build/build-files/DEBIAN" "$DEB_ROOT"
cp "$ROOT_DIR/build/build-files/armController.service" "$DEB_ROOT/etc/systemd/system/armController.service"


chmod 755 "$DEB_ROOT/DEBIAN/postinst" "$DEB_ROOT/DEBIAN/prerm"
chmod 644 "$DEB_ROOT/etc/systemd/system/armController.service"


