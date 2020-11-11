// Oggetto canvas inizializzato come vuoto
let canvas = {};

let population;
let lifespanDuration;
let destination;

// Conto i frame mentre vengono mostrati
let count = 0;

// Durata della vita delle singole auto (espressa in frame)
const lifespan = 500;
const carsPopulation = 25;

// Forza massima dei vettori
const maxForce = 0.2;

// Variabili per verifiche
let maxFitnessAchieved = 0;
let fastTimeAchieved = 100;
let carsCrashed = 0;
let carsCrashedAfterDestination = 0;
let carsCrashedAgainstObstacle = 0;
let carsAtDestination = 0;

let maxFitnessPar;
let fastTimePar;
let carsCrashedPar;
let carsCrashedAfterDestinationPar;
let carsCrashedAgainstObstaclePar;
let carsAtDestinationPar;
let currentFitnessPar;

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
    carsCrashedAfterDestinationPar = createP();
    carsCrashedAgainstObstaclePar = createP();
    carsAtDestinationPar = createP();
    currentFitnessPar = createP();

    // Creo la destinazione da raggiungere
    destination = createVector(width - 50, height/2);
}

// Funzione di disegno canvas di p5.js
function draw() {
    background(0);
    population.run();

    // Ad ogni iterazione mostro i frame passati ed aumento il conteggio di 1
    lifespanDuration.html(count);
    count++;

    // Se il conteggio dei frame coincide con la durata vitale delle auto, ricomincio da capo
    // Va modificato il modo in cui vengono contate le auto che si fermano (spostare conteggio in update())
    if(count == lifespan || carsCrashed == carsPopulation) {

        // population = new Population();

        // Invece di creare una nuova popolazione random, creo la nuova generazione a partire da quella attuale
        population.evaluate();
        population.selection();
        count = 0;

        // Reset valori di Controllo
        carsCrashed = 0;
        carsCrashedAfterDestination = 0;
        carsCrashedAgainstObstacle = 0;
        carsAtDestination = 0;
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
    maxFitnessPar.html("Max fitness achieved: " + maxFitnessAchieved);
    fastTimePar.html("Fastest time achieved: " + fastTimeAchieved);
    carsCrashedPar.html("Cars crashed: " + carsCrashed);
    carsCrashedAfterDestinationPar.html("Cars crashed after destination: " + carsCrashedAfterDestination);
    carsCrashedAgainstObstaclePar.html("Cars crashed against obstacle: " + carsCrashedAgainstObstacle);
    carsAtDestinationPar.html("Cars at destination: " + carsAtDestination);
}

// Gestisco la popolazione delle mie auto
function Population() {

    // Preparo un array vuoto che conterà la mia popolazione (o parco) auto
    this.cars = [];

    // Imposto una proprietà che gestisca quanto sarà numerosa la popolazione
    this.size = carsPopulation;

    // Gestisco una sorta di nuova generazione, che prenderà gli elementi migliori della generazione precedente
    this.matingPool = [];

    // Genero la popolazione (o parco) auto
    for (var i = 0; i < this.size; i++) {
        this.cars[i] = new Car();
    }

    // Richiamo la funzione che, sulle singole auto, calcola il suo grado di adattamento
    this.evaluate = function() {

        let maxFitness = 0;
        let fastestTiming = 100;

        for (var i = 0; i < this.size; i++) {
            this.cars[i].calculateFitness();

            // Isolo il valore di adattabilità maggiore della generazione corrente
            if(this.cars[i].fitness > maxFitness) {
                maxFitness = this.cars[i].fitness;
            }

            // Isolo il valore di tempistica minore
            if(this.cars[i].timing < fastestTiming) {
                fastestTiming = this.cars[i].timing;
            }
        }

        console.log("ULTRA BANANE MEGA " + fastestTiming);

        // Controllo se ho superato il valore adattabilità massimo raggiunto
        if(maxFitness > maxFitnessAchieved) {
            maxFitnessAchieved = maxFitness;
        }

        // Controllo il tempo più veloce al raggiungimento della destinazione
        if(fastestTiming < fastTimeAchieved) {
            fastTimeAchieved = fastestTiming;
            console.log("ULTRA BANANE " + fastTimeAchieved);
        }

        updateData();
        currentFitnessPar.html("Current max fitness: " + maxFitness);

        // Normalizzo il valore di adattabilità in modo che resti fra 0 e 1
        // Esiste una probabilità di divisione per 0 (bug), ma non ce ne preoccupereremo in questo contesto
        for (var i = 0; i < this.size; i++) {
            this.cars[i].fitness /= maxFitness;
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

        // Creo una funzione di selezione "naturale", che prenda in modo casuale due "genitori" fra tutti gli elementi inseriti nell'array matingPool
        this.selection = function() {
            let newCars = [];

            // Per ogni auto creo una nuova generazione con il "codice genetico" recuperato dalla generazione attuale
            for (var i = 0; i < this.cars.length; i++) {

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

            // Aggiorno l'attuale popolazione con la nuova generazione
            this.cars = newCars;

        }

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
function Car(dna) {

    // Creo le proprietà base per la nostra auto
    this.position = createVector(0, height/2);
    this.velocity = createVector();
    this.acceleration = createVector();

    // Controllo se sono vicino la destinazione
    this.near = false;

    // Controllo se raggiungo la destinazione
    this.completed = false;

    // Controllo se ho colpito l'ostacolo
    this.crashed = false;
    this.crashedAftedDestination = false;
    this.crashedAgainstObstacle = false;

    // Provo ad implementare un parametro per la rapidità di raggiungimento traguardo
    this.timing = 0;

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

        if(this.near) {
            this.fitness *= this.timing;
        }

        // Se l'auto raggiunge la destinazione, la sua adattabilità viene aumentata
        if(this.completed) {
            this.fitness *= 10;
            carsAtDestination++;
        }

        // Se l'auto colpisce l'ostacolo, la sua adattabilità viene ridimensionata
        if(this.crashed) {
            this.fitness /= 10;
            carsCrashed++;

            // Se l'auto colpisce un ostacolo dopo aver superato la destinazione, diminuisco ulteriormente l'adattabilità
            if(this.crashedAftedDestination) {
                this.fitness /= 10;
                carsCrashedAfterDestination++;
            }

            if(this.crashedAgainstObstacle) {
                carsCrashedAgainstObstacle++;
            }
        }

    }

    // Creo la funzione di update che aggiornerà le proprietà della nostra auto
    this.update = function() {

        // Se la distanza fra l'auto e la destinazione è inferiore a 10px, considero l'auto giunta correttamente a destinazione
        let distance = dist(this.position.x, this.position.y, destination.x, destination.y);

        // Se l'auto arriva nei pressi della destinazione, registro l'evento per calcolare il tempo impiegato
        if(distance < 30 && !this.near) {
            this.near = true;
            this.timing = map(count, 0, lifespan, 100, 0);
        }

        if(distance < 10) {
            this.completed = true;
        }

        // Controllo la collisione con l'ostacolo
        if(this.position.x > rx && this.position.x < rx + rw && this.position.y > ry && this.position.y < ry + rh) {
            this.crashed = true;
            this.crashedAgainstObstacle = true;
        }

        // Controllo la collisione con i bordi dell'area
        if(this.position.x > width || this.position.x < 0) {
            this.crashed = true;

            if(this.position.x > width) {
                this.crashedAftedDestination = true;
            }
        }

        if(this.position.y > height || this.position.y < 0) {
            this.crashed = true;
        }

        // Ad ogni frame di vita dell'auto, applicheremo uno dei geni (che contiene un vettore random) alla nostra auto, per farla muovere
        this.applyForce(this.dna.genes[count]);

        // L'auto si deve muovere solo se non è ancora giunta a destinazione
        if(!this.completed && !this.crashed) {

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
        fill(255, 150);

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
