$(document).ready(function () {
    function addToTable(data) {
        console.log(data);
        let rows;
        for (let i = 0; i < data.runs.length; i++) {
            console.log(data.runs[i]);
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
    $.ajax({
        type: "GET",
        url: "/api/activities?page=1&num=1",
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
