validateRun = (run) =>
    run.type == "Run" &&
    run.distance >= 5000 &&
    !run.manual &&
    run.start_latlng &&
    run.start_latlng.length != 0;

module.exports = { validateRun };
