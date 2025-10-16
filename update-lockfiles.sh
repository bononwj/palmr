#!/bin/bash

# Script to update pnpm lockfiles to be compatible with pnpm 10.6.0

echo "Updating pnpm lockfiles for pnpm 10.6.0 compatibility..."

# Update server lockfile
echo "Updating server lockfile..."
cd apps/server
rm -f pnpm-lock.yaml
pnpm install
cd ../..

# Update web lockfile
echo "Updating web lockfile..."
cd apps/web
rm -f pnpm-lock.yaml
pnpm install
cd ../..

# Update docs lockfile
echo "Updating docs lockfile..."
cd apps/docs
rm -f pnpm-lock.yaml
pnpm install
cd ../..

echo "All lockfiles updated successfully!"
echo "Please commit the updated pnpm-lock.yaml files."

