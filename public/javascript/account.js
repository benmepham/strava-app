function addToTable(data) {
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
            run.time +
            "</td>" +
            "</tr>";
    }
    $("table tbody").append(rows);
}

function getRun(page) {
    $.ajax({
        type: "GET",
        url: "/api/activities?page=" + page + "&num=1",
        dataType: "json",
        beforeSend: function () {
            $(".loader").removeClass("invisible");
        },
        success: function (data) {
            $("table").data("page", data.page);
            addToTable(data);
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
                var errorMessage = xhr.status + ": " + xhr.statusText;
                alert("Error - " + errorMessage);
            }
        },
    });
}

$(document).ready(function () {
    $("table").data("page", 1);
    const queryParamsString = window.location.search.substr(1);
    if (queryParamsString == "new=true") {
        $("#emailModal").modal("show");
    } else {
        getRun(1);
    }

    $("#email_submit").click(function () {
        const email = $("#exampleInputEmail1").val();
        const mailformat =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/
        if (!email.match(mailformat)) {
            alert("Invalid email address!");
        } else {
            $.ajax({
                url: "/api/email?email=" + email,
                type: "post",
                data: { email: email },
                success: function () {
                    window.location.replace("/account");
                },
                error: function (xhr, status, error) {
                    var errorMessage = xhr.status + ": " + xhr.statusText;
                    alert("Error - " + errorMessage);
                },
            });
        }
    });

    $("#get").click(function () {
        const page = $("table").data("page");
        getRun(page);
    });
});
