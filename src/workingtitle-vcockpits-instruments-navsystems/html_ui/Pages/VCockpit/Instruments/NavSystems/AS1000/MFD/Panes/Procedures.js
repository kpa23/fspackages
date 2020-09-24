class Subject {
    constructor(value) {
        this._value = value;
        this.listeners = [];
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value != value) {
            this._value = value;
            for(let listener of this.listeners) {
                listener(this.value);
            }
        }
    }
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.value);
        return () => this.unsubscribe(callback);
    }
    unsubscribe(callback) {
        let idx = this.listeners.indexOf(callback);
        this.listeners.splice(idx, 1);
    }
}

class Procedures {
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;

        this.approach = new Subject();
        this.departure = new Subject();
        this.arrival = new Subject();
        this.activeLeg = new Subject();
    }
    getActiveLeg() {
        let waypoints = {
            origin: null,
            destination: null
        };
        let flightPlanManager = this.flightPlanManager;
        if (flightPlanManager.isActiveApproach()) {
            let index = flightPlanManager.getApproachActiveWaypointIndex();
            waypoints.destination = index;
            if (index == 0) {
                waypoints.origin = flightPlanManager.getWaypointsCount() - 2;
            }
            else {
                waypoints.origin = flightPlanManager.getApproachActiveWaypointIndex() - 1, true;
            }
        }
        else {
            waypoints.destination = flightPlanManager.getActiveWaypointIndex();
            waypoints.origin = flightPlanManager.getActiveWaypointIndex() - 1;
        }
        return waypoints;
    }
    update() {
        this.approach.value = this.flightPlanManager.getAirportApproach();
        this.departure.value = this.flightPlanManager.getDeparture();
        this.arrival.value = this.flightPlanManager.getArrival();
        this.activeLeg.value = this.getActiveLeg();
    }
}

class Pane_Input_Layer extends Selectables_Input_Layer {
    constructor(pane, selectables) {
        super(selectables);
        this.pane = pane;
    }
    onCLR() {
        this.pane.exit();
    }
}

class Procedures_Input_Layer extends Pane_Input_Layer {
    onProceduresPush() {
        this.pane.exit();
    }
}

class AS1000_Procedures_Pane extends HTMLElement {
    connectedCallback() {
        let template = document.getElementById('procedures-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        this.elements = {
            loadedApproach: this.querySelector("[data-id=loadedApproach]"),
            loadedDeparture: this.querySelector("[data-id=loadedDeparture]"),
            loadedArrival: this.querySelector("[data-id=loadedArrival]"),
        };
    };
    disconnectedCallback() {
        this.approachUnsubscribe = this.approachUnsubscribe ? this.approachUnsubscribe() : null;
        this.arrivalUnsubscribe = this.arrivalUnsubscribe ? this.arrivalUnsubscribe() : null;
        this.departureUnsubscribe = this.departureUnsubscribe ? this.departureUnsubscribe() : null;
    }
    setProcedures(procedures) {
        this.approachUnsubscribe = procedures.approach.subscribe(this.updateLoadedApproach.bind(this));
        this.arrivalUnsubscribe = procedures.arrival.subscribe(this.updateLoadedArrival.bind(this));
        this.departureUnsubscribe = procedures.departure.subscribe(this.updateLoadedDeparture.bind(this));
    }
    updateLoadedApproach(approach) {
        this.elements.loadedApproach.textContent = approach ? approach.name : "____-";
        this.elements.loadedApproach.classList.toggle("highlighted", approach != null);
    }
    updateLoadedArrival(arrival) {
        this.elements.loadedArrival.textContent = arrival ? arrival.name : "____-";
        this.elements.loadedArrival.classList.toggle("highlighted", arrival != null);
    }
    updateLoadedDeparture(departure) {
        this.elements.loadedDeparture.textContent = departure ? departure.name : "____-";
        this.elements.loadedDeparture.classList.toggle("highlighted", departure != null);
    }
    enter(gps, inputStack) {
        this.gps = gps;
        this.inputStack = inputStack;

        let selectableElements = [];
        for (let selectableNode of this.querySelectorAll("selectable-button:not([disabled])")) {
            let selectableElement = new SelectableElement(gps, selectableNode, (_event) => this.onButtonClick(_event, selectableNode));
            selectableElements.push(selectableElement);
        }

        this.inputLayer = new Procedures_Input_Layer(this, selectableElements);
        this.inputLayer.setExitHandler(this);
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        this.parentNode.removeChild(this);
    }
    selectApproach() {
        this.exit();
        this.gps.showApproaches();
    }
    onButtonClick(_event, node) {
        if (_event == "ENT_Push") {
            let click = node.dataset.click;
            this[click]();
        }
    }
}
customElements.define("g1000-procedures-pane", AS1000_Procedures_Pane);