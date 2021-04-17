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

function clearExistingData() {
  // stripe
  document.querySelector(".stripe-charges-current").innerHTML = "-";
  document.querySelector(".stripe-amount-current").innerHTML = "-";
  document.querySelector(".stripe-charges-previous").innerHTML = "-";
  document.querySelector(".stripe-charges-previous").setAttribute("data-tooltip", "-");
  document.querySelector(".stripe-amount-previous").innerHTML = "-";
  document.querySelector(".stripe-amount-previous").setAttribute("data-tooltip", "-");

  // google
  document.querySelector(".pageviews-current").innerHTML = "-";
  document.querySelector(".users-current").innerHTML = "-";
  document.querySelector(".bounce-rate-current").innerHTML = "-";
  document.querySelector(".avg-time-page-current").innerHTML = "-";
  document.querySelector(".pageviews-previous").innerHTML = "-";
  document.querySelector(".pageviews-previous").setAttribute("data-tooltip", "-");
  document.querySelector(".users-previous").innerHTML = "-";
  document.querySelector(".users-previous").setAttribute("data-tooltip", "-");
  document.querySelector(".bounce-rate-previous").innerHTML = "-";
  document.querySelector(".bounce-rate-previous").setAttribute("data-tooltip", "-");
  document.querySelector(".avg-time-page-previous").innerHTML = "-";
  document.querySelector(".avg-time-page-previous").setAttribute("data-tooltip", "-");
  document.querySelector(".active-users").innerHTML = "-";

  // delete existing data from top content table
  const topContentTable = document.querySelector(".top-content-table");
  while (document.querySelector(".top-content-table").rows.length > 1) {
    topContentTable.deleteRow(1);
  }

  // delete existing data from top sources table
  const topSourcesTable = document.querySelector(".top-sources-table");
  while (topSourcesTable.rows.length > 1) {
    topSourcesTable.deleteRow(1);
  }
}

function getGoogleData(days) {
  fetch("api/data/google", {
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
    const changePageViews = ((currentPageViews - previousPageViews) / previousPageViews) * 100;
    const changeUsers = ((currentUsers - previousUsers) / previousUsers) * 100;
    const changeBounceRate = ((currentBounceRate - previousBounceRate) / previousBounceRate) * 100;
    const changeAvgTimeOnPage = ((currentAvgTimeOnPage - previousAvgTimeOnPage) / previousAvgTimeOnPage) * 100;

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
    document.querySelector(".pageviews-previous").setAttribute("data-tooltip", numberWithCommas(previousPageViews));
    document.querySelector(".users-previous").innerHTML = `${changeUsers.toFixed(2)}%`;
    document.querySelector(".users-previous").setAttribute("data-tooltip", numberWithCommas(previousUsers));
    document.querySelector(".bounce-rate-previous").innerHTML = `${changeBounceRate.toFixed(2)}%`;
    document.querySelector(".bounce-rate-previous").setAttribute("data-tooltip", `${previousBounceRate.toFixed(2)}%`);
    document.querySelector(".avg-time-page-previous").innerHTML = `${changeAvgTimeOnPage.toFixed(2)}%`;
    document.querySelector(".avg-time-page-previous").setAttribute("data-tooltip", displayTime(previousAvgTimeOnPage));

    document.querySelector(".active-users").innerHTML = activeUsers;

    // update top content table
    var num = 1;
    const topContentTable = document.querySelector(".top-content-table");
    for (const key in topContent) {
      const row = topContentTable.insertRow(-1);
      row.insertCell(0).innerHTML = num;
      row.insertCell(1).innerHTML = key;
      row.insertCell(2).innerHTML = parseInt(topContent[key]).toLocaleString();
      num++;
    }

    // update top sources table
    const topSourcesTable = document.querySelector(".top-sources-table");
    var num = 1;
    for (const key in topSources) {
      const row = topSourcesTable.insertRow(-1);
      row.insertCell(0).innerHTML = num;
      row.insertCell(1).innerHTML = key;
      row.insertCell(2).innerHTML = parseInt(topSources[key]).toLocaleString();
      num++;
    }
  })
  .catch((error) => {
    console.error(error);
  });
}

function getStripeData(days) {
  fetch("api/data/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({days}),
  })
  .then(response => response.json())
  .then(data => {
    const total_current_charges = data.current_stripe_data.total_charges;
    const total_previous_charges = data.previous_stripe_data.total_charges;
    const total_current_amount = data.current_stripe_data.total_amount;
    const total_previous_amount = data.previous_stripe_data.total_amount;

    // percent change
    const charges = ((total_current_charges - total_previous_charges) / total_previous_charges) * 100;
    const amount = ((total_current_amount - total_previous_amount) / total_previous_amount) * 100;
    // determine css color
    // if percent change is negative -> red
    // if percent change is positive -> green
    if (Math.sign(charges) === -1) {
      document.querySelector(".stripe-charges-previous").classList.remove("green-text");
      document.querySelector(".stripe-charges-previous").classList.add("red-text");
    } else {
      document.querySelector(".stripe-charges-previous").classList.remove("red-text");
      document.querySelector(".stripe-charges-previous").classList.add("green-text");
    }
    if (Math.sign(amount) === -1) {
      document.querySelector(".stripe-amount-previous").classList.remove("green-text");
      document.querySelector(".stripe-amount-previous").classList.add("red-text");
    } else {
      document.querySelector(".stripe-amount-previous").classList.remove("red-text");
      document.querySelector(".stripe-amount-previous").classList.add("green-text");
    }

    // update DOM with the values - current
    document.querySelector(".stripe-charges-current").innerHTML = numberWithCommas(total_current_charges);
    document.querySelector(".stripe-amount-current").innerHTML = `${numberWithCommas(total_current_amount.toFixed(2))}`;

    // update DOM with the values - previous
    document.querySelector(".stripe-charges-previous").innerHTML = `${charges.toFixed(2)}%`;
    document.querySelector(".stripe-charges-previous").setAttribute("data-tooltip", numberWithCommas(total_previous_charges));
    document.querySelector(".stripe-amount-previous").innerHTML = `${amount.toFixed(2)}%`;
    document.querySelector(".stripe-amount-previous").setAttribute("data-tooltip", numberWithCommas(total_previous_amount.toFixed(2)));

    document.querySelector(".date-time").innerHTML = new Date();
  })
  .catch((error) => {
    console.error(error);
  });
};

function displayTime(seconds) {
  const format = val => `0${Math.floor(val)}`.slice(-2)
  const hours = seconds / 3600
  const minutes = (seconds % 3600) / 60

  return [hours, minutes, seconds % 60].map(format).join(":")
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateTimeFrame(days) {
  document.querySelector(".date-time").innerHTML = "";

  const timeFrame = document.querySelector(".time-frame");
  timeFrame.innerHTML = `Last ${days} Days`;

  clearExistingData();
  getStripeData(days);
  getGoogleData(days);
}
