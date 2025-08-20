#!/bin/bash

echo "# Part Types and Tool Call Schemas"
echo ""
echo "Generated from part_updated_events.jsonl"
echo ""

echo "## Part Types Overview"
echo ""
echo "| Part Type | Count | Description |"
echo "|-----------|--------|-------------|"
jq -r '.properties.part.type' part_updated_events.jsonl | sort | uniq -c | while read count type; do
    echo "| $type | $count | |"
done
echo ""

# Extract one example for each part type
echo "## Part Type Examples"
echo ""

for part_type in text tool patch step-start step-finish; do
    echo "### Part Type: \`$part_type\`"
    echo ""
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"$part_type\")" part_updated_events.jsonl | head -1 | jq '.properties.part'
    echo "\`\`\`"
    echo ""
done

echo "## Tool Types Overview"
echo ""
echo "| Tool Name | Count |"
echo "|-----------|-------|"
jq -r 'select(.properties.part.type == "tool") | .properties.part.tool' part_updated_events.jsonl | sort | uniq -c | while read count tool; do
    echo "| $tool | $count |"
done
echo ""

# Extract one example for each tool type
echo "## Tool Examples"
echo ""

for tool_name in bash edit glob grep list read task todowrite webfetch write; do
    echo "### Tool: \`$tool_name\`"
    echo ""
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"tool\" and .properties.part.tool == \"$tool_name\")" part_updated_events.jsonl | head -1 | jq '.properties.part'
    echo "\`\`\`"
    echo ""
done
