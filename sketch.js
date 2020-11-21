// Oggetto canvas inizializzato come vuoto
let canvas = {};

let population;
let destination;

// Conto i frame mentre vengono mostrati
let count = 0;

// Conto le generazioni passate
let generation = 1;
let generationSinceLastUpdate = 0;

// Durata della vita delle singole auto (espressa in frame)
const lifespan = 500;

// Popolazione auto e percentuale di elitismo da applicare
const carsPopulation = 25;
const elitism = Math.floor(carsPopulation * 0.2);

// Gestisco il valore di convergenza - il numero massimo di generazioni senza che avvenga un miglioramento
const convergence = 20;

// La prima soluzione ottenuta
let firstSolution;
let solutionFound = false;

// L'ultima soluzione ottenuta
let lastSolution;

// Mostra sempre ultimo confronto
let lastRun = false;

// Forza massima dei vettori
const maxForce = 0.2;

// Variabili per verifiche
let maxFitnessAchieved = 0;
let fastTimeAchieved = 0;
let carsCrashed = 0;
let carsCrashedAfterDestination = 0;
let carsCrashedAgainstObstacle = 0;
let carsAtDestination = 0;
let carsCrashedAtStart = 0;

let lifespanDuration;
let maxFitnessPar;
let fastTimePar;
let carsCrashedPar;
let carsCrashedAtStartPar;
let carsCrashedAfterDestinationPar;
let carsCrashedAgainstObstaclePar;
let carsAtDestinationPar;
let currentFitnessPar;
let currentGenerationPar;
let convergencePar;

// Coordinate e dimensioni dell'ostacolo
const rx = 350;
const ry = 150;
const rw = 10;
const rh = 200;

// Funzione di setup di p5.js
function setup() {
    canvas = createCanvas(750, 500);
    centerCanvas();
    population = new Population();

    // Creo un paragrafo usando le funzioni di p5.js
    lifespanDuration = createP();

    maxFitnessPar = createP();
    fastTimePar = createP();
    carsCrashedPar = createP();
    carsCrashedAtStartPar = createP();
    carsCrashedAfterDestinationPar = createP();
    carsCrashedAgainstObstaclePar = createP();
    carsAtDestinationPar = createP();
    currentFitnessPar = createP();
    currentGenerationPar = createP();
    convergencePar = createP();

    // Creo la destinazione da raggiungere
    destination = createVector(width - 50, height/2);

    updateData();
}

// Funzione di disegno canvas di p5.js
function draw() {
    background(0);

    // Bloccare in caso di convergenza e far partire la simulazione fra prima ed ultima soluzione

    population.run();

    // Ad ogni iterazione mostro i frame passati ed aumento il conteggio di 1
    lifespanDuration.html(count);
    count++;

    // console.log("Crashed " + carsCrashed);
    // console.log("Population " + carsPopulation);

    // Se il conteggio dei frame coincide con la durata vitale delle auto, ricomincio da capo
    if(count == lifespan || (carsCrashed + carsAtDestination) == carsPopulation) {

        // population = new Population();

        // Se non ho ottenuto miglioramenti entro un numero stabilito di generazioni, eseguo la simulazione fra la prima soluzione e l'ultima
        if(generationSinceLastUpdate == convergence) {
            population = new Population(firstSolution, lastSolution);
            count = 0;

            if(!lastRun) {
                lastRun = true;
            }
        } else {

            generation++;
            // Invece di creare una nuova popolazione random, creo la nuova generazione a partire da quella attuale
            population.evaluate();
            population.selection();
            count = 0;
        }

        // Reset valori di Controllo
        carsCrashed = 0;
        carsCrashedAfterDestination = 0;
        carsCrashedAgainstObstacle = 0;
        carsAtDestination = 0;
        carsCrashedAtStart = 0;
    }

    fill(255);
    rect(rx, ry, rw, rh);

    // Disegno la destinazione
    ellipse(destination.x, destination.y, 25, 25);
}

// Funzione per centrare il canvas nella pagina
function centerCanvas() {
    let x = (windowWidth - width) / 2;
    let y = (windowHeight - height) / 2;
    canvas.position(x, y);
}

// Funzione richiamata all'evento window resize, che mantiene il canvas centrato
function windowResized() {
    centerCanvas();
}

