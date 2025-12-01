from repositories.user_repository import UserRepository
from repositories.product_repository import ProductRepository

class RepositoryFactory:
    @staticmethod
    def get_repository(entity_type):
        if entity_type == "user":
            return UserRepository()
        elif entity_type == "product":
            return ProductRepository()
        else:
            raise ValueError("Unknown repository type")