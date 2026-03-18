
import sys

filepath = r'e:\DSMS\frontend\src\components\Dashboard.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
inserted = False
for i, line in enumerate(lines):
    # Search for the button that is missing its Box parent
    if i > 880 and i < 900 and '<Button' in line and 'variant="outlined"' in lines[i+1] and not inserted:
        indent = line[:line.find('<')]
        # This line is indented by 41 spaces, we want the Box to be at 39 spaces (one level up)
        box_indent = indent[:-2] if len(indent) >= 2 else indent
        new_lines.append(f"{box_indent}<Box sx={{{{ display: 'flex', gap: 1, ml: 'auto' }}}}>\n")
        new_lines.append(line)
        inserted = True
    else:
        new_lines.append(line)

if inserted:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully inserted Box wrapper.")
else:
    print("Failed to find insertion point.")
