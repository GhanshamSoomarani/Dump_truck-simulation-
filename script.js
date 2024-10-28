
let trucks = [];
let loadingQueue = [];
let weighingQueue = [];
let travelQueue = [];
let completedQueue = [];
let scaleBusy = false;
let loadersBusy = {}; 
let travelingTrucks = []; 


function createInputFields() {
    const container = document.getElementById('inputFields');
    const numTrucks = parseInt(document.getElementById('numTrucks').value) || 1;
    container.innerHTML = '';  

    for (let i = 1; i <= numTrucks; i++) {
        container.innerHTML += `
            <tr>
                <td>Truck ${i}</td>
                <td><input type="number" id="loadingTime${i}" value="${getRandomTime()}" /> seconds</td>
                <td><input type="number" id="weighingTime${i}" value="${getRandomTime()}" /> seconds</td>
                <td><input type="number" id="travelTime${i}" value="${getRandomTime()}" /> seconds</td>
            </tr>
        `;
    }
}


function getRandomTime() {
    return Math.floor(Math.random() * 10) + 5;
}


function createScales() {
    const numScales = parseInt(document.getElementById('numScales').value) || 1;
    const scalesContainer = document.getElementById('scales');
    scalesContainer.innerHTML = ''; 

    for (let i = 1; i <= numScales; i++) {
        scalesContainer.innerHTML += `
            <div id="scale${i}" class="process scale" aria-live="polite">Idle</div>
        `;
    }
}


function createLoaders() {
    const numLoaders = parseInt(document.getElementById('numLoaders').value) || 2; 
    const loadersContainer = document.getElementById('loaders');
    loadersContainer.innerHTML = ''; 

    for (let i = 1; i <= numLoaders; i++) {
        loadersContainer.innerHTML += `
            <div id="loader${i}" class="process loader" aria-live="polite">Idle</div>
        `;
    }
}


function initializeSimulation() {
    trucks = [];
    loadingQueue = [];
    weighingQueue = [];
    travelQueue = [];
    completedQueue = [];
    
    const numLoaders = parseInt(document.getElementById('numLoaders').value) || 2; 
    initializeLoaders(numLoaders); // Initialize loaders

    const numTrucks = parseInt(document.getElementById('numTrucks').value) || 1;

    for (let i = 1; i <= numTrucks; i++) {
        let truck = {
            name: `Truck ${i}`,
            loadingTime: parseInt(document.getElementById(`loadingTime${i}`).value) * 1000, 
            weighingTime: parseInt(document.getElementById(`weighingTime${i}`).value) * 1000,
            travelTime: parseInt(document.getElementById(`travelTime${i}`).value) * 1000  
        };
        trucks.push(truck);
    }

    loadingQueue = trucks.slice();  
    updateLoadingQueueDisplay();

    
    startSimulation();
}

function initializeLoaders(numLoaders) {
    for (let i = 1; i <= numLoaders; i++) {
        loadersBusy[`loader${i}`] = false;
    }
}


function updateLoadingQueueDisplay() {
    const loadingQueueDiv = document.getElementById('loadingQueue');
    loadingQueueDiv.innerHTML = ''; 
    loadingQueue.forEach(truck => {
        loadingQueueDiv.innerHTML += `<div class="truck">${truck.name}</div>`;
    });
}


function updateWeighingQueueDisplay() {
    const weighingQueueDiv = document.getElementById('weighingQueue');
    weighingQueueDiv.innerHTML = '';  
    weighingQueue.forEach(truck => {
        weighingQueueDiv.innerHTML += `<div class="truck">${truck.name}</div>`;
    });
}

// Update the travel queue display
function updateTravelQueueDisplay() {
    const travelQueueDiv = document.getElementById('travelQueue');
    travelQueueDiv.innerHTML = '';  
    travelingTrucks.forEach(truck => {
        travelQueueDiv.innerHTML += `<div class="truck traveling">${truck.name} (Traveling)</div>`; 
    });
}


function updateCompletedQueueDisplay() {
    const completedQueueDiv = document.getElementById('completedQueue');
    completedQueueDiv.innerHTML = ''; 
    completedQueue.forEach(truck => {
        completedQueueDiv.innerHTML += `<div class="truck">${truck.name}</div>`;
    });
}

