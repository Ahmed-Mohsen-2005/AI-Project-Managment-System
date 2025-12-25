import requests
from flask import current_app

class GitHubService:
    @staticmethod
    @staticmethod
    def get_auth_url():
        client_id = current_app.config['GITHUB_CLIENT_ID']
        redirect_uri = current_app.config['GITHUB_REDIRECT_URI']
        # Added 'delete_repo' scope so you have full control
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope=repo,user,delete_repo" 
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
    @staticmethod
    def create_repository(access_token, name, description, is_private):
        """Creates a new repository on GitHub"""
        api_url = "https://api.github.com/user/repos"
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json"
        }
        payload = {
            "name": name,
            "description": description,
            "private": is_private,
            "auto_init": True  # Automatically add a README
        }
        
        response = requests.post(api_url, json=payload, headers=headers)
        return response
    # ... inside class GitHubService ...

    @staticmethod
    def get_dashboard_activity(access_token):
        if not access_token:
            return None

        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/json"
        }
        
        # 1. Fetch User's Repos
        repos_url = "https://api.github.com/user/repos?sort=updated&per_page=10"
        repos_resp = requests.get(repos_url, headers=headers)
        repos = repos_resp.json() if repos_resp.status_code == 200 else []

        dashboard_data = {
            'repos_list': [],
            'stats': {'total_repos': len(repos), 'open_prs': 0, 'recent_commits': 0, 'total_branches': 0},
            'commits': [],
            'pull_requests': [],
            'branches': [], # ✅ NEW: Store branches here
            'languages': {} 
        }

        for repo in repos:
            repo_name = repo['name']
            owner = repo['owner']['login']
            dashboard_data['repos_list'].append(repo_name)

            # A. Languages
            lang = repo.get('language')
            if lang:
                dashboard_data['languages'][lang] = dashboard_data['languages'].get(lang, 0) + 1

            # B. Commits (Increased limit to 100 per repo)
            commits_url = f"https://api.github.com/repos/{owner}/{repo_name}/commits?per_page=100"
            c_resp = requests.get(commits_url, headers=headers)
            if c_resp.status_code == 200:
                for commit in c_resp.json():
                    dashboard_data['commits'].append({
                        'repo': repo_name,
                        'message': commit['commit']['message'],
                        'author': commit['commit']['author']['name'],
                        'date': commit['commit']['author']['date'].split('T')[0],
                        'url': commit['html_url'],
                        'sha': commit['sha'][:7]
                    })
                    dashboard_data['stats']['recent_commits'] += 1

            # C. Pull Requests
            prs_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls?state=all&per_page=10"
            p_resp = requests.get(prs_url, headers=headers)
            if p_resp.status_code == 200:
                for pr in p_resp.json():
                    status = 'merged' if pr.get('merged_at') else pr['state']
                    dashboard_data['pull_requests'].append({
                        'repo': repo_name,
                        'title': pr['title'],
                        'user': pr['user']['login'],
                        'status': status,
                        'url': pr['html_url'],
                        'created_at': pr['created_at'].split('T')[0]
                    })
                    if pr['state'] == 'open':
                        dashboard_data['stats']['open_prs'] += 1

            # D. ✅ NEW: Fetch Branches
            branches_url = f"https://api.github.com/repos/{owner}/{repo_name}/branches"
            b_resp = requests.get(branches_url, headers=headers)
            if b_resp.status_code == 200:
                for branch in b_resp.json():
                    dashboard_data['branches'].append({
                        'repo': repo_name,
                        'name': branch['name'],
                        'protected': branch.get('protected', False),
                        'sha': branch['commit']['sha'][:7]
                    })
                    dashboard_data['stats']['total_branches'] += 1

        # Sort commits by date (newest first)
        dashboard_data['commits'].sort(key=lambda x: x['date'], reverse=True)
        
        return dashboard_data