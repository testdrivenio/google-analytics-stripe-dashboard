import os
from datetime import datetime
from pathlib import Path

import stripe
from apiclient.discovery import build
from flask import current_app
from oauth2client.service_account import ServiceAccountCredentials
from sqlalchemy import and_, desc, func

from project import db
from project.models import Charge

SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]
KEY_FILE_LOCATION = "client_secrets.json"
GA_VIEW_ID = os.getenv("GA_VIEW_ID")

# GA metric name: human readable name
GA_DATA_MAP = {
    "ga:pageViews": "pageViews",
    "ga:users": "users",
    "ga:bounceRate": "bounceRate",
    "ga:avgTimeOnPage": "avgTimeOnPage",
}


def create_service(service_type, version):
    credentials = ServiceAccountCredentials.from_json_keyfile_name(
        Path(__file__).parent.absolute() / KEY_FILE_LOCATION, SCOPES
    )

    return build(service_type, version, credentials=credentials)


def get_main_analytics(service, start_date, end_date):
    metics = []
    for metric in GA_DATA_MAP.keys():
        metics.append({"expression": metric})

    request_body = {
        "reportRequests": [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges": [{"startDate": start_date, "endDate": end_date}],
                "metrics": metics,
            }
        ]
    }

    return service.reports().batchGet(body=request_body).execute()


def get_active_users(service):
    return (
        service.data()
        .realtime()
        .get(ids=f"ga:{GA_VIEW_ID}", metrics="rt:activeUsers")
        .execute()["rows"][0][0]
    )


def get_charges(start_date, end_date, missing):
    current_app.logger.info(
        f"Getting charges between {start_date} and {end_date} from Stripe..."
    )

    charges = stripe.Charge.list(
        limit=100,
        paid="true",
        created={"gte": start_date, "lt": end_date},
        include=["total_count"],
    )
    for charge in charges.auto_paging_iter():
        datetime_obj = datetime.fromtimestamp(charge.created)

        if (
            missing
            and Charge.query.filter_by(amount=charge.amount, created=datetime_obj).all()
        ):
            pass
        else:
            current_app.logger.info(
                f"Adding charge for {charge.amount} created at {datetime_obj} to the database..."
            )
            charge = Charge(charge.amount, datetime_obj)
            db.session.add(charge)
            db.session.commit()


def get_stripe_data(start_date, end_date, days):
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    start_datetime_obj = datetime.fromtimestamp(start_date)
    end_datetime_obj = datetime.fromtimestamp(end_date)

    dates_from_db = (
        db.session.query(Charge)
        .filter(
            and_(
                Charge.created <= end_datetime_obj, Charge.created >= start_datetime_obj
            )
        )
        .order_by(desc(Charge.created))
        .all()
    )
    if not dates_from_db:
        get_charges(start_date, end_date, False)
    else:
        get_charges(
            start_date, int(datetime.timestamp(dates_from_db[-1].created)), True
        )
        get_charges(int(datetime.timestamp(dates_from_db[0].created)), end_date, True)

    data = (
        db.session.query(func.sum(Charge.amount), func.count(Charge.amount))
        .filter(
            and_(
                Charge.created <= end_datetime_obj, Charge.created >= start_datetime_obj
            )
        )
        .first()
    )

    return {
        "total_charges": data[1],
        "total_amount": data[0] / 100,
    }


def get_top_content_analytics(service, start_date, end_date):
    request_body = {
        "reportRequests": [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges": [{"startDate": start_date, "endDate": end_date}],
                "metrics": [{"expression": "ga:pageViews"}],
                "dimensions": [{"name": "ga:pagePath"}],
                "orderBys": [
                    {
                        "fieldName": "ga:pageViews",
                        "orderType": "VALUE",
                        "sortOrder": "DESCENDING",
                    },
                ],
                "pageSize": 20,
            }
        ]
    }

    return service.reports().batchGet(body=request_body).execute()


def get_top_sources_analytics(service, start_date, end_date):
    request_body = {
        "reportRequests": [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges": [{"startDate": start_date, "endDate": end_date}],
                "metrics": [{"expression": "ga:pageViews"}],
                "dimensions": [{"name": "ga:sourceMedium"}],
                "orderBys": [
                    {
                        "fieldName": "ga:pageViews",
                        "orderType": "VALUE",
                        "sortOrder": "DESCENDING",
                    },
                ],
                "pageSize": 20,
            }
        ]
    }

    return service.reports().batchGet(body=request_body).execute()


def parse_response_data(raw_data):
    data = {}
    metric_headers = raw_data["reports"][0]["columnHeader"]["metricHeader"][
        "metricHeaderEntries"
    ]
    data_values = raw_data["reports"][0]["data"]["rows"][0]["metrics"][0]["values"]

    for i, item in enumerate(metric_headers):
        name = GA_DATA_MAP[item["name"]]
        data[name] = data_values[i]

    return data


def parse_response_data_with_dimensions(raw_data):
    data = {}
    data_values = raw_data["reports"][0]["data"]["rows"]

    for values in data_values:
        url = values["dimensions"][0]
        data[url] = values["metrics"][0]["values"][0]

    return data
