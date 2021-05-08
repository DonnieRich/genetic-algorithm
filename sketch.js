const s = ( sketch ) => {
    
    // Oggetto canvas inizializzato come vuoto
    let canvas = {};

    let population;
    let obstacles = [];
    const numberOfObstacles = 50;
    let destination;

    // Conto i frame mentre vengono mostrati
    let count = 0;

    // Conto le generazioni passate
    let generation = 1;
    let generationSinceLastUpdate = 0;

    // Durata della vita delle singole auto (espressa in frame)
    const lifespan = 500;

    // Popolazione auto e percentuale di elitismo da applicare
    let carsPopulation = 25;
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

    // Funzione di setup di p5.js
    sketch.setup = () => {
        canvas = sketch.createCanvas(750, 500);
        //canvas.parent('sketch');

        population = new sketch.Population();

        sketch.newObstaclesSet(numberOfObstacles);

        // Creo un paragrafo usando le funzioni di p5.js
        lifespanDuration = sketch.createP();
        lifespanDuration.addClass("infos");

        sketch.createP("-- Global data --");

        currentGenerationPar = sketch.createP();
        currentGenerationPar.addClass("infos");

        convergencePar = sketch.createP();
        convergencePar.addClass("infos");

        maxFitnessPar = sketch.createP();
        maxFitnessPar.addClass("infos");

        fastTimePar = sketch.createP();
        fastTimePar.addClass("infos");

        sketch.createP("-- Previous generation data --");

        carsCrashedPar = sketch.createP();
        carsCrashedPar.addClass("infos");

        carsCrashedAtStartPar = sketch.createP();
        carsCrashedAtStartPar.addClass("infos");

        carsCrashedAfterDestinationPar = sketch.createP();
        carsCrashedAfterDestinationPar.addClass("infos");

        carsCrashedAgainstObstaclePar = sketch.createP();
        carsCrashedAgainstObstaclePar.addClass("infos");

        carsAtDestinationPar = sketch.createP();
        carsAtDestinationPar.addClass("infos");
        
        currentFitnessPar = sketch.createP();
        currentFitnessPar.addClass("infos");

        // Creo la destinazione da raggiungere
        destination = sketch.createVector(sketch.width - 50, sketch.height/2);

        sketch.updateData();
    }

    // Funzione di disegno canvas di p5.js
    sketch.draw = () => {
        sketch.background(0);

        // Bloccare in caso di convergenza e far partire la simulazione fra prima ed ultima soluzione

        population.run();

        // Ad ogni iterazione mostro i frame passati ed aumento il conteggio di 1
        lifespanDuration.html(`Current frame ${count}`);
        count++;

        // Se il conteggio dei frame coincide con la durata vitale delle auto, ricomincio da capo
        if(count == lifespan || (carsCrashed + carsAtDestination) == carsPopulation) {

            // Se non ho ottenuto miglioramenti entro un numero stabilito di generazioni, eseguo la simulazione fra la prima soluzione e l'ultima
            if(generationSinceLastUpdate == convergence) {
                population = new sketch.Population(firstSolution, lastSolution);
                count = 0;

                if(!lastRun) {
                    lastRun = true;
                    carsPopulation = 2;
                }
            } else {

                generation++;
                // Invece di creare una nuova popolazione random, creo la nuova generazione a partire da quella attuale
                population.evaluate();
                population.selection();
                count = 0;

            }

            obstacles = obstacles.map(function(element) {
                return new sketch.Obstacle(element.x, element.y, 30, element.dna);
            });

            // Reset valori di Controllo
            carsCrashed = 0;
            carsCrashedAfterDestination = 0;
            carsCrashedAgainstObstacle = 0;
            carsAtDestination = 0;
            carsCrashedAtStart = 0;


        }

        obstacles.forEach(function(element) {
            element.update();
            element.show();
        });

        // Disegno la destinazione
        sketch.ellipse(destination.x, destination.y, 25, 25);
    }

    sketch.updateData = () => {
        currentGenerationPar.html(`Current generation: ${generation}`);
        maxFitnessPar.html(`Max fitness achieved: ${parseInt(maxFitnessAchieved)}`);
        
        // Divido per 10 per compensare la normalizzazione inserita nella funzione calculateFitness()
        let timeInFrames = parseInt(lifespan * (1 - fastTimeAchieved / 10));
        fastTimePar.html(`Fastest time achieved (in frames): ${timeInFrames} / ${lifespan}`);
        carsCrashedPar.html(`Cars crashed: ${carsCrashed}`);
        carsCrashedAtStartPar.html(`Cars crashed at start: ${carsCrashedAtStart}`);
        carsCrashedAfterDestinationPar.html(`Cars crashed after destination: ${carsCrashedAfterDestination}`);
        carsCrashedAgainstObstaclePar.html(`Cars crashed against obstacle: ${carsCrashedAgainstObstacle}`);
        carsAtDestinationPar.html(`Cars at destination: ${carsAtDestination}`);
        convergencePar.html(`Generations since last valuable update: ${generationSinceLastUpdate} - Convergence value: ${convergence}`);
    }

    sketch.Obstacle = function (x = false, y = false, scatter = 30, dna = {}) {

        let startX = sketch.getRndInteger(sketch.width/2 + 30, sketch.width - 30);
        let startY = sketch.getRndInteger(30, sketch.height - 30);

        let rndAngleValue = sketch.getRndInteger(0, 1);
        let phi = rndAngleValue * 2 * Math.PI;

        x = x !== false ? x : startX + Math.round(scatter * Math.cos(phi));
        y = y !== false ? y : startY + Math.round(scatter * Math.sin(phi));

        this.x = x;
        this.y = y;

        this.r = 2.5;

        this.position = sketch.createVector(x, y);
        this.velocity = sketch.createVector();
        this.acceleration = sketch.createVector();

        if(Object.keys(dna).length > 0) {
            this.dna = dna;
        } else {
            this.dna = new sketch.DNA();
        }

        // Creo la funzione che si occuperò di applicare la forza alla proprietà accelerazione
        this.applyForce = function(force) {
            this.acceleration.add(force);
        }

        // Creo la funzione di update che aggiornerà le proprietà della nostra auto
        this.update = function() {

            // Controllo la collisione con i bordi dell'area
            if (this.position.x > sketch.width - this.r) {
                this.position.x = sketch.width - this.r;
                this.velocity.x *= -1;
            } else if (this.position.x < this.r) {
                this.position.x = this.r;
                this.velocity.x *= -1;
            } else if (this.position.y > sketch.height - this.r) {
                this.position.y = sketch.height - this.r;
                this.velocity.y *= -1;
            } else if (this.position.y < this.r) {
                this.position.y = this.r;
                this.velocity.y *= -1;
            }

            // Ad ogni frame di vita dell'auto, applicheremo uno dei geni (che contiene un vettore random) alla nostra auto, per farla muovere
            this.applyForce(this.dna.genes[count]);

            // Aggiungo l'accelerazione alla velocità
            this.velocity.add(this.acceleration);

            // Uso la velocità per determinare la nuova posizione
            this.position.add(this.velocity);

            // Reset dell'accelerazione (moltiplicazione per zero)
            this.acceleration.mult(0);

            // Aggiungo un limite alla velocità
            this.velocity.limit(4);

        }

        this.show = function() {

            // Uso push() all'inizio e pop() alla fine per non influenzare altri oggetti auto
            sketch.push();

            // Gestisco l'apparenza grafica eliminando i bordi ed aggiungendo una leggera trasparenza alle singole auto
            sketch.noStroke();
            sketch.fill(255);

            sketch.ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);

            // Uso push() all'inizio e pop() alla fine per non influenzare altri oggetti auto
            sketch.pop();
        }
    }

    sketch.newObstaclesSet = (n) => {
        let distance = 30;

        while (obstacles.length < n) {
            
            let obst = new sketch.Obstacle();

            if (obstacles.length > 0) {
                let prevObst = obstacles[obstacles.length - 1];
                distance = sketch.dist(obst.position.x, obst.position.y, prevObst.position.x, prevObst.position.y);
            }

            if (distance >= 30) {
                obstacles.push(obst);
            }
        }
    }

    sketch.getRndInteger = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }

    // Gestisco la popolazione delle mie auto
    sketch.Population = function (...twoCars) {

        // Preparo l'array che conterrà le mie auto
        this.cars = [];

        // Preparo un array che conterrà le auto migliori della generazione
        this.eliteCars = [];

        // Imposto una proprietà che gestisca quanto sarà numerosa la popolazione
        this.size = carsPopulation;

        // Gestisco una sorta di nuova generazione, che prenderà gli elementi migliori della generazione precedente
        this.matingPool = [];

        // Genero la popolazione (o parco) auto
        if(twoCars.length <= 0) {
            for (var i = 0; i < this.size; i++) {
                this.cars[i] = new sketch.Car();
            }
        } else {
            this.size = twoCars.length;
            this.cars = twoCars.map( (car) => {
                car.resetCar();
                return car;
            });
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

            sketch.updateData();
            currentFitnessPar.html(`Max fitness: ${parseInt(maxFitness)}`);

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
                // Esempio: un'auto con il valore adattabilità 1, sarà presente 100 volte, mentre un'auto con valore adattabilità 0.3 sarà presente solo 30 volte.
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
                let parentA = sketch.random(this.matingPool).dna;
                let parentB = sketch.random(this.matingPool).dna;

                // Genero il nuovo DNA tramite crossover dei DNA dei genitori
                let child = parentA.crossover(parentB);

                // Richiamo la funzione che introduce mutazioni nel codice dei vettori
                child.mutation();

                // Genero la nuova auto passando il "codice genetico" ottenuto dall'incrocio di due genitori
                newCars[i] = new sketch.Car(child);
            }

            // Aggiungo gli elementi migliori della generazione precedente
            for (var i = 0; i < this.eliteCars.length; i++) {
                newCars.push(new sketch.Car(this.eliteCars[i].dna, 'rgba(255,0,0, 1)'));
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
    sketch.DNA = function (genes) {

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
            let midPoint = sketch.floor(sketch.random(this.genes.length));
            for (var i = 0; i < this.genes.length; i++) {

                // Se mi trovo prima del midPoint prendo i geni dall'attuale dna, altrimenti prendo i geni dal dna del partner
                if(i > midPoint) {
                    newGenes[i] = this.genes[i];
                } else {
                    newGenes[i] = partner.genes[i];
                }

            }
            // Restituisco un nuovo oggetto DNA con il nuovo "codice genetico", passato come array
            return new sketch.DNA(newGenes);
        }

        // Inserisco una sorta di mutazione. Per ogni gene dell'array, se recupero un valore random minore all'1%, sostituisco il gene con un nuovo gene generato casualmente
        this.mutation = function() {
            for (var i = 0; i < this.genes.length; i++) {
                if(sketch.random(1) < 0.01) {
                    this.genes[i] = p5.Vector.random2D();

                    // Lunghezza arbitraria del vettore
                    this.genes[i].setMag(maxForce);
                }
            }
        }
    }

    // Creo l'oggetto Car per gestire le singole proprietà della mia auto
    sketch.Car = function (dna, color) {

        // Imposto le dimensioni dell'auto
        this.w = 25;
        this.h = 5;

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
            this.dna = new sketch.DNA();
        }

        // Creo la funzione che si occuperò di applicare la forza alla proprietà accelerazione
        this.applyForce = function(force) {
            this.acceleration.add(force);
        }

        // Calcolo il grado di adattamento all'ambiente (sulla base della vicinanza alla destinazione)
        this.calculateFitness = function() {

            // Recupero la distanza fra la singola auto e la destinazione
            let distance = sketch.dist(this.position.x, this.position.y, destination.x, destination.y);

            // Calcolo il valore di adattabilità sulla base della distanza fra l'auto e la destinazione, mappando il valore distance con l'altezza della finestra ed invertendo questo valore
            this.fitness = sketch.map(distance, 0, sketch.width, sketch.width, 0);
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

        this.checkCollision = function() {

            let carBottom = this.position.y + this.h / 2;
            let carTop = this.position.y - this.h / 2;
            let carLeft = this.position.x - this.w / 2;
            let carRight = this.position.x + this.w / 2;

            // Thanks to https://stackoverflow.com/a/44912084/12828579
            obstacles.forEach((element) => {

                let bottom = element.position.y + element.r;
                let top = element.position.y - element.r;
                let left = element.position.x - element.r;
                let right = element.position.x + element.r;

                if(
                    (carRight > left
                    && carLeft < right
                    && carBottom > top 
                    && carTop < bottom) 
                    && !this.crashed) {
                    this.crashed = true;
        
                    // Registro auto distrutta contro l'ostacolo
                    carsCrashed++;
                    carsCrashedAgainstObstacle++;
                }
            });

            // Controllo la collisione con i bordi dell'area
            if((this.position.x > sketch.width || this.position.x < 0) && !this.crashed) {
                this.crashed = true;

                // Registro auto distrutta
                carsCrashed++;

                if(this.position.x > sketch.width && !this.crashedAfterDestination) {
                    this.crashedAfterDestination = true;

                    // Registro auto distrutta dopo la destinazione
                    carsCrashedAfterDestination++;
                }

                if(this.position.x < 0 && !this.crashedAtStart) {
                    // Registro auto distrutta alla partenza
                    carsCrashedAtStart++;
                }
            }

            if((this.position.y > sketch.height || this.position.y < 0) && !this.crashed) {
                this.crashed = true;

                // Registro auto distrutta
                carsCrashed++;
            }
        }

        // Creo la funzione di update che aggiornerà le proprietà della nostra auto
        this.update = function() {

            // Calcolo la distanza fra auto e destinazione
            let distance = sketch.dist(this.position.x, this.position.y, destination.x, destination.y);

            // Se l'auto arriva nei pressi della destinazione, registro l'evento per calcolare il tempo impiegato
            if(distance < 30 && !this.near) {
                this.near = true;
                this.timing = sketch.map(count, 1, lifespan, 100, 1);
            }

            // Se l'auto si trova entro 10px dalla destinazione la considero arrivata
            if(distance < 10 && !this.completed) {
                this.completed = true;
                this.timing = sketch.map(count, 1, lifespan, 100, 1);

                // Registro auto arrivata a destinazione
                carsAtDestination++;
            }

            // controllo le varie collisioni
            this.checkCollision();

            // Ad ogni frame di vita dell'auto, applicheremo uno dei geni (che contiene un vettore random) alla nostra auto, per farla muovere
            this.applyForce(this.dna.genes[count]);

            //console.log(carsCrashed);

            // L'auto si deve muovere solo se non è ancora giunta a destinazione
            if((!this.completed && !this.crashed)) {

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
            sketch.push();

            // Gestisco l'apparenza grafica eliminando i bordi ed aggiungendo una leggera trasparenza alle singole auto
            sketch.noStroke();
            sketch.fill(this.color);

            // Uso translate per orientare la mia auto nella direzione in cui si muove
            sketch.translate(this.position.x, this.position.y);
            sketch.rotate(this.velocity.heading());

            // Disegno un rettangolo che rappresenti la mia auto
            sketch.rectMode(sketch.CENTER);
            sketch.rect(0, 0, this.w, this.h);

            // Uso push() all'inizio e pop() alla fine per non influenzare altri oggetti auto
            sketch.pop();
        }

        this.resetCar = function() {

            // Creo le proprietà base per la nostra auto
            this.position = sketch.createVector(0, sketch.height/2);
            this.velocity = sketch.createVector();
            this.acceleration = sketch.createVector();
            
            // Imposto la variabile fitness a 0, in modo da avere un valore adattabilità di partenza uguale per tutte le auto
            this.fitness = 0;

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
        }

        // Chiamo la funzione di reset
        this.resetCar();
    }

}

let gaP5 = new p5(s, 'sketch');