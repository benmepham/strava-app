$(document).ready(function () {
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
        $("table").data("page", data.page);
    }

    const queryParamsString = window.location.search.substr(1);
    console.log(queryParamsString);
    if (queryParamsString == "new=true") {
        $("#emailModal").modal("show");
    } else {
        $.ajax({
            type: "GET",
            url: "/api/activities?page=1&num=1",
            dataType: "json",
            beforeSend: function () {
                $(".loader").removeClass("invisible");
            },
            success: function (data) {
                if (data.error) {
                    if (data.status == 401) {
                        $(".modal-body").text(
                            "The API received a 401 Unauthorised error. Perhaps you did not allow the app to access your activity data?"
                        );
                    }
                    $("#errorModal").modal("show");
                } else addToTable(data);
            },
            complete: function () {
                $(".loader").addClass("invisible");
            },
        });
    }

    $("#email_submit").click(function () {
        const email = $("#exampleInputEmail1").val();
        const mailformat =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/

        if (!email.match(mailformat)) {
            alert("Invalid email address!");
        } else {
            console.log(email);
            // write email address to DB, and redirect to account
            $.ajax({
                url: "/api/email?email="+email,
                type: "post",
                data: { email: email },
                success: function (response) {
                    console.log(response);
                },
            });

            // $.post("/api/email", { email_add: email }, function (data, status) {
            //     console.log(data, status);
            // });
            // window.location.replace("/account");
        }
    });

    $("#get").click(function () {
        const page = $("table").data("page");
        $.ajax({
            type: "GET",
            url: "/api/activities?page=" + page + "&num=1",
            dataType: "json",
            beforeSend: function () {
                $(".loader").removeClass("invisible");
            },
            success: function (data) {
                addToTable(data);
            },
            complete: function () {
                $(".loader").addClass("invisible");
            },
        });
    });
});
