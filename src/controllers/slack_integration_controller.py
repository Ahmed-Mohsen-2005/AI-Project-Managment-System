from flask import Blueprint, jsonify, request
from services.slack_integration_service import SlackService
from services.ai_chat_service import AIChatService
import hmac
import hashlib
import time
import os

slack_bp = Blueprint("slack", __name__, url_prefix="/api/v1/slack")

def verify_slack_signature(request):
    """Verify that the request came from Slack"""
    slack_signing_secret = os.getenv('SLACK_SIGNING_SECRET')
    if not slack_signing_secret:
        return False
    
    timestamp = request.headers.get('X-Slack-Request-Timestamp')
    signature = request.headers.get('X-Slack-Signature')
    
    if not timestamp or not signature:
        return False
    
    # Check if timestamp is within 5 minutes
    current_time = int(time.time())
    if abs(current_time - int(timestamp)) > 60 * 5:
        return False
    
    # Create the basestring
    body = request.get_data().decode('utf-8')
    basestring = f"v0:{timestamp}:{body}"
    
    # Create the expected signature
    expected_signature = 'v0=' + hmac.new(
        slack_signing_secret.encode('utf-8'),
        basestring.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures using hmac.compare_digest for timing attack protection
    return hmac.compare_digest(expected_signature, signature)

@slack_bp.route("/channels", methods=["GET"])
def get_channels():
    """Get all available Slack channels"""
    try:
        slack_service = SlackService()
        channels = slack_service.get_channels()
        return jsonify(channels), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@slack_bp.route("/messages/<channel_id>", methods=["GET"])
def get_messages(channel_id):
    """Get recent messages from a specific channel"""
    try:
        limit = request.args.get('limit', 50, type=int)
        slack_service = SlackService()
        messages = slack_service.get_channel_messages(channel_id, limit)
        return jsonify(messages), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@slack_bp.route("/send", methods=["POST"])
def send_message():
    """Send a message to a Slack channel"""
    try:
        data = request.get_json()
        
        channel = data.get('channel')
        text = data.get('text')
        user_name = data.get('user_name', 'AIPMS User')
        
        if not channel or not text:
            return jsonify({"error": "Channel and text are required"}), 400
        
        slack_service = SlackService()
        result = slack_service.send_message(channel, text, user_name)
        
        if result.get('success'):
            return jsonify({
                "message": "Message sent successfully",
                "ts": result.get('ts')
            }), 201
        else:
            return jsonify({"error": result.get('error')}), 500
            
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@slack_bp.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get Slack user information"""
    try:
        slack_service = SlackService()
        user_info = slack_service.get_user_info(user_id)
        return jsonify(user_info), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@slack_bp.route("/summarize-chat", methods=["POST"])
def summarize_chat():
    """Generate AI summary of chat messages"""
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        ai_service = AIChatService()
        summary = ai_service.summarize_chat(messages)
        sentiment = ai_service.analyze_sentiment(messages)
        
        return jsonify({
            "summary": summary,
            "sentiment": sentiment
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Summarize chat failed: {e}")
        return jsonify({"error": str(e)}), 500
    

@slack_bp.route("/events", methods=["POST"])
def slack_events():
    """Handle Slack events webhook"""
    # Verify Slack signature for security
    if not verify_slack_signature(request):
        return jsonify({"error": "Invalid signature"}), 403
    
    data = request.get_json()

    # 1. Slack URL verification
    if "challenge" in data:
        return jsonify({"challenge": data["challenge"]})

    event = data.get("event", {})

    # 2. Ignore bot messages
    if event.get("type") == "message" and "bot_id" not in event:
        text = event.get("text")
        user_id = event.get("user")
        channel_id = event.get("channel")
        ts = event.get("ts")

        print("[SLACK EVENT]", channel_id, user_id, text)

        # TODO: Save to DB
        # TODO: Trigger AI analysis

    return jsonify({"ok": True})