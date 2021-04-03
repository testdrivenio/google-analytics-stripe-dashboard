from datetime import date, timedelta

from flask import Blueprint, render_template, jsonify, request

from project.utils import (
    create_service,
    get_active_users,
    get_main_analytics,
    get_top_content_analytics,
    get_top_sources_analytics,
    parse_response_data,
    parse_response_data_with_dimensions,
)


api = Blueprint("api", __name__, template_folder="templates")


@api.route("/")
def index():
    return render_template("index.html")


@api.route("/api/data", methods=["POST"])
def data():
    days = request.get_json()["days"]

    reports_service = create_service("analyticsreporting", "v4")
    analytics_service = create_service("analytics", "v3")


    # calculate current and previous time periods
    today = date.today()
    start_date_current = today - timedelta(days=days)
    end_date_current = today.strftime("%Y-%m-%d")
    end_date_previous = start_date_current - timedelta(days=1)
    start_date_previous = (end_date_previous - timedelta(days=days)).strftime("%Y-%m-%d")

    # get analytics for the current period
    raw_data_current = get_main_analytics(reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current)
    current = parse_response_data(raw_data_current)

    # get analytics for the previous period
    raw_data_previous = get_main_analytics(reports_service, start_date_previous, end_date_previous.strftime("%Y-%m-%d"))
    previous = parse_response_data(raw_data_previous)

    # get top content for the current period
    content = get_top_content_analytics(reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current)

    # get top referral sources for the current period
    sources = get_top_sources_analytics(reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current)

    active_users = get_active_users(analytics_service)

    response = {
        "current": current,
        "previous": previous,
        "top_content": parse_response_data_with_dimensions(content),
        "top_sources": parse_response_data_with_dimensions(sources),
        "active_users": active_users,
    }

    return jsonify(response)