function updateData() {
    currentGenerationPar.html("Current generation: " + generation);
    maxFitnessPar.html("Max fitness achieved: " + maxFitnessAchieved);
    // Divido o moltiplico per 10 per compensare la normalizzazione inserita nella funzione calculateFitness()
    fastTimePar.html("Fastest time achieved: " + (lifespan * (1 - fastTimeAchieved / 10)) + " - Time: " + (fastTimeAchieved * 10));
    carsCrashedPar.html("Cars crashed: " + carsCrashed);
    carsCrashedAtStartPar.html("Cars crashed at start: " + carsCrashedAtStart);
    carsCrashedAfterDestinationPar.html("Cars crashed after destination: " + carsCrashedAfterDestination);
    carsCrashedAgainstObstaclePar.html("Cars crashed against obstacle: " + carsCrashedAgainstObstacle);
    carsAtDestinationPar.html("Cars at destination: " + carsAtDestination);
    convergencePar.html("Generations since last valuable update: " + generationSinceLastUpdate + " - Convergence value: " + convergence);
}

// Gestisco la popolazione delle mie auto
function Population(...twoCars) {

    // Preparo un array vuoto che conterà la mia popolazione (o parco) auto
    if(twoCars.length > 0) {
        /*twoCars[0].completed = false;
        twoCars[0].near = false;
        twoCars[0].crashed = false;
        twoCars[1].completed = false;
        twoCars[1].near = false;
        twoCars[1].crashed = false;*/
        this.cars = resetCars(twoCars);
    } else {
        this.cars = [];
    }

    // Preparo un array che conterrà le auto migliori della generazione
    this.eliteCars = [];

    // Imposto una proprietà che gestisca quanto sarà numerosa la popolazione
    if(twoCars.length > 0) {
        this.size = twoCars.length;
    } else {
        this.size = carsPopulation;
    }

    // Gestisco una sorta di nuova generazione, che prenderà gli elementi migliori della generazione precedente
    this.matingPool = [];

    // Genero la popolazione (o parco) auto
    if(twoCars.length <= 0) {
        for (var i = 0; i < this.size; i++) {
            this.cars[i] = new Car();
        }
    }

    // Richiamo la funzione che, sulle singole auto, calcola il suo grado di adattamento
    this.evaluate = function() {

        let maxFitness = 0;
        let fastestTiming = 0;

        for (var i = 0; i < this.size; i++) {
            this.cars[i].calculateFitness();

            // Isolo il valore di adattabilità maggiore della generazione corrente
            if(this.cars[i].fitness > maxFitness) {
                maxFitness = this.cars[i].fitness;
            }

            // Isolo il valore di tempistica minore
            if(this.cars[i].timing > fastestTiming) {
                fastestTiming = this.cars[i].timing;
            }
        }

        // Controllo se ho superato il valore adattabilità massimo raggiunto
        if(maxFitness > maxFitnessAchieved) {
            maxFitnessAchieved = maxFitness;
            generationSinceLastUpdate = 0;
        } else {
            // Se non ho ottenuto miglioramenti aggiungo 1 al valore di controllo per la convergenza
            generationSinceLastUpdate++;
        }

        // Controllo il tempo più veloce al raggiungimento della destinazione
        if(fastestTiming > fastTimeAchieved) {
            fastTimeAchieved = fastestTiming;
        }

        updateData();
        currentFitnessPar.html("Current max fitness: " + maxFitness);

        // Normalizzo il valore di adattabilità in modo che resti fra 0 e 1
        // Esiste una probabilità di divisione per 0 (bug), ma non ce ne preoccupereremo in questo contesto
        for (var i = 0; i < this.size; i++) {
            this.cars[i].fitness /= maxFitness;

            // Recupero al massimo il 20% degli individui della generazione precedente che hanno raggiunto almeno il 90% di adattabilità per quella generazione
            if(this.cars[i].fitness >= 0.9 && this.eliteCars.length <= elitism) {
                this.eliteCars.push(this.cars[i]);
            }

            if(!solutionFound && this.cars[i].completed) {
                solutionFound = true;
                firstSolution = this.cars[i];
            }

            if(this.cars[i].fitness == 1) {
                lastSolution = this.cars[i];
            }
        }

        this.matingPool = [];
        for (var i = 0; i < this.size; i++) {
            // Moltiplico il valore di fitness per 100 in modo da favorire la presenza di auto con un valore adattabilità maggiore
            // Esempio: un'auto con il valore adattabilità 1, sarà presente 100 volte, mentre un'auto con valore adattabilità 0.3 sarà presente solo 3 volte.
            let n = this.cars[i].fitness * 100;
            for (var j = 0; j < n; j++) {
                this.matingPool.push(this.cars[i]);
            }
        }
    }

    // Creo una funzione di selezione "naturale", che prenda in modo casuale due "genitori" fra tutti gli elementi inseriti nell'array matingPool
    this.selection = function() {
        let newCars = [];

        // Per ogni auto creo una nuova generazione con il "codice genetico" recuperato dalla generazione attuale
        for (var i = 0; i < this.cars.length - this.eliteCars.length; i++) {

            // Recupero il "dna" dei due genitori casuali
            let parentA = random(this.matingPool).dna;
            let parentB = random(this.matingPool).dna;

            // Genero il nuovo DNA tramite crossover dei DNA dei genitori
            let child = parentA.crossover(parentB);

            // Richiamo la funzione che introduce mutazioni nel codice dei vettori
            child.mutation();

            // Genero la nuova auto passando il "codice genetico" ottenuto dall'incrocio di due genitori
            newCars[i] = new Car(child);
        }

        // Aggiungo gli elementi migliori della generazione precedente
        for (var i = 0; i < this.eliteCars.length; i++) {
            newCars.push(new Car(this.eliteCars[i].dna, 'rgba(255,0,0, 1)'));
        }

        // Aggiorno l'attuale popolazione con la nuova generazione
        this.cars = newCars;

        // Svuoto l'array di auto elite
        this.eliteCars = [];

    }


    // Per ogni auto eseguo le funzioni update() e show()
    this.run = function() {
        for (var i = 0; i < this.size; i++) {
            this.cars[i].update();
            this.cars[i].show();
        }
    }
}

