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

# Extract schema for each part type
for part_type in $(jq -r '.properties.part.type' part_updated_events.jsonl | sort | uniq); do
    echo "## Part Type: \`$part_type\`"
    echo ""
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"$part_type\") | .properties.part" part_updated_events.jsonl | head -1 | jq '.'
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

# Extract schema for each tool type
for tool_name in $(jq -r 'select(.properties.part.type == "tool") | .properties.part.tool' part_updated_events.jsonl | sort | uniq); do
    echo "## Tool: \`$tool_name\`"
    echo ""
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"tool\" and .properties.part.tool == \"$tool_name\") | .properties.part" part_updated_events.jsonl | head -1 | jq '.'
    echo "\`\`\`"
    echo ""
done
