import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import time

class SlackService:
    """Service for Slack integration with rate limit handling"""
    
    def __init__(self, integration_id=None):
        """
        Initialize Slack service
        
        Args:
            integration_id: Optional integration ID to load from database
        """
        self.integration_id = integration_id
        self._user_cache = {}
        self._users_list_cache = None
        self._users_list_cache_time = 0
        self._cache_ttl = 3600  # Cache users list for 1 hour
        
        if integration_id:
            # Load from database (placeholder for future implementation)
            self.client = WebClient(token=os.getenv('SLACK_BOT_TOKEN'))
            self.signing_secret = os.getenv('SLACK_SIGNING_SECRET')
        else:
            # Use environment variables
            bot_token = os.getenv('SLACK_BOT_TOKEN')
            if not bot_token:
                raise ValueError("SLACK_BOT_TOKEN environment variable is not set. Please configure it in your .env file.")
            self.client = WebClient(token=bot_token)
            self.signing_secret = os.getenv('SLACK_SIGNING_SECRET')
        
        self.default_channel = os.getenv('SLACK_DEFAULT_CHANNEL', '#general')
    
    def send_message(self, channel, text, user_name=None):
        """
        Send a message to a Slack channel
        
        Args:
            channel: Channel ID or name (e.g., '#general' or 'C1234567890')
            text: Message text
            user_name: Optional username to display
        
        Returns:
            dict: Response from Slack API
        """
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=text,
                username=user_name or "AIPMS Bot"
            )
            return {
                "success": True,
                "ts": response['ts'],  # Timestamp/Message ID
                "channel": response['channel']
            }
        except SlackApiError as e:
            print(f"[ERROR] Slack send message failed: {e.response['error']}")
            return {
                "success": False,
                "error": e.response['error']
            }
    
    def get_channel_messages(self, channel, limit=50):
        """
        Get recent messages from a channel
        
        Args:
            channel: Channel ID or name
            limit: Number of messages to retrieve
        
        Returns:
            list: List of messages
        """
        try:
            response = self.client.conversations_history(
                channel=channel,
                limit=limit
            )
            
            messages = []
            user_ids = set()
            
            # Collect all unique user IDs first
            for msg in response['messages']:
                user_id = msg.get('user')
                if user_id:
                    user_ids.add(user_id)
            
            # Load all users once and cache them
            self._preload_users_cache()
            
            # Build messages with user info from cache
            for msg in response['messages']:
                user_id = msg.get('user', '')
                user_info = self._get_user_from_cache(user_id)
                
                messages.append({
                    'text': msg.get('text', ''),
                    'user': user_info.get('real_name', 'Unknown'),
                    'timestamp': msg.get('ts', ''),
                    'time': self._format_timestamp(msg.get('ts', '')),
                })
            
            return messages
        except SlackApiError as e:
            print(f"[ERROR] Slack get messages failed: {e.response['error']}")
            return []
    
    def get_channels(self):
        """
        Get list of all channels the bot has access to
        
        Returns:
            list: List of channels with id and name
        """
        try:
            response = self.client.conversations_list(
                types="public_channel,private_channel",
                limit=100
            )
            
            channels = []
            for channel in response['channels']:
                channels.append({
                    'id': channel['id'],
                    'name': channel['name'],
                    'is_member': channel.get('is_member', False)
                })
            
            return channels
        except SlackApiError as e:
            print(f"[ERROR] Slack get channels failed: {e.response['error']}")
            return []
    
    def _preload_users_cache(self):
        """
        Preload all users into cache to avoid multiple API calls
        Only fetches if cache is expired or empty
        """
        current_time = time.time()
        
        # Check if cache is still valid
        if self._users_list_cache and (current_time - self._users_list_cache_time) < self._cache_ttl:
            return
        
        try:
            print("[INFO] Preloading users cache...")
            response = self.client.users_list()
            
            # Clear existing cache
            self._user_cache = {}
            
            # Cache all users
            for user in response['members']:
                user_id = user['id']
                user_info = {
                    'real_name': user.get('real_name', user.get('name', 'Unknown')),
                    'email': user.get('profile', {}).get('email', ''),
                    'avatar': user.get('profile', {}).get('image_72', ''),
                    'display_name': user.get('profile', {}).get('display_name', ''),
                }
                self._user_cache[user_id] = user_info
            
            self._users_list_cache = True
            self._users_list_cache_time = current_time
            print(f"[INFO] Cached {len(self._user_cache)} users")
            
        except SlackApiError as e:
            print(f"[ERROR] Failed to preload users: {e.response['error']}")
            # Don't fail completely, just use empty cache
            self._users_list_cache = False
    
    def _get_user_from_cache(self, user_id):
        """
        Get user info from cache
        
        Args:
            user_id: Slack user ID
        
        Returns:
            dict: User info
        """
        if not user_id:
            return {'real_name': 'Unknown', 'email': '', 'avatar': ''}
        
        # Try to get from cache
        if user_id in self._user_cache:
            return self._user_cache[user_id]
        
        # If not in cache, return default
        # Don't make individual API calls to avoid rate limiting
        return {
            'real_name': f'User-{user_id[:8]}',
            'email': '',
            'avatar': ''
        }
    
    def get_user_info(self, user_id):
        """
        Get user information from Slack (uses cache)
        
        Args:
            user_id: Slack user ID
        
        Returns:
            dict: User info (name, email, etc.)
        """
        if not user_id:
            return {'real_name': 'Unknown', 'email': ''}
        
        # Check cache first
        if user_id in self._user_cache:
            return self._user_cache[user_id]
        
        # If not in cache, try to fetch (with rate limit protection)
        try:
            response = self.client.users_info(user=user_id)
            user = response['user']
            user_info = {
                'real_name': user.get('real_name', user.get('name', 'Unknown')),
                'email': user.get('profile', {}).get('email', ''),
                'avatar': user.get('profile', {}).get('image_72', ''),
                'display_name': user.get('profile', {}).get('display_name', ''),
            }
            # Cache the result
            self._user_cache[user_id] = user_info
            return user_info
        except SlackApiError as e:
            if e.response['error'] == 'ratelimited':
                print(f"[WARNING] Rate limited when fetching user {user_id}, using cache")
                # Return a default value
                return {
                    'real_name': f'User-{user_id[:8]}',
                    'email': '',
                    'avatar': ''
                }
            else:
                print(f"[ERROR] Slack get user info failed: {e.response['error']}")
                return {'real_name': 'Unknown', 'email': ''}
    
    def _format_timestamp(self, ts):
        """Convert Slack timestamp to readable format"""
        from datetime import datetime
        try:
            timestamp = float(ts)
            dt = datetime.fromtimestamp(timestamp)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ts