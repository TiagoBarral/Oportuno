#!/bin/sh
# Installs git hooks for this repo. Run once after cloning:
#   sh scripts/setup-hooks.sh

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts/hooks"

cp "$SCRIPTS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed."
