const util = require('./util.js');

class Elevator {
    constructor(floors) {
        this.floorsServed = floors;
        this.goingUp = true;
        this.inTransit = false;
        this.isDoorOpen = true;
        this.name = `Elevator #${util.elevatorNameGenerator()}`;
        this.currentFloor = {name: 'Floor 1', value: 1};
        this.destinationFloor = {name: 'None', value: 0};
        this.tripsMade = 0;
        this.maintenanceMode = false;
    }
}

module.exports = Elevator;