// Creo l'oggetto dna (anche se parliamo di auto), che gestirà le proprietà (o geni) delle singole vetture
function DNA(genes) {

    // Se il parametro genes è valorizzato, lo uso come base di partenza, altrimenti produco casualmente dei geni nuovi
    if(genes) {
        this.genes = genes;
    } else {
        // Preparo un array di geni dove memorizzare le proprietà per le singole auto
        this.genes = [];

        // Per ogni frame di durata della vita della singola auto, inserisco un vettore random nel suo corredo genetico
        for (var i = 0; i < lifespan; i++) {
            this.genes[i] = p5.Vector.random2D();

            // Lunghezza arbitraria del vettore
            this.genes[i].setMag(maxForce);
        }
    }

    // Incrocio i valori dei geni di due DNA
    this.crossover = function(partner) {
        let newGenes = [];

        // Recupero un valore casuale fra 0 e la lunghezza dell'array genes
        let midPoint = floor(random(this.genes.length));
        for (var i = 0; i < this.genes.length; i++) {

            // Se mi trovo prima del midPoint prendo i geni dall'attuale dna, altrimenti prendo i geni dal dna del partner
            if(i > midPoint) {
                newGenes[i] = this.genes[i];
            } else {
                newGenes[i] = partner.genes[i];
            }

        }
        // Restituisco un nuovo oggetto DNA con il nuovo "codice genetico", passato come array
        return new DNA(newGenes);
    }

    // Inserisco una sorta di mutazione. Per ogni gene dell'array, se recupero un valore random minore all'1%, sostituisco il gene con un nuovo gene generato casualmente
    this.mutation = function() {
        for (var i = 0; i < this.genes.length; i++) {
            if(random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();

                // Lunghezza arbitraria del vettore
                this.genes[i].setMag(maxForce);
            }
        }
    }
}