// Start the manual simulation
function startSimulation() {
    processTrucks();  
}


function processTrucks() {

    const loaders = document.querySelectorAll('.loader');
    loaders.forEach(loader => {
        const loaderId = loader.id;
        if (!loadersBusy[loaderId] && loadingQueue.length > 0) {
            loadTruck(loaderId, loadingQueue.shift());
        }
    });

    // Process the scales
    const scales = document.querySelectorAll('.scale');
    let scaleAvailable = Array.from(scales).some(scale => !scale.classList.contains('busy'));

    if (scaleAvailable && weighingQueue.length > 0) {
        moveTruckToScale(weighingQueue.shift());
    }

 
    while (travelQueue.length > 0) {
        const nextTruck = travelQueue.shift();
        startTravel(nextTruck); 
    }

  
    setTimeout(() => {
        processTrucks();
    }, 1000);  // Check every 1 second
}

// Function to load a truck at the loader
function loadTruck(loaderId, truck) {
    loadersBusy[loaderId] = true;
    document.getElementById(loaderId).classList.add('busy'); // Set loader to busy
    document.getElementById(loaderId).innerHTML = `<div class="truck">${truck.name}</div>`;

 
    updateLoadingQueueDisplay();

    setTimeout(() => {
        document.getElementById(loaderId).classList.remove('busy'); 
        document.getElementById(loaderId).innerHTML = 'Idle';
        loadersBusy[loaderId] = false;
        moveTruckToWeighingQueue(truck);  
        updateLoadingQueueDisplay();
    }, truck.loadingTime);
}

// Move a truck to the weighing queue
function moveTruckToWeighingQueue(truck) {
    weighingQueue.push(truck);
    updateWeighingQueueDisplay();
}

// Move a truck to the scale for weighing
function moveTruckToScale(truck) {
    const scales = document.querySelectorAll('.scale');
    let assigned = false;

    for (let scale of scales) {
        if (!scale.classList.contains('busy') && !assigned) {
            scaleBusy = true;
            assigned = true;

            scale.classList.add('busy'); // Set scale to busy
            scale.innerHTML = `<div class="truck">${truck.name}</div>`;

            // Remove the truck from the weighing queue display immediately
            weighingQueue = weighingQueue.filter(t => t !== truck);
            updateWeighingQueueDisplay();

            setTimeout(() => {
                scale.classList.remove('busy'); // Set scale to free
                scale.innerHTML = 'Idle';
                scaleBusy = false;
                moveTruckToTravelQueue(truck);  // Move truck to the travel queue after weighing
            }, truck.weighingTime);
        }
    }

    if (!assigned) {
        weighingQueue.unshift(truck); // Reinsert the truck if no scale was available
    }
}

// Move a truck to the travel queue
function moveTruckToTravelQueue(truck) {
    travelQueue.push(truck);
}

// Start traveling for a truck
function startTravel(truck) {
    if (travelingTrucks.includes(truck)) return; // If the truck is already traveling, do nothing

    travelingTrucks.push(truck); // Add the truck to the traveling array

    // Add the traveling truck to the display
    const travelQueueDiv = document.getElementById('travelQueue');
    travelQueueDiv.innerHTML += `<div class="truck traveling">${truck.name} (Traveling)</div>`; // Indicate that it’s traveling

    setTimeout(() => {
        moveTruckToCompletedQueue(truck);  // Move the truck to the completed queue after traveling
        travelingTrucks = travelingTrucks.filter(t => t !== truck);  // Remove the truck from the traveling array
        updateTravelQueueDisplay();  // Update the travel queue display after travel is completed
    }, truck.travelTime);  // Each truck travels for its own unique time
}

// Move the truck to the completed queue after travel completes
function moveTruckToCompletedQueue(truck) {
    completedQueue.push(truck);
    updateCompletedQueueDisplay();  // Update completed queue display
}



// Initial function call to create input fields for 9 trucks by default
createInputFields();
createScales(); // Call to create one scale by default
createLoaders(); // Call to create two loaders by default
