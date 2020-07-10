#!/usr/bin/env node

const {prompt, Select} = require('enquirer');
const Elevator = require('../src/Elevator.js');

let Building;
let closestElevator;
let selectedOccupant;
let selectedFloor;

console.log("Hello! Welcome to the elevator game.");

const occupants = [
    {
        name: 'Captain Picard',
        ridingElevator: false,
        currentElevator: 'None',
        currentFloor: {
            name: 'Floor 1',
            value: 1
        },
        selectedFloor: {
            name: 'None',
            value: 0
        }
    },
    {
        name: 'Commander Riker',
        ridingElevator: false,
        currentElevator: 'None',
        currentFloor: {
            name: 'Floor 1',
            value: 1
        },
        selectedFloor: {
            name: 'None',
            value: 0
        }
    },
];

// =======CONTROLLER FUNCTIONS=======

function makeElevators(elevatorCount, floorCount) {
    const elevators = [];
    for (let i = 0; i < elevatorCount; i++) {
        elevators[i] = new Elevator(floorCount);
    }

    return elevators;
}

function makeFloors(floors) {
    const floorCount = parseInt(floors) + 1;
    const floorList = [];
    for (let i = 1; i < floorCount; i++) {
        floorList.push({
            name: `Floor ${i}`,
            value: i
        })
    }

    return floorList;
}

async function reportElevatorStatus() {
    // Occupants status
    Building.occupants.forEach(occupant => {
        console.log(`${occupant.name} is currently on ${occupant.currentFloor.name}. Current elevator: ${occupant.currentElevator}.`)
    });

    // Line between occupants and elevators
    console.log('');

    // Elevators status
    Building.elevators.forEach(elevator => {
        console.log(`[${elevator.name} is currently on ${elevator.currentFloor.name}. The elevator door is ${elevator.isDoorOpen ? 'open' : 'closed'}.]`)
    });

    // Line after report
    console.log('');
}

async function moveElevators() {
    console.log('\n+++ Moving elevator +++');

    Building.elevators.forEach(elevator => {
        if (elevator.inTransit && elevator.destinationFloor.value !== elevator.currentFloor.value) {
            elevator.isDoorOpen = false;

            // Set floor
            elevator.goingUp
                ? elevator.currentFloor.value = elevator.currentFloor.value + 1
                : elevator.currentFloor.value = elevator.currentFloor.value - 1;
            elevator.currentFloor.name = `Floor ${elevator.currentFloor.value}`;

            Building.occupants.forEach(occupant => {
                if (occupant.ridingElevator
                    && occupant.currentElevator === elevator.name
                    && occupant.currentFloor.value !== occupant.selectedFloor.value) {

                    // Set floor
                    occupant.currentFloor.name = elevator.currentFloor.name;
                    occupant.currentFloor.value = elevator.currentFloor.value;

                    console.log(`\n${elevator.name} has moved to ${elevator.currentFloor.name}.\n`);
                }
            });
        }
    });
}

async function hasOccupantArrived() {
    Building.occupants.forEach(occupant => {
        if (occupant.selectedFloor.value === occupant.currentFloor.value) {
            // Elevator has arrived
            Building.elevators.forEach(elevator => {
                if (elevator.name === occupant.currentElevator) {
                    elevator.inTransit = false;
                    elevator.isDoorOpen = true;
                    elevator.destinationFloor.name = 'None';
                    elevator.destinationFloor.value = 'None';

                    if (elevator.isDoorOpen) {
                        console.log(`${elevator.name} has opened its door.`)
                    }

                    if (elevator.tripsMade === 100) {
                        elevator.maintenanceMode = true;
                    }
                }
            })

            // Occupant has arrived
            occupant.ridingElevator = false;
            occupant.selectedFloor.name = 'None';
            occupant.selectedFloor.value = 0;
            occupant.currentElevator = 'None';

            // Report occupant arrival
            console.log(`\n!!!${occupant.name} has arrived at their selected floor, ${occupant.currentFloor.name}!!! \n`)
        }
    });
}