// Creo l'oggetto Car per gestire le singole proprietà della mia auto
function Car(dna, color) {

    // Creo le proprietà base per la nostra auto
    this.position = createVector(0, height/2);
    this.velocity = createVector();
    this.acceleration = createVector();

    // Controllo se sono vicino la destinazione
    this.near = false;

    // Controllo se raggiungo la destinazione
    this.completed = false;

    // Controllo se ho colpito ostacoli
    this.crashed = false;
    this.crashedAfterDestination = false;
    this.crashedAtStart = false;

    // Provo ad implementare un parametro per la rapidità di raggiungimento traguardo
    this.timing = 0;

    // Registro evento (near, completed o crashed) una singola volta
    this.eventCompleted = false;

    // Gestisco l'apparenza delle auto
    if(color) {
        this.color = color;
    } else {
        this.color = 'rgba(255,255,255, 0.5)';
    }

    // Ogni auto ha il suo dna personale. Se l'auto è stata generata con un codice genetico, utilizzo il dna ricevuto. Altrimenti genero un dna casuale.
    if(dna) {
        this.dna = dna;
    } else {
        this.dna = new DNA();
    }


    // Imposto la variabile fitness a 0, in modo da avere un valore adattabilità di partenza uguale per tutte le auto
    this.fitness = 0;

    // Creo la funzione che si occuperò di applicare la forza alla proprietà accelerazione
    this.applyForce = function(force) {
        this.acceleration.add(force);
    }

    // Calcolo il grado di adattamento all'ambiente (sulla base della vicinanza alla destinazione)
    this.calculateFitness = function() {

        // Recupero la distanza fra la singola auto e la destinazione
        let distance = dist(this.position.x, this.position.y, destination.x, destination.y);

        // Calcolo il valore di adattabilità sulla base della distanza fra l'auto e la destinazione, mappando il valore distance con l'altezza della finestra ed invertendo questo valore
        this.fitness = map(distance, 0, width, width, 0);
        this.timing /= 10;

        if(this.near && !this.crashedAfterDestination) {
            this.fitness *= this.timing;
        }

        // Se l'auto raggiunge la destinazione, la sua adattabilità viene aumentata
        if(this.completed) {
            this.fitness *= 10;
        }

        // Se l'auto colpisce l'ostacolo, la sua adattabilità viene ridimensionata
        if(this.crashed) {
            let malus = 10;
            //this.fitness /= 10;

            // Se l'auto colpisce un ostacolo dopo aver superato la destinazione, diminuisco ulteriormente l'adattabilità
            if(this.crashedAfterDestination) {

                malus *= 20;

                if(this.near) {
                    malus *= 10;
                }
            }

            if(this.crashedAtStart) {
                malus *= 20;
            }

            this.fitness /= malus;
        }
    }

    // Creo la funzione di update che aggiornerà le proprietà della nostra auto
    this.update = function() {

        // Calcolo la distanza fra auto e destinazione
        let distance = dist(this.position.x, this.position.y, destination.x, destination.y);

        // Se l'auto arriva nei pressi della destinazione, registro l'evento per calcolare il tempo impiegato
        if(distance < 30 && !this.near) {
            this.near = true;
            this.timing = map(count, 1, lifespan, 100, 1);
        }

        // Se l'auto si trova entro 10px dalla destinazione la considero arrivata
        if(distance < 10 && !this.completed) {
            this.completed = true;
            this.timing = map(count, 1, lifespan, 100, 1);

            console.log(this.timing);

            // Registro auto arrivata a destinazione
            carsAtDestination++;
        }

        // Controllo la collisione con l'ostacolo
        if((this.position.x > rx && this.position.x < rx + rw && this.position.y > ry && this.position.y < ry + rh) && !this.crashed) {
            this.crashed = true;

            // Registro auto distrutta contro l'ostacolo
            carsCrashed++;
            carsCrashedAgainstObstacle++;
        }

        // Controllo la collisione con i bordi dell'area
        if((this.position.x > width || this.position.x < 0) && !this.crashed) {
            this.crashed = true;

            // Registro auto distrutta
            carsCrashed++;

            if(this.position.x > width && !this.crashedAfterDestination) {
                this.crashedAfterDestination = true;

                // Registro auto distrutta dopo la destinazione
                carsCrashedAfterDestination++;
            }

            if(this.position.x < 0 && !this.crashedAtStart) {
                // Registro auto distrutta alla partenza
                carsCrashedAtStart++;
            }
        }

        if((this.position.y > height || this.position.y < 0) && !this.crashed) {
            this.crashed = true;

            // Registro auto distrutta
            carsCrashed++;
        }

        // Ad ogni frame di vita dell'auto, applicheremo uno dei geni (che contiene un vettore random) alla nostra auto, per farla muovere
        this.applyForce(this.dna.genes[count]);

        //console.log(carsCrashed);

        // L'auto si deve muovere solo se non è ancora giunta a destinazione
        if((!this.completed && !this.crashed) || lastRun) {

            // Aggiungo l'accelerazione alla velocità
            this.velocity.add(this.acceleration);

            // Uso la velocità per determinare la nuova posizione
            this.position.add(this.velocity);

            // Reset dell'accelerazione (moltiplicazione per zero)
            this.acceleration.mult(0);

            // Aggiungo un limite alla velocità
            this.velocity.limit(4);
        }

    }

    // Creo la funzione che mostrerà a video la mia auto
    this.show = function() {

        // Uso push() all'inizio e pop() alla fine per non influenzare altri oggetti auto
        push();

        // Gestisco l'apparenza grafica eliminando i bordi ed aggiungendo una leggera trasparenza alle singole auto
        noStroke();
        fill(this.color);

        // Uso translate per orientare la mia auto nella direzione in cui si muove
        translate(this.position.x, this.position.y);
        rotate(this.velocity.heading());

        // Disegno un rettangolo che rappresenti la mia auto
        rectMode(CENTER);
        rect(0, 0, 25, 5);

        // Uso push() all'inizio e pop() alla fine per non influenzare altri oggetti auto
        pop();
    }
}

function resetCars(cars) {
    for (var i = 0; i < cars.length; i++) {
        cars[i].position = createVector(0, height/2);
        cars[i].velocity = createVector();
        cars[i].acceleration = createVector();
    }
    return cars;
}
