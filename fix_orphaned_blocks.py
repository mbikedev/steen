#!/usr/bin/env python3
import re

# Read the file
with open('/Users/mbike/Documents/steen-main2/app/dashboard/toewijzingen/page.tsx', 'r') as f:
    lines = f.readlines()

# Track changes
modified_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Look for pattern of orphaned object properties
    # This would be a line with property: value followed by more properties and ending with });
    if re.match(r'\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*.*,\s*$', line):
        # Check if this looks like an orphaned block by looking ahead
        lookahead = 1
        orphaned_block = True
        
        # Look for the end of the block
        while i + lookahead < len(lines):
            next_line = lines[i + lookahead]
            
            if re.match(r'\s*}\);\s*$', next_line):
                # Found the end - this is an orphaned block
                # Skip all lines from current to the });
                print(f"Removing orphaned block from line {i+1} to {i+lookahead+1}")
                i += lookahead + 1
                orphaned_block = True
                break
            elif re.match(r'\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*.*[,}]\s*$', next_line):
                # Continue looking
                lookahead += 1
            else:
                # This doesn't look like an orphaned block
                orphaned_block = False
                break
        
        if not orphaned_block:
            modified_lines.append(line)
            i += 1
    else:
        modified_lines.append(line)
        i += 1

# Write back to file
with open('/Users/mbike/Documents/steen-main2/app/dashboard/toewijzingen/page.tsx', 'w') as f:
    f.writelines(modified_lines)

print("Fixed orphaned object literal blocks")
