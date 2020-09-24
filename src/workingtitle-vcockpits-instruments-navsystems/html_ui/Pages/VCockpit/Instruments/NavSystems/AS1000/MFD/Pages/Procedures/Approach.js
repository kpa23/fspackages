class AS1000_Approach_Page extends HTMLElement {
    constructor() {
        super();
        this.selectedInfo = null;
        this.approach = null;
        this.transition = null;
        this.waypoints = new Subject();

        this.inputLayer = new Selectables_Input_Layer([]);
        this.inputLayer.setExitHandler(this);
    }    
    buildMapColors() {
        let curve = new Avionics.Curve();
        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;

        let svgConfig = new SvgMapConfig();
        curve.add(0, svgConfig.convertColor("#77dd77"));
        curve.add(16000, svgConfig.convertColor("#ff0000"));

        let colors = [SvgMapConfig.hexaToRGB(svgConfig.convertColor("#0000ff"))];

        for (let i = 0; i < 60; i++) {
            let color = curve.evaluate(i * 30000 / 60);
            colors[i + 1] = SvgMapConfig.hexaToRGB(color);
        }

        console.log(JSON.stringify(colors));
        return colors;
    }
    connectedCallback() {
        let template = document.getElementById('approach-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        this.addEventListener("selectable-selected", (selectable) => {
            if ("sequence-entry" in selectable.element.classList) {
                this.scrollSequenceToElement(selectable.element);
            }
        });

        this.elements = {
            bingMap: this.querySelector("bing-map"),
            approachSelector: this.querySelector("[data-id=approachSelector]"),
            transitionSelector: this.querySelector("[data-id=transitionSelector]"),
            sequenceList: this.querySelector("[data-id=sequenceList]"),
        }

        let bingMap = this.elements.bingMap;
        bingMap.setMode(EBingMode.VFR);
        bingMap.setBingId("approachMap");
        bingMap.addConfig({resolution: 1024, aspectRatio: 1, heightColors: this.buildMapColors()});
        bingMap.setConfig(0);
        bingMap.setReference(EBingReference.PLANE);
        bingMap.setVisible(true);

        //this.bingMap.setParams({ lla: this.navMap.lastCenterCoordinates, radius: bingRadius });

        this.elements.approachSelector.addEventListener("change", e => this.updateApproach(this.selectedInfo.approaches[e.target.value]) );
        this.elements.transitionSelector.addEventListener("change", e => this.updateTransition(this.approach.transitions[e.target.value]) );

        this.waypoints.subscribe(waypoints => {
            if (!waypoints)
                return;

            for(let waypoint of waypoints) {
                FacilityLoader.Instance.getFacilityDataCB(waypoint.icao, (data) => {
                    if (data) {
                        waypoint.SetFromIFacility(data, () => { });
                        console.log(`Loaded ICAO: "${waypoint.icao}", IDENT: "${waypoint.ident}"`);
                    } else {
                        console.log(`Failed to load ICAO: "${waypoint.icao}", IDENT: "${waypoint.ident}"`);
                        console.log(JSON.stringify(waypoint));
                    }
                });
            }

            let frame = () => {
                let allWaypointsLoaded = true;
                let minLatLong = null;
                let maxLatLong = null;
                let loaded = 0;
                for(let waypoint of waypoints) {
                    if (!waypoint.infos.coordinates.lat) {
                        allWaypointsLoaded = false;                        
                    } else {
                        loaded++;
                    }
                    if (minLatLong == null) {
                        minLatLong = new LatLong(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                        maxLatLong = new LatLong(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                    } else {
                        minLatLong.lat = Math.min(minLatLong.lat, waypoint.infos.coordinates.lat);
                        minLatLong.long = Math.min(minLatLong.long, waypoint.infos.coordinates.long);
                        maxLatLong.lat = Math.max(maxLatLong.lat, waypoint.infos.coordinates.lat);
                        maxLatLong.long = Math.max(maxLatLong.long, waypoint.infos.coordinates.long);
                    }
                }
                if (allWaypointsLoaded) {
                    console.log(`Min LatLong: ${minLatLong.lat} ${minLatLong.long}`);
                    console.log(`Max LatLong: ${maxLatLong.lat} ${maxLatLong.long}`);
                    this.elements.bingMap.setParams({ lla: new LatLong(52.035733, -0.742212), radius: 8000 });
                } else {
                    //console.log(`Loaded ${loaded} / ${waypoints.length}...`);

                    requestAnimationFrame(frame);
                }
            }
            requestAnimationFrame(frame);
        });

        this.waypoints.subscribe(this.updateSequence.bind(this));
    };
    setICAO(icao) {
        icao = `A      ${icao} `;
        FacilityLoader.Instance.getFacilityCB(icao, (airport) => {
            if (airport) {
                this.updateInfo(airport);
            } else {
                console.log(`Failed to load "${icao}"`);
            }
        });
    }
    getWaypoints() {
        let waypoints = [];
        if (this.approach) {           
            if (this.transition) {
                for (let waypoint of this.transition.waypoints) {
                    waypoints.push(waypoint);
                }
            }
            for (let waypoint of this.approach.wayPoints) {
                waypoints.push(waypoint);
            }
        }
        return waypoints;
    }
    updateInfo(waypoint) {
        this.selectedInfo = waypoint.infos;

        this.elements.approachSelector.clearOptions();
        let i = 0;
        for (let approach of this.selectedInfo.approaches) {
            this.elements.approachSelector.addOption(i++, approach.name);
        }
        this.updateSelectables();
    }
    updateApproach(approach) {
        this.approach = approach;
        console.log("Selected approach: " + this.approach.name);

        this.elements.transitionSelector.clearOptions();
        let i = 0;
        if (this.approach.transitions) {
            for (let transition of this.approach.transitions) {
                this.elements.transitionSelector.addOption(i++, transition.name);
            }
        } else {
            this.updateTransition(null);
        }
    }
    updateTransition(transition) {
        this.transition = transition;
        console.log("Selected transition: " + transition ? transition.name : "none");

        this.waypoints.value = this.getWaypoints();
    }
    updateSequence(waypoints) {
        if (waypoints) {
            this.elements.sequenceList.innerHTML = waypoints.map((waypoint) => {
                return `<div class="sequence-entry">${waypoint.ident}</div>`;
            }).join("");
        } else {
            this.elements.sequenceList.innerHTML = "";
        }

        /*let waypointLineComponents = waypoints.map(waypoint => {
            return "L"
        });*/

        this.updateSelectables();
    }
    enter(gps, inputStack) {
        this.gps = gps;
        this.inputStack = inputStack;

        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    back() {
        this.exit();
    }
    scrollSequenceToElement(element) {

    }
    updateSelectables() {
        let selectables = [];
        for (let selectableNode of this.querySelectorAll("drop-down-selector, numeric-input, toggle-switch, .sequence-entry")) {
            let selectable = new SelectableElement(this.gps, selectableNode, (_event) => this.onSelectElement(_event, selectableNode));
            selectables.push(selectable);
        }

        this.inputLayer.elements = selectables;
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        this.parentNode.removeChild(this);
    }
    onSelectElement(_event, node) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            switch (node.tagName) {
                case "DROP-DOWN-SELECTOR":
                case "NUMERIC-INPUT":
                case "TOGGLE-SWITCH":
                    node.enter(this.gps, this.inputStack);
                    break;
            }
        }
    }
}
customElements.define("g1000-approach-page", AS1000_Approach_Page);