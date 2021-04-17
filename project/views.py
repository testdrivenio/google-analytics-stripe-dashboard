from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, render_template, request

from project.utils import (
    create_service,
    get_active_users,
    get_main_analytics,
    get_stripe_data,
    get_top_content_analytics,
    get_top_sources_analytics,
    parse_response_data,
    parse_response_data_with_dimensions,
)

api = Blueprint("api", __name__, template_folder="templates")


@api.route("/")
def index():
    return render_template("index.html")


@api.route("/api/data/google", methods=["POST"])
def google_data():
    days = request.get_json()["days"]

    reports_service = create_service("analyticsreporting", "v4")
    analytics_service = create_service("analytics", "v3")

    # calculate current and previous time periods
    today = date.today()
    start_date_current = today - timedelta(days=days)
    end_date_current = today.strftime("%Y-%m-%d")
    end_date_previous = start_date_current - timedelta(days=1)
    start_date_previous = (end_date_previous - timedelta(days=days)).strftime(
        "%Y-%m-%d"
    )

    # get analytics for the current period
    raw_data_current = get_main_analytics(
        reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current
    )
    current = parse_response_data(raw_data_current)

    # get analytics for the previous period
    raw_data_previous = get_main_analytics(
        reports_service, start_date_previous, end_date_previous.strftime("%Y-%m-%d")
    )
    previous = parse_response_data(raw_data_previous)

    # get top content for the current period
    content = get_top_content_analytics(
        reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current
    )

    # get top referral sources for the current period
    sources = get_top_sources_analytics(
        reports_service, start_date_current.strftime("%Y-%m-%d"), end_date_current
    )

    # get active users
    active_users = get_active_users(analytics_service)

    response = {
        "current": current,
        "previous": previous,
        "top_content": parse_response_data_with_dimensions(content),
        "top_sources": parse_response_data_with_dimensions(sources),
        "active_users": active_users,
    }

    return jsonify(response)


@api.route("/api/data/stripe", methods=["POST"])
def stripe_data():
    days = request.get_json()["days"]

    # calculate current and previous time periods
    now = datetime.now()
    start_date_current = now - timedelta(days=days)
    end_date_current = datetime.timestamp(now)
    end_date_previous = start_date_current - timedelta(days=1)
    start_date_previous = (end_date_previous - timedelta(days=days)).timestamp()

    # get stripe data
    current_stripe_data = get_stripe_data(
        int(start_date_current.timestamp()), int(end_date_current), days
    )
    previous_stripe_data = get_stripe_data(
        int(start_date_previous), int(end_date_previous.timestamp()), days
    )

    response = {
        "current_stripe_data": current_stripe_data,
        "previous_stripe_data": previous_stripe_data,
    }

    return jsonify(response)