async function getClosestElevator() {
    const availableElevators = [];
    Building.elevators.forEach(elevator => {
        if (!elevator.inTransit && !elevator.maintenanceMode) {
            availableElevators.push(elevator);
        }
    });

    closestElevator = await availableElevators.reduce(function (previous, current) {
            return (
                Math.abs(current.currentFloor.value - selectedFloor.value) < Math.abs(previous - selectedFloor.value)
                    ? current
                    : previous
            )
        }
    )

    // Update elevator
    Building.elevators.forEach(elevator => {
        if (elevator.name === closestElevator.name) {
            // Set destination
            elevator.destinationFloor.name = selectedFloor.name;
            elevator.destinationFloor.value = selectedFloor.value;
            elevator.inTransit = true;

            // Set direction
            elevator.destinationFloor.value > elevator.currentFloor.value
                ? elevator.goingUp = true
                : elevator.goingUp = false;

            // Add trip to elevator
            elevator.tripsMade = elevator.tripsMade + 1;

            console.log(`\nThe elevator, ${elevator.name}, closest to ${selectedOccupant.name}, has arrived and opened its door. \n`);
            console.log(`After ${selectedOccupant.name} gets in, ${elevator.name} shuts its door.`);
        }
    });

    // Update occupant
    Building.occupants.forEach(occupant => {
        if (occupant.name === selectedOccupant.name) {
            // Set destination
            occupant.selectedFloor.name = selectedFloor.name;
            occupant.selectedFloor.value = selectedFloor.value;

            // Set elevator
            occupant.currentElevator = closestElevator.name;
            occupant.ridingElevator = true;
        }
    });


}

// =======USER INPUT FUNCTIONS=======

// Get initial user input to create the building object.
async function setBuildingData() {
    const question = [
        {
            type: 'input',
            name: 'floorCount',
            message: 'How many floors are in this building?',
            validate(value) {
                if (value < 2) {
                    return console.log('You need at least 2 floors.');
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'elevatorCount',
            message: 'How many elevators are in this building?',
            validate(value) {
                if (value < 1) {
                    return console.log('You need at least 1 elevator.');
                }
                return true;
            }
        }
    ];

    Building = await prompt(question);
    Building.occupants = occupants;

    Building.elevators = await makeElevators(Building.elevatorCount, Building.floorCount);
    Building.floors = await makeFloors(Building.floorCount);
}

async function selectOccupant() {
    // Get available occupants
    const availableOccupants = [];
    await occupants.forEach(occupant => {
        if (!occupant.ridingElevator) {
            availableOccupants.push(occupant);
        }
    });

    if (availableOccupants.length === 0) {
        console.log('\nNo occupant to select, all occupants are riding elevators.');
        return false;
    }

    const question = {
        name: 'selectOccupant',
        message: 'Who will be riding?',
        choices: availableOccupants
    };

    const OccupantSelect = new Select(question);
    await OccupantSelect.run()
        .then(async answer => {
            selectedOccupant = {
                name: answer
            };
            console.log(`\n${selectedOccupant.name} will be riding.`);
        });
}

async function selectFloor() {
    // Get available occupants
    const availableOccupants = [];
    await occupants.forEach(occupant => {
        if (!occupant.ridingElevator) {
            availableOccupants.push(occupant);
        }
    });

    if (availableOccupants.length === 0) {
        console.log('\nNo occupant to select, all occupants are riding elevators.');
        return false;
    }

    // Get available elevators
    const availableElevators = [];
    await Building.elevators.forEach(elevator => {
        if (!elevator.inTransit) {
            availableElevators.push(elevator);
        }
    });

    if (availableElevators.length === 0) {
        console.log('\nALERT: All elevators are currently in use.');
        return
    }

    const question = {
        name: 'selectFloor',
        message: 'Pick a floor.',
        choices: Building.floors,
        result(names) {
            return this.map(names);
        }
    };

    const FloorSelect = new Select(question);
    await FloorSelect.run()
        .then(async answer => {
            const name = Object.keys(answer);
            const value = Object.values(answer);
            selectedFloor = {
                name: name[0],
                value: value[0]
            }
            console.log(`You have selected ${selectedFloor.name}.`);
            await getClosestElevator();
        });
}

async function promptUserToKeepPlaying() {
    const question = {
        name: 'keepRiding',
        message: 'Do you want to play another round?',
        choices: ['Yes', 'No']
    };
    const prompt = new Select(question);
    await prompt.run()
        .then(answer => {
            console.log('Answer: ', answer);
            if (answer === 'No') {
                console.log('\n Thanks for playing the elevator game. Goodbye. \n');
                process.exit();
            }
            if (answer === 'Yes') {
                console.log('Time to start another round! \n');
                roundOfElevatorGame();
            }
        })
}

// =======GAME FUNCTIONS=======

async function roundOfElevatorGame() {
    console.log('\n\n ===NEW ROUND=== \n\n')

    console.log('\n ~~~ELEVATOR STATUS: BEGINNING OF ROUND~~~ \n')
    await reportElevatorStatus();

    await selectOccupant();
    await selectFloor();
    await moveElevators();
    await hasOccupantArrived();

    console.log('\n ~~~ELEVATOR STATUS: END OF ROUND~~~ \n')
    await reportElevatorStatus();

    await promptUserToKeepPlaying();
}

async function runGame() {
    await setBuildingData();
    await roundOfElevatorGame()
}

runGame();
