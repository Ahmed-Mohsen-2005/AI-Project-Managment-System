from flask import Blueprint, jsonify, request
from services.documentation_service import DocumentationService
from services.ai_prediction_service import AIService

documentation_bp = Blueprint(
    "documentation",
    __name__,
    url_prefix="/api/v1/documentation"
)

@documentation_bp.route("/sprint/<int:sprint_id>", methods=["GET"])
def get_sprint_documentation(sprint_id):
    return jsonify(
        DocumentationService.generate_sprint_documentation(sprint_id)
    ), 200


@documentation_bp.route("/sprint/<int:sprint_id>/ai-summary", methods=["POST"])
def generate_ai_summary(sprint_id):
    data = request.get_json()
    summary = AIService.generate_summary(data["prompt"])
    return jsonify({"summary": summary}), 200
