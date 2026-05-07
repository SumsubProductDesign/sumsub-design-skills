#!/bin/bash
# sumsub-design plugin — block mcp__figma__get_screenshot
#
# Per user rule (feedback_no_screenshots_ever.md): screenshots are forbidden,
# even for UX review. Agents have repeatedly ignored the text rule by
# rationalizing "I just need to verify". This hook makes the ban structural.
#
# Override: if user explicitly authorizes a screenshot in this session, set
# SUMSUB_ALLOW_SCREENSHOT=1 in the environment before invoking.

if [ "$SUMSUB_ALLOW_SCREENSHOT" = "1" ]; then
  exit 0
fi

cat >&2 <<'EOF'
🚫 mcp__figma__get_screenshot is BLOCKED for sumsub-design plugin.

Per user rule (feedback_no_screenshots_ever.md), screenshots are forbidden in
this workflow — even for verification. Use mcp__figma__use_figma to inspect the
tree programmatically (figma.getNodeByIdAsync + recursive walk + characters /
componentProperties / fills inspection).

If the user has EXPLICITLY authorized a screenshot in this turn (e.g. "send me
a screenshot of X to share with the team"), the user can re-run with
SUMSUB_ALLOW_SCREENSHOT=1 set in the environment. Otherwise, this is a hard
block.
EOF

exit 2
