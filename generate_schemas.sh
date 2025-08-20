#!/bin/bash

FILE="part_updated_events_compact.jsonl"

echo "# Part Types and Tool Call Schemas"
echo ""
echo "Generated from part_updated_events.jsonl on $(date)"
echo ""

echo "## Part Types Overview"
echo ""
echo "| Part Type | Count | Description |"
echo "|-----------|--------|-------------|"
jq -r '.properties.part.type' $FILE | sort | uniq -c | while read count type; do
    case $type in
        text) desc="Text content from assistant" ;;
        tool) desc="Tool invocation/call" ;;
        patch) desc="Code patch/diff" ;;
        step-start) desc="Beginning of processing step" ;;
        step-finish) desc="End of processing step" ;;
        *) desc="Unknown type" ;;
    esac
    echo "| $type | $count | $desc |"
done
echo ""

# Extract schema for each part type
for part_type in text tool patch step-start step-finish; do
    echo "### Part Type: \`$part_type\`"
    echo ""
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"$part_type\") | .properties.part" $FILE | head -1
    echo "\`\`\`"
    echo ""
done

echo "## Tool Types Overview"
echo ""
echo "| Tool Name | Count | Description |"
echo "|-----------|-------|-------------|"
jq -r 'select(.properties.part.type == "tool") | .properties.part.tool' $FILE | sort | uniq -c | while read count tool; do
    case $tool in
        bash) desc="Execute bash commands" ;;
        read) desc="Read file contents" ;;
        write) desc="Write file contents" ;;
        edit) desc="Edit existing files" ;;
        list) desc="List directory contents" ;;
        glob) desc="Find files by pattern" ;;
        grep) desc="Search file contents" ;;
        todowrite) desc="Manage todo lists" ;;
        task) desc="Launch sub-agents" ;;
        webfetch) desc="Fetch web content" ;;
        *) desc="Unknown tool" ;;
    esac
    echo "| $tool | $count | $desc |"
done
echo ""

# Extract schema for each tool type
echo "## Tool Examples"
echo ""
for tool_name in $(jq -r 'select(.properties.part.type == "tool") | .properties.part.tool' $FILE | sort | uniq); do
    echo "### Tool: \`$tool_name\`"
    echo ""
    
    # Get different states if available
    echo "**Pending State:**"
    echo "\`\`\`json"
    jq "select(.properties.part.type == \"tool\" and .properties.part.tool == \"$tool_name\" and .properties.part.state.status == \"pending\") | .properties.part" $FILE | head -1
    echo "\`\`\`"
    echo ""
    
    # Try to get running/success state
    success_example=$(jq -r "select(.properties.part.type == \"tool\" and .properties.part.tool == \"$tool_name\" and .properties.part.state.status == \"success\") | .properties.part" $FILE | head -1)
    if [ "$success_example" != "" ]; then
        echo "**Success State:**"
        echo "\`\`\`json"
        echo "$success_example"
        echo "\`\`\`"
        echo ""
    fi
done
