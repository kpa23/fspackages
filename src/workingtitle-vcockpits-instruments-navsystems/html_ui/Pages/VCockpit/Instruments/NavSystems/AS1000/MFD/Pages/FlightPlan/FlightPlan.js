class AS1000_Flight_Plan_Page extends HTMLElement {
    constructor() {
        super();

        this.inputLayer = new Selectables_Input_Layer([]);
        this.inputLayer.setExitHandler(this);
        this.elements = {};
    }
    setGps(gps) {
        this.gps = gps;
        this.updateWaypoints(this.gps.currFlightPlanManager);
    }
    updateWaypoints(flightPlan) {
        let lines = [];
        let departure = flightPlan.getDepartureWaypointsMap();
        let arrival = flightPlan.getArrivalWaypointsMap();
        let approach = flightPlan.getApproachWaypoints();
        let enroute = flightPlan.getEnRouteWaypoints();
        let origin = flightPlan.getOrigin();
        let destination = flightPlan.getDestination();

        function waypointLine(waypoint) {
            let infos = waypoint.GetInfos();
            let element = document.createElement("div");
            element.className = "flight-plan-waypoint";
            element.innerHTML = `<div></div>
                <div class="ident">${infos.ident != "" ? infos.ident : waypoint.ident}</div>
                <div class="bearing">${Math.floor(waypoint.bearingInFP)}°</div>
                <div class="distance">${Math.floor(waypoint.distanceInFP)}<span class="units-small">NM</span></div>
                <div class="altitude">${Math.floor(waypoint.altitudeinFP)}<span class="units-small">FT</span></div>`;
            return {
                waypoint: waypoint,
                element: element
            };
        }

        function headerLine(type, text) {
            let element = document.createElement("div");
            element.className = "flight-plan-header-line";
            element.setAttribute("type", type);
            element.textContent = text;
            return {
                element: element
            };
        }

        if (departure.length > 0) {
            lines.push(headerLine("departure", `Departure - ${flightPlan.getDeparture().name}`));
            lines.push(waypointLine(flightPlan.getOrigin()));
            lines.push(...departure.map(waypointLine));
        }
        if (departure.length > 0 || arrival.length > 0 || (approach && approach.length > 0)) {
            lines.push(headerLine("enroute", `Enroute`));
        }
        if (departure.length == 0 && origin) {
            lines.push(waypointLine(flightPlan.getOrigin()));
        }
        lines.push(...enroute.map(waypointLine));
        if (arrival.length > 0) {
            lines.push(headerLine("arrival", `Arrival - ${flightPlan.getArrival().name}`));
            lines.push(...arrival.map(waypointLine));
        }
        if (destination) {
            lines.push(waypointLine(destination));
        }
        if (approach && approach.length > 0) {
            let airportApproach = flightPlan.getAirportApproach();
            if (airportApproach) {
                lines.push(headerLine("approach", `Approach - ${airportApproach.name}`));
            }
            lines.push(...approach.map(waypointLine));
        }

        let waypointLines = [];
        let lineIndex = 0;
        for(let line of lines) {
            if (line.waypoint) {
                waypointLines.push(lineIndex);
            }
            lineIndex++;
        }
        this.waypointLineIndexes = waypointLines;

        //DOMUtilities.RemoveChildren(this.elements.flightPlanWaypoints,":not(.flight-plan-marker)");
        lines.forEach(line => this.elements.flightPlanWaypoints.appendChild(line.element));
    }
    waypointIndexToLineIndex(waypointIndex) {
        return this.waypointLineIndexes[waypointIndex];
    }
    updateActiveLeg(leg) {
        if (leg.origin !== null && leg.destination !== null) {
            this.elements.activeLegMarker.style.gridRowStart = this.waypointIndexToLineIndex(leg.origin) + 1;
            this.elements.activeLegMarker.style.gridRowEnd = this.waypointIndexToLineIndex(leg.destination) + 2;
            this.elements.activeLegMarker.style.visibility = "visible";
        } else {
            this.elements.activeLegMarker.style.visibility = "hidden";
        }
    }
    setProcedures(procedures) {
        this.activeLegSubscription = procedures.activeLeg.subscribe(this.updateActiveLeg.bind(this));
    }
    connectedCallback() {
        let template = document.getElementById('flight-plan-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        let elements = this.querySelectorAll("[data-element]");
        for(let element of elements) {
            this.elements[element.getAttribute("data-element")] = element;
        }
    }
}
customElements.define("g1000-flight-plan-page", AS1000_Flight_Plan_Page);