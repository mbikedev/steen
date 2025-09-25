#!/usr/bin/env python3
import re

# Read the file
with open('/Users/mbike/Documents/steen-main2/app/dashboard/toewijzingen/page.tsx', 'r') as f:
    content = f.read()

# Pattern to find orphaned object literals that are remnants of console.log calls
# These are patterns like:
#   someProperty: value,
#   anotherProperty: value
# });

# Remove orphaned object literal blocks
patterns_to_remove = [
    # Pattern 1: Multiple orphaned properties followed by });
    r'\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*[^,}]+,\s*(?:\n\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*[^,}]+[,\s]*)*\s*}\);\s*',
    
    # Pattern 2: Single orphaned properties
    r'\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*[^,}]+,?\s*}\);\s*(?=\n\s*(?:if|const|let|var|return|function|\}|//|/\*))',
]

for pattern in patterns_to_remove:
    content = re.sub(pattern, '\n', content, flags=re.MULTILINE)

# Clean up extra empty lines
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

# Write back to file
with open('/Users/mbike/Documents/steen-main2/app/dashboard/toewijzingen/page.tsx', 'w') as f:
    f.write(content)

print("Fixed orphaned code blocks")
