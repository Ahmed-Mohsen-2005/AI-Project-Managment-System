"""
Google Drive OAuth Setup Script
Run this script once to authenticate and generate token.json
"""

import os
import sys
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Define the scopes your app needs - FULL ACCESS
SCOPES = ['https://www.googleapis.com/auth/drive']

CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'


def check_files():
    """Check if required files exist"""
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ Error: {CREDENTIALS_FILE} not found!")
        print("\nPlease follow these steps:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create/Select a project")
        print("3. Enable Google Drive API")
        print("4. Create OAuth 2.0 credentials")
        print("5. Download the JSON file")
        print(f"6. Rename it to '{CREDENTIALS_FILE}'")
        print(f"7. Place it in the project root: {os.getcwd()}")
        sys.exit(1)
    
    print(f"✓ Found {CREDENTIALS_FILE}")


def authenticate():
    """Authenticate with Google and generate token"""
    creds = None
    
    # Check if we already have a token
    if os.path.exists(TOKEN_FILE):
        print(f"\n📄 Found existing {TOKEN_FILE}")
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            print("✓ Loaded credentials from token.json")
        except Exception as e:
            print(f"⚠️ Error loading token: {e}")
            print("Will create a new token...")
    
    # If credentials are invalid or don't exist, authenticate
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("\n🔄 Refreshing expired token...")
            try:
                creds.refresh(Request())
                print("✓ Token refreshed successfully")
            except Exception as e:
                print(f"❌ Failed to refresh token: {e}")
                print("Will create a new token...")
                creds = None
        
        if not creds:
            print("\n🔐 Starting OAuth authentication flow...")
            print("📱 Your browser will open for authentication")
            print("Please log in and authorize the application")
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CREDENTIALS_FILE, 
                    SCOPES,
                    redirect_uri='http://localhost:8080/'
                )
                
                # Run the OAuth flow
                creds = flow.run_local_server(
                    port=8080,
                    prompt='consent',
                    success_message='Authentication successful! You can close this window.'
                )
                
                print("\n✓ Authentication successful!")
                
            except Exception as e:
                print(f"\n❌ Authentication failed: {e}")
                sys.exit(1)
        
        # Save the credentials
        try:
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
            print(f"✓ Credentials saved to {TOKEN_FILE}")
        except Exception as e:
            print(f"❌ Failed to save token: {e}")
            sys.exit(1)
    
    return creds


def test_connection(creds):
    """Test the connection to Google Drive"""
    print("\n🧪 Testing connection to Google Drive...")
    
    try:
        service = build('drive', 'v3', credentials=creds)
        
        # Try to list files
        results = service.files().list(
            pageSize=5,
            fields="files(id, name, mimeType)"
        ).execute()
        
        files = results.get('files', [])
        
        print("✓ Connection successful!")
        print(f"\n📁 Found {len(files)} recent files in your Drive:")
        
        if files:
            for file in files:
                print(f"  - {file['name']} (ID: {file['id']})")
        else:
            print("  (No files found - your Drive might be empty)")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False


def display_credentials_info(creds):
    """Display information about the credentials"""
    print("\n" + "="*60)
    print("📋 CREDENTIALS INFORMATION")
    print("="*60)
    
    print(f"✓ Token file: {TOKEN_FILE}")
    print(f"✓ Credentials file: {CREDENTIALS_FILE}")
    print(f"✓ Scopes authorized:")
    for scope in SCOPES:
        print(f"  - {scope}")
    
    if creds.expiry:
        print(f"✓ Token expiry: {creds.expiry}")
    
    print("="*60)


def main():
    """Main setup function"""
    print("="*60)
    print("🚀 GOOGLE DRIVE OAUTH SETUP")
    print("="*60)
    
    # Step 1: Check files
    print("\n📋 Step 1: Checking files...")
    check_files()
    
    # Step 2: Authenticate
    print("\n🔐 Step 2: Authenticating...")
    creds = authenticate()
    
    # Step 3: Test connection
    print("\n✓ Step 3: Testing connection...")
    success = test_connection(creds)
    
    if success:
        # Step 4: Display info
        display_credentials_info(creds)
        
        print("\n" + "="*60)
        print("✅ SETUP COMPLETE!")
        print("="*60)
        print("\nYou can now use the Google Drive integration in your app.")
        print("The following files have been created:")
        print(f"  ✓ {TOKEN_FILE} - OAuth token (keep this secret!)")
        print(f"\nTo use in your Flask app:")
        print("  1. Make sure both files are in your project root")
        print("  2. Start your Flask application")
        print("  3. Navigate to /docs to access Google Drive")
        print("\n⚠️ IMPORTANT: Add these files to .gitignore:")
        print(f"    {CREDENTIALS_FILE}")
        print(f"    {TOKEN_FILE}")
        print("="*60)
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

        