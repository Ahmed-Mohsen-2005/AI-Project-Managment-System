import requests
from flask import current_app

class GitHubService:
    @staticmethod
    def get_auth_url():
        client_id = current_app.config['GITHUB_CLIENT_ID']
        redirect_uri = current_app.config['GITHUB_REDIRECT_URI']
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope=repo,user"
        )

    @staticmethod
    def get_token(code):
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": current_app.config['GITHUB_CLIENT_ID'],
            "client_secret": current_app.config['GITHUB_CLIENT_SECRET'],
            "code": code,
            "redirect_uri": current_app.config['GITHUB_REDIRECT_URI']
        }
        headers = {"Accept": "application/json"}
        
        response = requests.post(token_url, data=payload, headers=headers)
        if response.status_code == 200:
            return response.json().get("access_token")
        return None

    @staticmethod
    def get_user_repos(access_token):
        if not access_token:
            return []
            
        api_url = "https://api.github.com/user/repos"
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json"
        }
        params = {"sort": "updated", "per_page": 10}
        
        response = requests.get(api_url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        return []