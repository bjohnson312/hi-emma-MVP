#!/bin/bash

# Update all frontend files to use the new authenticated backend client
find /frontend -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/client.ts" ! -path "*/lib/backend-client.ts" ! -path "*/lib/clerk-client.ts" -exec sed -i 's|import backend from "~backend/client"|import backend from "@/lib/backend-client"|g' {} +

echo "Updated all backend imports to use authenticated client"
