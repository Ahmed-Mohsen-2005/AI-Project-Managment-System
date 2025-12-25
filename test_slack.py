import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.services.slack_integration_service import SlackService

print("🔍 Testing Slack Integration...")

try:
    slack = SlackService()
    print("✅ Service initialized")
    
    channels = slack.get_channels()
    print(f"\n📋 Found {len(channels)} channels:")
    
    for ch in channels:
        member_status = "✅ Member" if ch['is_member'] else "❌ Not a member"
        print(f"  - #{ch['name']} (ID: {ch['id']}) {member_status}")
    
    if len(channels) == 0:
        print("\n No channels found!")
        print("   Make sure to:")
        print("   1. Add 'channels:read' scope in Slack app")
        print("   2. Reinstall app to workspace")
        print("   3. Invite bot to channels: /invite @YourBot")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()