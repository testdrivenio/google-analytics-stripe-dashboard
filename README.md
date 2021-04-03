# Google Analytics Dashboard

Simple Google Analytics dashboard

## Setup

creating a project in the Google API Console, enabling the API, and creating credentials.

Create a new project on [Google Developers Console](https://console.cloud.google.com/apis/dashboard) and generate credentials, and download and save the *client_secrets.json* file to the "project" directory. Enable the Analytics Reporting and Google Analytics APIs.

Update the `GA_VIEW_ID` environment variable with your Google Analytics view ID in the *docker-compose.yml*.

Build the image and spin up the container:

```sh
$ docker-compose up -d --build
```

View the dashboard at [http://localhost:5004/](http://localhost:5004/).

## Example

![Example Dashboard](example.png)
