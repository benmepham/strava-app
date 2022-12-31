validateRun = (run) => run.type == "Run" && run.distance >= 5000 && !run.manual;

module.exports = { validateRun };
