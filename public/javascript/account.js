function addToTable(data, table) {
    let rows;
    for (let i = 0; i < data.runs.length; i++) {
        const run = data.runs[i];
        rows +=
            "<tr>" +
            '<th scope="row"><a href="https://www.strava.com/activities/' +
            run.id +
            '">' +
            run.name +
            "</a>" +
            "</th>" +
            "<td>" +
            run.date +
            "</td>" +
            "<td>" +
            run.distance +
            "</td>" +
            "<td>" +
            run.timeMoving +
            "</td>" +
            "<td>" +
            run.paceMoving +
            "</td>" +
            "<td>" +
            run.time5k +
            "</td>" +
            "<td>" +
            run.pace5k +
            "</td>" +
            "<td>" +
            run.time10k +
            "</td>" +
            "<td>" +
            run.pace10k +
            "</td>" +
            "</tr>";
    }
    $("#" + table).append(rows);
    document.getElementById(table).removeAttribute("hidden");
}

function getRun(url, table) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        beforeSend: function () {
            $(".loader").removeClass("invisible");
        },
        success: function (data) {
            if (data.runs.length == 0) alert("No more valid runs");
            if (table == "table1") {
                $("#" + table).data("page", data.page);
                $("#" + table).data("pagePos", data.pagePos);
            }
            addToTable(data, table);
        },
        complete: function () {
            $(".loader").addClass("invisible");
        },
        error: function (xhr, status, error) {
            if (xhr.status == 401) {
                $(".modal-body").text(
                    "The API received a 401 Unauthorised error. Perhaps you did not allow the app to access your activity data?"
                );
                $("#errorModal").modal("show");
            } else {
                console.error(xhr, status, error);
                if (table == "table2") {
                    document.getElementById(
                        "activityUrlInvalidFeedback"
                    ).innerText =
                        "Error - " + xhr.status + ": " + xhr.responseText;
                    document
                        .getElementById("activityUrl")
                        .classList.add("is-invalid");
                } else alert("Error - " + xhr.status + ": " + xhr.responseText);
            }
        },
    });
}

function validateEmail(email) {
    const mailformat =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/
    if (!email.match(mailformat)) {
        alert("Invalid email address!");
        return false;
    }
    return true;
}

$(document).ready(function () {
    $("#table1").data("page", 1);
    $("#table1").data("pagePos", 0);

    const queryParamsString = window.location.search.substr(1);
    if (queryParamsString == "new") {
        $("#emailModal").modal("show");
    }

    // override checkbox
    $("#emailChecked")[0].checked = $("#emailChecked").attr("checked");

    $("#email_submit").click(function () {
        const email = $("#exampleInputEmail1").val();
        if (validateEmail(email)) {
            $.ajax({
                url: "/api/email?email=" + email,
                type: "post",
                success: function () {
                    window.location.replace("/account");
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    alert("Error - " + xhr.status + ": " + xhr.responseText);
                },
            });
        }
    });

    $("#get").click(function () {
        const page = $("#table1").data("page");
        const pagePos = $("#table1").data("pagePos");
        getRun(
            "/api/activities?num=" +
                document.getElementById("getNumber").value +
                "&page=" +
                page +
                "&pagePos=" +
                pagePos,

            "table1"
        );
    });

    $("#activityUrlGet").click(function () {
        const table = document.getElementById("table2");
        const urlElement = document.getElementById("activityUrl");
        const url = urlElement.value;
        if (table.rows.length > 1) table.deleteRow(1);

        // quick sanity check before sending to back end
        if (
            !url.includes("strava.com/activities/") &&
            !url.includes("strava.app.link/") &&
            !/^\d{10}$/.test(url)
        ) {
            document.getElementById("activityUrlInvalidFeedback").innerText =
                "Please enter a valid activity ID or URL";
            urlElement.classList.add("is-invalid");
            return;
        }
        urlElement.classList.remove("is-invalid");
        getRun("/api/activities?url=" + url, "table2");
    });

    $("#updateSettings").click(function () {
        const email = $("#email").val();
        const checkedEmail = $("#emailChecked").is(":checked");
        if (validateEmail(email)) {
            $.ajax({
                url: "/api/email?email=" + email + "&enabled=" + checkedEmail,
                type: "post",
                success: function () {
                    alert("Updated successfully");
                },
                error: function (xhr, status, error) {
                    console.error(xhr, status, error);
                    alert("Error - " + xhr.status + ": " + xhr.responseText);
                },
            });
        }
    });
});
