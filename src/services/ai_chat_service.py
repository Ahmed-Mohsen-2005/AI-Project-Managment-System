import requests
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

class AIChatService:
    """Service for AI-powered chat analysis and summarization"""
    
    @staticmethod
    def summarize_chat(messages):
        """
        Generate an AI summary of chat messages
        
        Args:
            messages: List of dicts with 'user' and 'text' keys
        
        Returns:
            str: AI-generated summary
        """
        if not messages:
            return "No messages to summarize."
        
        # Build the conversation context
        conversation = "\n".join([
            f"{msg['user']}: {msg['text']}" 
            for msg in messages[-20:]  # Last 20 messages
        ])
        
        prompt = f"""You are an AI assistant analyzing a team chat conversation.

Conversation:
{conversation}

Please provide a concise summary that includes:
1. Main topics discussed
2. Key decisions or action items
3. Overall sentiment/tone
4. Any blockers or issues mentioned

Keep the summary under 150 words."""
        
        try:
            payload = {
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "Unable to generate summary.")
            
        except requests.exceptions.ConnectionError:
            return "⚠️ AI service is not available. Please ensure Ollama is running (http://localhost:11434)"
        except requests.exceptions.Timeout:
            return "⚠️ AI request timed out. Please try again."
        except Exception as e:
            print(f"[ERROR] AI summarization failed: {e}")
            return f"⚠️ AI summarization failed: {str(e)}"
    
    @staticmethod
    def analyze_sentiment(messages):
        """
        Analyze sentiment of recent chat messages
        
        Args:
            messages: List of message dicts
        
        Returns:
            dict: Sentiment score and status
        """
        if not messages:
            return {"score": 0.5, "status": "Neutral"}
        
        # Simple keyword-based sentiment (can be enhanced with AI)
        positive_words = ['great', 'good', 'excellent', 'thanks', 'awesome', 'perfect', 'nice']
        negative_words = ['issue', 'problem', 'bug', 'error', 'failed', 'blocked', 'urgent']
        
        positive_count = 0
        negative_count = 0
        
        for msg in messages[-10:]:  # Last 10 messages
            text = msg.get('text', '').lower()
            positive_count += sum(1 for word in positive_words if word in text)
            negative_count += sum(1 for word in negative_words if word in text)
        
        total = positive_count + negative_count
        if total == 0:
            score = 0.5
        else:
            score = positive_count / total
        
        if score >= 0.7:
            status = "Positive"
        elif score >= 0.4:
            status = "Neutral"
        else:
            status = "Negative/High Stress"
        
        return {"score": round(score, 2), "status": status}