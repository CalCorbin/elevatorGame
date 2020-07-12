function elevatorNameGenerator() {
    return Math.random()
        .toString(36)
        .substr(2, 5);
}

module.exports = { elevatorNameGenerator };
