#!/bin/bash

# Update all frontend files to use the authenticated backend client wrapper
find /frontend -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/client.ts" \
  ! -path "*/lib/backend-client.ts" \
  ! -path "*/lib/clerk-client.ts" \
  ! -path "*/node_modules/*" \
  -exec sed -i 's|import backend from "~backend/client"|import backend from "@/lib/backend-client"|g' {} +

echo "✅ Updated all backend imports to use authenticated wrapper"
