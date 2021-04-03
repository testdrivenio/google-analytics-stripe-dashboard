import os
from pathlib import Path

from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials


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
        Path(__file__).parent.absolute() / KEY_FILE_LOCATION,
        SCOPES
    )

    return build(service_type, version, credentials=credentials)


def get_main_analytics(service, start_date, end_date):
    print(GA_VIEW_ID)
    metics = []
    for metric in GA_DATA_MAP.keys():
        metics.append({
            "expression": metric
        })

    request_body = {
        "reportRequests":
        [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges":
                [
                    {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                ],
                "metrics": metics
            }
        ]
    }

    return service.reports().batchGet(body=request_body).execute()


def get_active_users(service):
    return service.data().realtime().get(
      ids=f"ga:{GA_VIEW_ID}",
      metrics="rt:activeUsers"
    ).execute()["rows"][0][0]


def get_top_content_analytics(service, start_date, end_date):
    request_body = {
        "reportRequests":
        [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges":
                [
                    {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                ],
                "metrics": [
                    {
                        "expression": "ga:pageViews"
                    }
                ],
                "dimensions": [
                    {
                        "name": "ga:pagePath"
                    }
                ],
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
        "reportRequests":
        [
            {
                "viewId": GA_VIEW_ID,
                "includeEmptyRows": True,
                "dateRanges":
                [
                    {
                        "startDate": start_date,
                        "endDate": end_date
                    }
                ],
                "metrics": [
                    {
                        "expression": "ga:pageViews"
                    }
                ],
                "dimensions": [
                    {
                        "name": "ga:sourceMedium"
                    }
                ],
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
    metric_headers = raw_data["reports"][0]["columnHeader"]["metricHeader"]["metricHeaderEntries"]
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
