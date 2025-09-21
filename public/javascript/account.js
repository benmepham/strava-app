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
            run.startTime +
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
            // button to add activity to merge list
            '<button class="btn btn-primary" onclick=addToMerge(' +
            run.id +
            ') type="button">Add to merge</button>' +
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

function addToMerge(id) {
    console.log("Add to merge: " + id);
    // add to ul with id mergeList
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.innerText = id;
    document.getElementById("mergeList").appendChild(li);
}

function validateIdOrUrl(input) {
    if (
        !input.includes("strava.com/activities/") &&
        !input.includes("strava.app.link/") &&
        !/^\d{10}$/.test(input)
    ) {
        return false;
    }
    return true;
}

$(document).ready(function () {
    $("#table1").data("page", 1);
    $("#table1").data("pagePos", 0);

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

    $("#deleteAccount").click(function () {
        $.ajax({
            url: "/api/delete",
            type: "delete",
            success: function () {
                alert("Account deleted");
                window.location.href = "/";
            },
            error: function (xhr, status, error) {
                console.error(xhr, status, error);
                alert("Error - " + xhr.status + ": " + xhr.responseText);
            },
        });
    });

    $("#submitMerge").click(function () {
        // get the list of ids from the ul with id mergeList
        let mergeList = document
            .getElementById("mergeList")
            .getElementsByTagName("li");
        // turn it into a array of the innerText of each li
        mergeList = Array.from(mergeList);
        mergeList = mergeList.map((li) => li.innerText);
        console.log(mergeList);
        if (mergeList.length < 2) {
            alert("Please select exactly two activities to merge");
            return;
        }

        fetch("/api/merge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ runs: mergeList.toString() }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        throw new Error(text || response.status);
                    });
                }
                return response.text();
            })
            .then((data) => {
                document.getElementById(
                    "mergeFeedback"
                ).innerHTML = `Success: <a href="https://strava.com/activities/${data}" target="_blank">View activity</a>`;
            })
            .catch((error) => {
                document.getElementById("mergeFeedback").innerText =
                    "Error - " + error.message;
            })
            .finally(() => {
                $(".loader").addClass("invisible");
            });
    });
});
