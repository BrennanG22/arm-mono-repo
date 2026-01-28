#!/usr/bin/env bash
set -e

UPSTREAM_VERSION="0.1.0"
PACKAGE_NAME="armController"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script directory: $SCRIPT_DIR"
ROOT_DIR="$SCRIPT_DIR"

SRC_APP="$ROOT_DIR/app"
SRC_DEBIAN="$ROOT_DIR/build/build-files/DEBIAN"
SRC_SERVICE="$ROOT_DIR/build/build-files/armController.service"
SRC_REQ="$ROOT_DIR/build/build-files/requirements.txt"

BUILD_SUBDIR="build/armController-deb"
DEB_ROOT="$ROOT_DIR/$BUILD_SUBDIR"
OUTPUT_DIR="$ROOT_DIR/build"

IS_WSL=0
if grep -qi microsoft /proc/version; then
    IS_WSL=1
fi

if [ $IS_WSL -eq 1 ] && [[ "$ROOT_DIR" == /mnt/* ]]; then
    echo "WSL detected on Windows-mounted drive. Moving build to native FS."
    WSL_HOME="/home/$USER"
    DEB_ROOT="$WSL_HOME/armController-deb"
    echo "Build folder in WSL native FS: $DEB_ROOT"
fi

rm -rf "$DEB_ROOT"
mkdir -p "$DEB_ROOT/DEBIAN"
mkdir -p "$DEB_ROOT/opt/armController/app"
mkdir -p "$DEB_ROOT/opt/armController/robot-frontend-v2"
mkdir -p "$DEB_ROOT/etc/systemd/system"

rsync -av --exclude='__pycache__/' --exclude='*.pyc' "$SRC_APP/" "$DEB_ROOT/opt/armController/app/"
cp -r "$ROOT_DIR/robot-frontend-v2/dist" "$DEB_ROOT/opt/armController/robot-frontend-v2"
cp -r "$SRC_DEBIAN/"* "$DEB_ROOT/DEBIAN/"
cp "$SRC_SERVICE" "$DEB_ROOT/etc/systemd/system/armController.service"
cp "$SRC_REQ" "$DEB_ROOT/opt/armController"

chmod 755 "$DEB_ROOT/DEBIAN/postinst" "$DEB_ROOT/DEBIAN/prerm" "$DEB_ROOT/DEBIAN/postrm"
chmod 644 "$DEB_ROOT/DEBIAN/control"
chmod 644 "$DEB_ROOT/etc/systemd/system/armController.service"

chmod 755 "$DEB_ROOT/DEBIAN"
chmod 755 "$DEB_ROOT/etc" "$DEB_ROOT/etc/systemd" "$DEB_ROOT/etc/systemd/system"
chmod 755 "$DEB_ROOT/opt" "$DEB_ROOT/opt/armController" "$DEB_ROOT/opt/armController/app"
find "$DEB_ROOT/opt/armController/app" -type d -exec chmod 755 {} \;
find "$DEB_ROOT/opt/armController/app" -type f -exec chmod 644 {} \;

dos2unix "$DEB_ROOT/DEBIAN/postinst"
dos2unix "$DEB_ROOT/DEBIAN/prerm"

REV_FILE="$OUTPUT_DIR/debian_revision.txt"
PREV_VERSION_FILE="$OUTPUT_DIR/prev_upstream_version.txt"

if [ -f "$PREV_VERSION_FILE" ]; then
    PREV_VERSION=$(cat "$PREV_VERSION_FILE")
    if [ "$PREV_VERSION" != "$UPSTREAM_VERSION" ]; then
        DEBIAN_REV=1
    fi
fi

if [ -f "$REV_FILE" ]; then
    DEBIAN_REV=$(cat "$REV_FILE")
    DEBIAN_REV=$((DEBIAN_REV + 1))
else
    DEBIAN_REV=1
fi

echo "$DEBIAN_REV" > "$REV_FILE"
echo "$UPSTREAM_VERSION" > "$PREV_VERSION_FILE"

DEB_NAME="${PACKAGE_NAME}_${UPSTREAM_VERSION}-${DEBIAN_REV}.deb"
OUTPUT_DEB="$OUTPUT_DIR/$DEB_NAME"
mkdir -p "$OUTPUT_DIR"

CONTROL_FILE="$DEB_ROOT/DEBIAN/control"

if [ -f "$CONTROL_FILE" ]; then
    sed -i "s/^Version:.*$/Version: ${UPSTREAM_VERSION}-${DEBIAN_REV}/" "$CONTROL_FILE"
    echo "Updated control file version to: ${UPSTREAM_VERSION}-${DEBIAN_REV}"
else
    echo "Warning: DEBIAN/control file not found!"
fi


dpkg-deb --build "$DEB_ROOT" "$OUTPUT_DEB"

echo
echo "Deb package created at: $OUTPUT_DEB"