#!/bin/sh
# Installs git hooks for this repo. Run once after cloning:
#   sh scripts/setup-hooks.sh

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts/hooks"

cp "$SCRIPTS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

cp "$SCRIPTS_DIR/pre-push" "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-push"

echo "Git hooks installed (pre-commit: tsc, pre-push: tests)."
