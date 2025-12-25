from repositories.integration_repository import IntegrationRepository
from models.integration import Integration, IntegrationType

class IntegrationService:
    """Service for managing integrations"""

    def __init__(self):
        self.repository = IntegrationRepository()

    def get_all_integrations(self):
        """Get all integrations"""
        return self.repository.get_all()

    def get_integration_by_id(self, integration_id):
        """Get integration by ID"""
        return self.repository.get_by_id(integration_id)

    def get_slack_integrations(self):
        """Get all Slack integrations"""
        integrations = self.repository.get_all()
        return [i for i in integrations if i.type == IntegrationType.API and 'slack' in i.authtoken.lower()]

    def create_slack_integration(self, workspace_name, bot_token, signing_secret):
        """Create a new Slack integration"""
        # Store tokens in a structured format
        authtoken = f"slack:workspace={workspace_name}:token={bot_token}:secret={signing_secret}"
        # Note: In production, encrypt these tokens
        integration = Integration(
            integration_id=None,  # Will be set by DB
            type=IntegrationType.API,
            authtoken=authtoken,
            last_synced=None
        )
        # This would need a create method in the repository
        # For now, return the integration object
        return integration