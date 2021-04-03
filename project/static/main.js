(function() {
  const timeFrame = document.querySelector(".time-frame");
  timeFrame.innerHTML = "Last 7 Days";

  const dropdown = document.querySelector(".dropdown");
  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("is-active");
  });

  const reloadIcon = document.querySelector(".icon-container");
  reloadIcon.addEventListener("click", (event) => {
    const timeFrame = document.querySelector(".time-frame").innerHTML;
    const days = parseInt(timeFrame.split(" ")[1]);

    updateTimeFrame(days);
  });

  updateTimeFrame(7);

})();

function updateTimeFrame(days) {
  document.querySelector(".date-time").innerHTML = "";

  const timeFrame = document.querySelector(".time-frame");
  timeFrame.innerHTML = `Last ${days} Days`;

  fetch("api/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({days}),
  })
  .then(response => response.json())
  .then(data => {
    const current = data.current;
    const previous = data.previous;
    const topContent = data.top_content;
    const topSources = data.top_sources;
    const activeUsers = data.active_users;

    // analytics for the current period
    const currentPageViews = parseInt(current.pageViews);
    const currentUsers = parseInt(current.users);
    const currentBounceRate = parseFloat(current.bounceRate);
    const currentAvgTimeOnPage = current.avgTimeOnPage;

    // analytics for the previous period
    const previousPageViews = parseInt(previous.pageViews);
    const previousUsers = parseInt(previous.users);
    const previousBounceRate = parseFloat(previous.bounceRate);
    const previousAvgTimeOnPage = previous.avgTimeOnPage;

    // percent change
    const changePageViews = ((currentPageViews - previousPageViews) / previousPageViews) * 100
    const changeUsers = ((currentUsers - previousUsers) / previousUsers) * 100
    const changeBounceRate = ((currentBounceRate - previousBounceRate) / previousBounceRate) * 100
    const changeAvgTimeOnPage = ((currentAvgTimeOnPage - previousAvgTimeOnPage) / previousAvgTimeOnPage) * 100

    // determine css color
    // if percent change is negative -> red
    // if percent change is positive -> green
    if (Math.sign(changePageViews) === -1) {
      document.querySelector(".pageviews-previous").classList.remove("green-text");
      document.querySelector(".pageviews-previous").classList.add("red-text");
    } else {
      document.querySelector(".pageviews-previous").classList.remove("red-text");
      document.querySelector(".pageviews-previous").classList.add("green-text");
    }
    if (Math.sign(changeUsers) === -1) {
      document.querySelector(".users-previous").classList.remove("green-text");
      document.querySelector(".users-previous").classList.add("red-text");
    } else {
      document.querySelector(".users-previous").classList.remove("red-text");
      document.querySelector(".users-previous").classList.add("green-text");
    }
    if (Math.sign(changeBounceRate) === -1) {
      document.querySelector(".bounce-rate-previous").classList.remove("green-text");
      document.querySelector(".bounce-rate-previous").classList.add("red-text");
    } else {
      document.querySelector(".bounce-rate-previous").classList.remove("red-text");
      document.querySelector(".bounce-rate-previous").classList.add("green-text");
    }
    if (Math.sign(changeAvgTimeOnPage) === -1) {
      document.querySelector(".avg-time-page-previous").classList.remove("green-text");
      document.querySelector(".avg-time-page-previous").classList.add("red-text");
    } else {
      document.querySelector(".avg-time-page-previous").classList.remove("red-text");
      document.querySelector(".avg-time-page-previous").classList.add("green-text");
    }

    // update DOM with the values - current
    document.querySelector(".pageviews-current").innerHTML = currentPageViews.toLocaleString();
    document.querySelector(".users-current").innerHTML = currentUsers.toLocaleString();
    document.querySelector(".bounce-rate-current").innerHTML = `${currentBounceRate.toFixed(2)}%`;
    document.querySelector(".avg-time-page-current").innerHTML = displayTime(currentAvgTimeOnPage);

    // update DOM with the values - previous
    document.querySelector(".pageviews-previous").innerHTML = `${changePageViews.toFixed(2)}%`;
    document.querySelector(".users-previous").innerHTML = `${changeUsers.toFixed(2)}%`;
    document.querySelector(".bounce-rate-previous").innerHTML = `${changeBounceRate.toFixed(2)}%`;
    document.querySelector(".avg-time-page-previous").innerHTML = `${changeAvgTimeOnPage.toFixed(2)}%`;

    document.querySelector(".active-users").innerHTML = activeUsers;

    // delete existing data from top content table
    const topContentTable = document.querySelector(".top-content-table");
    while (topContentTable.rows.length > 1) {
      topContentTable.deleteRow(1);
    }

    // update top content table
    var num = 1
    for (const key in topContent) {
      const row = topContentTable.insertRow(-1);
      row.insertCell(0).innerHTML = num;
      row.insertCell(1).innerHTML = key;
      row.insertCell(2).innerHTML = parseInt(topContent[key]).toLocaleString();
      num++;
    }

    // delete existing data from top sources table
    const topSourcesTable = document.querySelector(".top-sources-table");
    while (topSourcesTable.rows.length > 1) {
      topSourcesTable.deleteRow(1);
    }

    // update top sources table
    var num = 1
    for (const key in topSources) {
      const row = topSourcesTable.insertRow(-1);
      row.insertCell(0).innerHTML = num;
      row.insertCell(1).innerHTML = key;
      row.insertCell(2).innerHTML = parseInt(topSources[key]).toLocaleString();
      num++;
    }

    document.querySelector(".date-time").innerHTML = new Date();
  })
  .catch((error) => {
    console.error(error);
  });
}

function displayTime(seconds) {
  const format = val => `0${Math.floor(val)}`.slice(-2)
  const hours = seconds / 3600
  const minutes = (seconds % 3600) / 60

  return [hours, minutes, seconds % 60].map(format).join(":")
}
