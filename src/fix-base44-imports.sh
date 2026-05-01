#!/bin/bash
# Fix all base44 imports in one go

find src -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) | while read file; do
  if grep -q "from '@/api/base44Client'" "$file"; then
    sed -i "s|import { base44 } from '@/api/base44Client';|// TODO: Replace with API service|g" "$file"
    sed -i "s|from '@/api/base44Client'||g" "$file"
    echo "Fixed: $file"
  fi
  
  if grep -q "base44\." "$file"; then
    echo "⚠️  Still has base44 references: $file"
  fi
done

echo "✅ Done!"