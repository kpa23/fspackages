class CJ4_MFD extends BaseAirliners {
    constructor() {
        super();
        this.isExtended = false;
        this.showTerrain = false;
        this.showWeather = false;
        this.showFms = false;
        this.showGwx = false;
        this.showChecklist = false;
        this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
        this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
        this.mapNavigationSource = 0;
        this.systemPage1 = CJ4_SystemPage.ENGINES;
        this.systemPage2 = CJ4_SystemPage.ELECTRICS;
        this.showSystemOverlay = 0;
        this.modeChangeTimer = -1;
        this.initDuration = 11000;
    }
    get templateID() { return "CJ4_MFD"; }
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.radioNav.init(NavMode.TWO_SLOTS);
        this.systems1 = new CJ4_SystemContainer("System1", "SystemInfos1");
        this.systems2 = new CJ4_SystemContainer("System2", "SystemInfos2");
        this.systemOverlay = new CJ4_SystemOverlayContainer("SystemOverlay", "SystemOverlay");
        this.map = new CJ4_MapContainer("Map", "Map");
        this.mapOverlay = new CJ4_MapOverlayContainer("MapInfos", "MapOverlay");
        this.fms = new CJ4_FMSContainer("Fms", "FMSInfos");
        this.checklist = new CJ4_ChecklistContainer("Checklist", "Checklist");
        this.navBar = new CJ4_NavBarContainer("Nav", "NavBar");
        this.popup = new CJ4_PopupMenuContainer("Menu", "PopupMenu");
        this.addIndependentElementContainer(this.systems1);
        this.addIndependentElementContainer(this.systems2);
        this.addIndependentElementContainer(this.systemOverlay);
        this.addIndependentElementContainer(this.map);
        this.addIndependentElementContainer(this.mapOverlay);
        this.addIndependentElementContainer(this.navBar);
        this.addIndependentElementContainer(this.fms);
        this.addIndependentElementContainer(this.checklist);
        this.addIndependentElementContainer(this.popup);
        this.modeChangeMask = this.getChildById("ModeChangeMask");
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
    }
    Update() {
        super.Update();
        if (this.allContainersReady()) {
            SimVar.SetSimVarValue("L:Glasscockpit_MFD_Started", "number", this.isStarted ? 1 : 0);
            if (this.modeChangeMask && this.modeChangeTimer >= 0) {
                this.modeChangeTimer -= this.deltaTime / 1000;
                if (this.modeChangeTimer <= 0) {
                    this.modeChangeMask.style.display = "none";
                    this.modeChangeTimer = -1;
                }
            }
            let dict = this.popup.dictionary;
            if (dict.changed) {
                this.readDictionary(dict);
                dict.changed = false;
            }
            if (this.showGwx)
                this.showWeather = false;
            if (this.showGwx) {
                this.map.showGwx(true);
                this.mapOverlay.showGwx(true);
            }
            else {
                this.map.setMode(this.mapDisplayMode);
                this.mapOverlay.setMode(this.mapDisplayMode, this.mapNavigationMode, this.mapNavigationSource);
                if (this.showTerrain) {
                    this.map.showTerrain(true);
                    this.mapOverlay.showTerrain(true);
                }
                else if (this.showWeather) {
                    this.map.showWeather(true);
                    this.mapOverlay.showWeather(true);
                }
                else {
                    this.map.showTerrain(false);
                    this.mapOverlay.showTerrain(false);
                    this.map.showWeather(false);
                    this.mapOverlay.showWeather(false);
                    this.map.showGwx(false);
                    this.mapOverlay.showGwx(false);
                }
            }

            if (this.showSystemOverlay == 1 || this.showSystemOverlay == 2) {
                this.systemOverlay.show(true, this.showSystemOverlay);
            }
            else{
                this.systemOverlay.show(false);
            }

            if (this.showFms) {
                this.systems1.minimize(true);
                this.systems2.show(CJ4_SystemPage.NONE);
                this.fms.show(true);
                this.checklist.show(false);
                this.mapOverlay.setExtended(false);
            }
            else if (this.showChecklist) {
                this.systems1.minimize(true);
                this.fms.show(false);
                this.checklist.show(true);
                this.mapOverlay.setExtended(false);
            }
            else {
                this.fms.show(false);
                this.checklist.show(false);
                this.systems1.show(this.systemPage1);
                if (this.systemPage1 == CJ4_SystemPage.ENGINES) {
                    if (this.isExtended && !this.systems2.hasAnnunciations()) {
                        this.map.setExtended(true);
                        this.mapOverlay.setExtended(true);
                        this.systems1.minimize(false);
                        this.systems2.show(CJ4_SystemPage.NONE);
                    }
                    else {
                        this.map.setExtended(false);
                        this.mapOverlay.setExtended(false);
                        if (this.systems2.hasAnnunciations()) {
                            this.systems1.minimize(true);
                            this.systems2.show(CJ4_SystemPage.ANNUNCIATIONS);
                        }
                        else {
                            this.systems1.minimize((this.systemPage2 != CJ4_SystemPage.NONE) ? true : false);
                            this.systems2.show(this.systemPage2);
                        }
                    }
                }
                else {
                    this.systems1.minimize(true);
                    if (this.isExtended) {
                        this.map.setExtended(true);
                        this.mapOverlay.setExtended(true);
                        this.systems2.show(CJ4_SystemPage.NONE);
                    }
                    else {
                        this.map.setExtended(false);
                        this.mapOverlay.setExtended(false);
                        this.systems2.show(this.systemPage2);
                    }
                }
            }
            this.mapOverlay.setRange(this.map.range);
        }
    }
    onEvent(_event) {
        console.log(_event);
        switch (_event) {
            case "Lwr_Push_TERR_WX":
                if (this.showTerrain) {
                    this.showTerrain = false;
                    this.showWeather = true;
                }
                else if (this.showWeather) {
                    this.showTerrain = false;
                    this.showWeather = false;
                }
                else {
                    this.showTerrain = true;
                    this.showWeather = false;
                }
                this.onModeChanged();
                break;
            case "Lwr_Push_TFC":
                this.map.toggleSymbol(CJ4_MapSymbol.TRAFFIC);
                break;
            case "Lwr_Push_SYS":
                this.showSystemOverlay++;
                console.log("SYSTEM NUM " + this.showSystemOverlay);
                if(this.showSystemOverlay == 3){
                    this.showSystemOverlay = 0;
                }
                break;
            case "Lwr_Push_ENG":
                this.systemPage1 = (this.systemPage1 == CJ4_SystemPage.ENGINES) ? CJ4_SystemPage.ANNUNCIATIONS : CJ4_SystemPage.ENGINES;
                break;
            case "Lwr_Push_UPR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.UPPER);
                if(this.popup.mode == CJ4_PopupMenu.UPPER){
                    this.checklist.otherMenusOpen = true;
                }
                else{
                    this.checklist.otherMenusOpen = false
                }
                break;
            case "Lwr_Push_LWR_MENU":
                this.fillDictionary(this.popup.dictionary);
                this.popup.setMode(CJ4_PopupMenu.LOWER);
                if(this.popup.mode == CJ4_PopupMenu.LOWER){
                    this.checklist.otherMenusOpen = true;
                }
                else{
                    this.checklist.otherMenusOpen = false
                }
                break;
            case "Lwr_Push_CKLST_1":
                this.showFms = false;
                this.showChecklist = !this.showChecklist;
                break;
        }
    }
    allContainersReady() {
        for (var i = 0; i < this.IndependentsElements.length; i++) {
            if (!this.IndependentsElements[i].isInitialized) {
                return false;
            }
        }
        return true;
    }
    onModeChanged() {
        if (this.modeChangeMask) {
            this.modeChangeMask.style.display = "block";
            this.modeChangeTimer = 0.15;
        }
    }
    readDictionary(_dict) {
        let modeChanged = false;
        let format = _dict.get(CJ4_PopupMenu_Key.MAP_FORMAT);
        if (format == "ROSE") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ROSE) {
                this.mapDisplayMode = Jet_NDCompass_Display.ROSE;
                modeChanged = true;
            }
        }
        else if (format == "ARC" || format == "PPOS" || format == "TCAS") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.ARC) {
                this.mapDisplayMode = Jet_NDCompass_Display.ARC;
                modeChanged = true;
            }
        }
        else if (format == "PLAN") {
            if (this.mapDisplayMode != Jet_NDCompass_Display.PLAN) {
                this.mapDisplayMode = Jet_NDCompass_Display.PLAN;
                modeChanged = true;
            }
        }
        let navSrc = _dict.get(CJ4_PopupMenu_Key.NAV_SRC);
        if (navSrc == "FMS1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.NAV) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.NAV;
                this.mapNavigationSource = 0;
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR1") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 1) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 1;
                modeChanged = true;
            }
        }
        else if (navSrc == "VOR2") {
            if (this.mapNavigationMode != Jet_NDCompass_Navigation.VOR || this.mapNavigationSource != 2) {
                this.mapNavigationMode = Jet_NDCompass_Navigation.VOR;
                this.mapNavigationSource = 2;
                modeChanged = true;
            }
        }
        this.map.setSymbol(CJ4_MapSymbol.AIRPORTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRPORTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.CONSTRAINTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_CONSTRAINTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.INTERSECTS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_INTERSECTS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.AIRWAYS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRWAYS) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.AIRSPACES, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRSPACES) == "ON") ? true : false);
        this.map.setSymbol(CJ4_MapSymbol.NAVAIDS, (_dict.get(CJ4_PopupMenu_Key.MAP_SYMBOL_NAVAIDS) == "ON") ? true : false);
        let sysMode = _dict.get(CJ4_PopupMenu_Key.SYS_SRC);
        if (sysMode == "OFF") {
            this.isExtended = true;
            this.showFms = false;
            this.showChecklist = false;
        }
        else if (sysMode == "FMS TEXT") {
            this.isExtended = false;
            this.showFms = true;
            this.showChecklist = false;
        }
        else if (sysMode == "SYSTEMS") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = false;
        }
        else if (sysMode == "CHECKLIST") {
            this.isExtended = false;
            this.showFms = false;
            this.showChecklist = true;
        }
        if (modeChanged)
            this.onModeChanged();
    }
    fillDictionary(_dict) {
        if (this.mapDisplayMode == Jet_NDCompass_Display.ROSE)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ROSE");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.ARC)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "ARC");
        else if (this.mapDisplayMode == Jet_NDCompass_Display.PLAN)
            _dict.set(CJ4_PopupMenu_Key.MAP_FORMAT, "PLAN");
        if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 1)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR1");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.VOR && this.mapNavigationSource == 2)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "VOR2");
        else if (this.mapNavigationMode == Jet_NDCompass_Navigation.NAV)
            _dict.set(CJ4_PopupMenu_Key.NAV_SRC, "FMS1");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRPORTS, (this.map.hasSymbol(CJ4_MapSymbol.AIRPORTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_CONSTRAINTS, (this.map.hasSymbol(CJ4_MapSymbol.CONSTRAINTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_INTERSECTS, (this.map.hasSymbol(CJ4_MapSymbol.INTERSECTS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRWAYS, (this.map.hasSymbol(CJ4_MapSymbol.AIRWAYS)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_AIRSPACES, (this.map.hasSymbol(CJ4_MapSymbol.AIRSPACES)) ? "ON" : "OFF");
        _dict.set(CJ4_PopupMenu_Key.MAP_SYMBOL_NAVAIDS, (this.map.hasSymbol(CJ4_MapSymbol.NAVAIDS)) ? "ON" : "OFF");
        if (this.isExtended)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "OFF");
        else if (this.showFms)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "FMS TEXT");
        else if (this.showChecklist)
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "CHECKLIST");
        else
            _dict.set(CJ4_PopupMenu_Key.SYS_SRC, "SYSTEMS");
            _dict.changed = false;
    }
}
class CJ4_FMSContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this.previousWaypoint = undefined;
        this._k = 0;
    }
    static secondsTohhmm(seconds) {
        let h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        let m = Math.ceil(seconds / 60);
        return h.toFixed(0) + ":" + m.toFixed(0).padStart(2, "0");
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else {
            let waypointContainers = this.root.querySelectorAll(".cj4x-navigation-data-row");
            this._previousWaypointContainer = waypointContainers[0];
            this._activeWaypointContainer = waypointContainers[1];
            this._nextWaypointContainer = waypointContainers[2];
            this._destinationWaypointContainer = waypointContainers[3];
        }
    }
    show(_value) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (!this._previousWaypointContainer || !this._activeWaypointContainer || !this._nextWaypointContainer || !this._destinationWaypointContainer) {
            if (!this.isInitialized) {
                this.init();
            }
            return;
        }

        if (this.isVisible) {
            let flightPlanManager = this.gps.currFlightPlanManager;
            if (flightPlanManager) {
                this._k++;
                if (this._k > 60) {
                    flightPlanManager.updateFlightPlan();
                    this._k = 0;
                }

                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let aircraftPosition = new LatLong(lat, long);
                let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                const FPWaypoints = flightPlanManager._waypoints[flightPlanManager._currentFlightPlanIndex];
                const UTCTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");

                //region previous
                /* SET PREVIOUS WAYPOINT FMS INFO */
                let previousWaypointIndex = flightPlanManager.getActiveWaypointIndex() - 1;
                let previousWaypoint = flightPlanManager.getWaypoint(previousWaypointIndex);
                if (previousWaypoint && previousWaypoint.ident != flightPlanManager.getOrigin().ident) {
                    this._previousWaypointContainer.style.display = "block";

                    // Set identification ICAO
                    this._previousWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ident")
                        .textContent = previousWaypoint.ident;

                    // Set distance to go
                    this._previousWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-distance")
                        .textContent = Avionics.Utils.computeDistance(aircraftPosition, previousWaypoint.infos.coordinates).toFixed(1) + " NM";

                    // Set ETA
                    let etaValue = "--:--";
                    if (this.previousWaypoint == undefined || this.previousWaypoint.ident != previousWaypoint) {
                        const seconds = Number.parseInt(UTCTime);
                        etaValue = Utils.SecondsToDisplayTime(seconds, true, false, false);
                        this.previousWaypoint = previousWaypoint;
                        this._previousWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = etaValue;
                    }

                }
                else {
                    this._previousWaypointContainer.style.display = "none";
                }
                //endregion

                //region active
                /* SET ACTIVE WAYPOINT FMS INFO */
                let activeIndex = flightPlanManager.getActiveWaypointIndex();
                let activeWaypoint = FPWaypoints[activeIndex];
                if (activeWaypoint) {
                    const destination = flightPlanManager.getDestination();
                    if(destination && activeWaypoint.ident == destination.ident){
                        this._activeWaypointContainer.style.display = "none";
                    }
                    else{
                        this._activeWaypointContainer.style.display = "block";

                        // Set identification ICAO
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = activeWaypoint.ident;

                        // Set distance to go
                        const activeWaypointDistance = Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates).toFixed(1);
                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = activeWaypointDistance + " NM";

                        // Set ETE
                        let eteValue = "-:--";
                        if(groundSpeed >= 50){
                            eteValue = new Date(this.calcETEseconds(activeWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = eteValue;

                        // Set ETA
                        let etaValue = "--:--";
                        if(groundSpeed >= 50){
                            const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(activeWaypointDistance, groundSpeed));
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            etaValue = time;
                        }

                        this._activeWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = etaValue;
                    }
                }
                else {
                    this._activeWaypointContainer.style.display = "none";
                }
                //endregion

                /* SET NEXT WAYPOINT FMS INFO */
                let nextWaypoint = flightPlanManager.getWaypoint(activeIndex + 1);
                if (nextWaypoint && activeWaypoint) {
                    const destination = flightPlanManager.getDestination();
                    if(destination && nextWaypoint.ident == destination.ident){
                        // Set identification ICAO
                        this._nextWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = "----";

                        // Set distance to go
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = "---" + " NM";

                        // Set ETE
                        let eteValue = "-:--";
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = eteValue;

                        // Set ETA
                        let etaValue = "--:--";

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = etaValue;
                    }
                    else{
                        // Set identification ICAO
                        this._nextWaypointContainer.querySelector(".cj4x-navigation-data-waypoint-ident")
                            .textContent = nextWaypoint.ident;

                        // Set distance to go
                        const nextWaypointDistance = (Avionics.Utils.computeDistance(aircraftPosition, activeWaypoint.infos.coordinates) + Avionics.Utils.computeDistance(activeWaypoint.infos.coordinates, nextWaypoint.infos.coordinates)).toFixed(1);
                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-distance")
                            .textContent = nextWaypointDistance + " NM";

                        // Set ETE
                        let eteValue = "-:--";
                        if(groundSpeed >= 50) {
                            eteValue = new Date(this.calcETEseconds(nextWaypointDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                        }

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-ete")
                            .textContent = eteValue;

                        // Set ETA
                        let etaValue = "--:--";
                        if(groundSpeed >= 50) {
                            const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(nextWaypointDistance, groundSpeed));
                            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                            etaValue = time;
                        }

                        this._nextWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-eta")
                            .textContent = etaValue;
                    }
                }
                else {
                    this._nextWaypointContainer.style.display = "none";
                }

                /* SET DESTINATION FMS INFO */
                let destination = flightPlanManager.getDestination();
                if (destination) {
                    // Set identification ICAO
                    this._destinationWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ident")
                        .textContent = destination.ident;

                    // Set distance to go
                    let totalDestinationDistance = Avionics.Utils.computeDistance(aircraftPosition, FPWaypoints[activeIndex].infos.coordinates);
                    console.log("aasas");
                    if(activeIndex < FPWaypoints.length){
                        console.log(activeIndex + "    " + FPWaypoints.length);
                        for(let w = activeIndex + 1; w < FPWaypoints.length - 1; w++){
                            console.log("added");
                            totalDestinationDistance += Avionics.Utils.computeDistance(FPWaypoints[w].infos.coordinates, FPWaypoints[w + 1].infos.coordinates);
                        }
                        console.log("---");
                    }
                    this._destinationWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-distance")
                        .textContent = (totalDestinationDistance.toFixed(1)) + " NM";

                    // Set ETE
                    let eteValue = "-:--";
                    if(groundSpeed >= 50) {
                        eteValue = new Date(this.calcETEseconds(totalDestinationDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                    }

                    this._destinationWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-ete")
                        .textContent = eteValue;

                    // Set ETA
                    let etaValue = "--:--";
                    if(groundSpeed >= 50) {
                        const seconds = Number.parseInt(UTCTime) + (this.calcETEseconds(totalDestinationDistance, groundSpeed));
                        const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
                        etaValue = time;
                    }

                    this._destinationWaypointContainer
                        .querySelector(".cj4x-navigation-data-waypoint-eta")
                        .textContent = etaValue;

                    // Set expected fuel
                    if(groundSpeed >= 50){
                        const fuelFlow = (SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour") + SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour")) / 2;
                        const expectedFuelUsage = (fuelFlow * (this.calcETEseconds(totalDestinationDistance, groundSpeed) / 3600)).toFixed(0);
                        const currentFuel = (SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds") * SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons")).toFixed(0);
                        const expectedFuelAtDestination = (currentFuel - expectedFuelUsage).toFixed(0) < 0 ? 0 : (currentFuel - expectedFuelUsage).toFixed(0);
                        const grossWeight = SimVar.GetSimVarValue("MAX GROSS WEIGHT", "pounds");
                        const oilQuantity = SimVar.GetSimVarValue("OIL AMOUNT", "pounds")
                        const expectedGrossWeight = expectedFuelAtDestination == 0 ? (grossWeight / 1000).toFixed(2) : ((grossWeight - expectedFuelUsage) / 1000).toFixed(2);

                        this._destinationWaypointContainer
                            .querySelector(".cj4x-navigation-data-waypoint-expected-fuel")
                            .textContent = expectedFuelAtDestination + " LB " + expectedGrossWeight + " GW";

                    }

                    if(activeWaypoint){
                        if(destination.ident == activeWaypoint.ident){
                            this._destinationWaypointContainer
                                .setAttribute("style", "color: magenta");
                        }
                        else{
                            this._destinationWaypointContainer
                                .setAttribute("style", "color: white");
                        }
                    }
                }
            }
        }
    }
    calcETEseconds(distance, currentGroundSpeed) {
        return (distance / currentGroundSpeed) * 3600;
    }
}
class CJ4_SystemOverlayContainer extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.isVisible = undefined;
        this._k = 0;
        this.currentPage = 1;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.log("Root component expected!");
        }
        else{
            this.showPage1();
        }
    }
    show(_value, _pageNumber) {
        if (this.isVisible != _value) {
            this.isVisible = _value;
            this.root.setAttribute("visible", (_value) ? "true" : "false");
        }
        if(this.isVisible){
            if(_pageNumber == 1){
                this.showPage1();
            }
            else if(_pageNumber == 2){
                this.showPage2();
            }
        }
    }
    showPage1(){
        if (!this.root)
            return;

        Utils.RemoveAllChildren(this.root.querySelector(".SystemBody"));
        this.root.querySelector(".SystemHeader").textContent = "SYSTEMS 1/2";

        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Standard");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.querySelector(".SystemBody").appendChild(rootSVG);
        {
            var dcGroup = document.createElementNS(Avionics.SVG.NS, "g");
            dcGroup.setAttribute("id", "dcGroup");
            rootSVG.appendChild(dcGroup);
            var startPosX = 155;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "DC ELEC";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            dcGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCAmpValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueLeft.textContent = "0";
            this.DCAmpValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.DCAmpValueLeft.setAttribute("y", startPosY.toString());
            this.DCAmpValueLeft.setAttribute("fill", "green");
            this.DCAmpValueLeft.setAttribute("font-size", "22");
            this.DCAmpValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueLeft.setAttribute("text-anchor", "end");
            this.DCAmpValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueLeft);
            this.DCAmpValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCAmpValueRight.textContent = "0";
            this.DCAmpValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCAmpValueRight.setAttribute("y", startPosY.toString());
            this.DCAmpValueRight.setAttribute("fill", "green");
            this.DCAmpValueRight.setAttribute("font-size", "22");
            this.DCAmpValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCAmpValueRight.setAttribute("text-anchor", "end");
            this.DCAmpValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCAmpValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(titleText);
            this.DCVoltValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueLeft.textContent = "0";
            this.DCVoltValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.DCVoltValueLeft.setAttribute("y", startPosY.toString());
            this.DCVoltValueLeft.setAttribute("fill", "green");
            this.DCVoltValueLeft.setAttribute("font-size", "22");
            this.DCVoltValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueLeft.setAttribute("text-anchor", "end");
            this.DCVoltValueLeft.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueLeft);
            this.DCVoltValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.DCVoltValueRight.textContent = "0";
            this.DCVoltValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.DCVoltValueRight.setAttribute("y", startPosY.toString());
            this.DCVoltValueRight.setAttribute("fill", "green");
            this.DCVoltValueRight.setAttribute("font-size", "22");
            this.DCVoltValueRight.setAttribute("font-family", "Roboto-Bold");
            this.DCVoltValueRight.setAttribute("text-anchor", "end");
            this.DCVoltValueRight.setAttribute("alignment-baseline", "central");
            dcGroup.appendChild(this.DCVoltValueRight);
        }
        {
            var batteryGroup = document.createElementNS(Avionics.SVG.NS, "g");
            batteryGroup.setAttribute("id", "batteryGroup");
            rootSVG.appendChild(batteryGroup);
            var startPosX = 400;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "BATT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            batteryGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosX -= 35;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "AMP";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATAmpValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATAmpValue.textContent = "-7";
            this.BATAmpValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATAmpValue.setAttribute("y", startPosY.toString());
            this.BATAmpValue.setAttribute("fill", "green");
            this.BATAmpValue.setAttribute("font-size", "22");
            this.BATAmpValue.setAttribute("font-family", "Roboto-Bold");
            this.BATAmpValue.setAttribute("text-anchor", "end");
            this.BATAmpValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATAmpValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "VOLT";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATVoltValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATVoltValue.textContent = "24";
            this.BATVoltValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATVoltValue.setAttribute("y", startPosY.toString());
            this.BATVoltValue.setAttribute("fill", "green");
            this.BATVoltValue.setAttribute("font-size", "22");
            this.BATVoltValue.setAttribute("font-family", "Roboto-Bold");
            this.BATVoltValue.setAttribute("text-anchor", "end");
            this.BATVoltValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATVoltValue);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "TEMP °C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(titleText);
            this.BATTempValue = document.createElementNS(Avionics.SVG.NS, "text");
            this.BATTempValue.textContent = "0";
            this.BATTempValue.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.BATTempValue.setAttribute("y", startPosY.toString());
            this.BATTempValue.setAttribute("fill", "green");
            this.BATTempValue.setAttribute("font-size", "22");
            this.BATTempValue.setAttribute("font-family", "Roboto-Bold");
            this.BATTempValue.setAttribute("text-anchor", "end");
            this.BATTempValue.setAttribute("alignment-baseline", "central");
            batteryGroup.appendChild(this.BATTempValue);
        }
        {
            var oxyGroup = document.createElementNS(Avionics.SVG.NS, "g");
            oxyGroup.setAttribute("id", "oxyGroup");
            rootSVG.appendChild(oxyGroup);
            var startPosX = 620;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "OXY PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            oxyGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 80).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 50).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 50).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 80).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            oxyGroup.appendChild(lineLeft);
            var gaugeStartX = startPosX + 20;
            var gaugeStartY = startPosY + 25;
            var gaugeWidth = 12;
            var gaugeHeight = 125;
            this.OXYCursorX = gaugeStartX + gaugeWidth;
            this.OXYCursorY1 = gaugeStartY + gaugeHeight;
            this.OXYCursorY2 = gaugeStartY;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", gaugeStartY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.75).toString());
            rect.setAttribute("fill", "green");
            oxyGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (gaugeStartY + gaugeHeight * 0.75).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.25).toString());
            rect.setAttribute("fill", "darkorange");
            oxyGroup.appendChild(rect);
            var gradTexts = ["2400", "", "1200", "", "0"];
            var gradPercents = [0.0, 0.25, 0.5, 0.75, 1.0];
            var gradLength = [14, 10, 14, 10, 14];
            for (var i = 0; i < gradPercents.length; i++) {
                var line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("x1", (gaugeStartX - gradLength[i]).toString());
                line.setAttribute("y1", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("x2", gaugeStartX.toString());
                line.setAttribute("y2", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                line.setAttribute("stroke", (i == 4) ? "darkorange" : "green");
                line.setAttribute("stroke-width", "2");
                oxyGroup.appendChild(line);
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = gradTexts[i];
                text.setAttribute("x", (gaugeStartX - gradLength[i] - 10).toString());
                text.setAttribute("y", (gaugeStartY + gaugeHeight * gradPercents[i]).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", "20");
                text.setAttribute("font-family", "Roboto-Light");
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                oxyGroup.appendChild(text);
            }
            this.OXYCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.OXYCursor.setAttribute("transform", "translate (" + this.OXYCursorX + " " + this.OXYCursorY1 + ")");
            this.OXYCursor.setAttribute("fill", "green");
            this.OXYCursor.setAttribute("d", "M0 0 l15 5 l0 -10 l-15 5 Z");
            oxyGroup.appendChild(this.OXYCursor);
        }
        {
            var hydroGroup = document.createElementNS(Avionics.SVG.NS, "g");
            hydroGroup.setAttribute("id", "HydroGroup");
            rootSVG.appendChild(hydroGroup);
            var startPosX = 840;
            var startPosY = 30;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "HYD";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            hydroGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "PSI";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(titleText);
            this.HYDPSIValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueLeft.textContent = "0";
            this.HYDPSIValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.HYDPSIValueLeft.setAttribute("y", startPosY.toString());
            this.HYDPSIValueLeft.setAttribute("fill", "green");
            this.HYDPSIValueLeft.setAttribute("font-size", "22");
            this.HYDPSIValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueLeft.setAttribute("text-anchor", "end");
            this.HYDPSIValueLeft.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueLeft);
            this.HYDPSIValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.HYDPSIValueRight.textContent = "0";
            this.HYDPSIValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.HYDPSIValueRight.setAttribute("y", startPosY.toString());
            this.HYDPSIValueRight.setAttribute("fill", "green");
            this.HYDPSIValueRight.setAttribute("font-size", "22");
            this.HYDPSIValueRight.setAttribute("font-family", "Roboto-Bold");
            this.HYDPSIValueRight.setAttribute("text-anchor", "end");
            this.HYDPSIValueRight.setAttribute("alignment-baseline", "central");
            hydroGroup.appendChild(this.HYDPSIValueRight);
        }
        {
            var fuelGroup = document.createElementNS(Avionics.SVG.NS, "g");
            fuelGroup.setAttribute("id", "FuelGroup");
            rootSVG.appendChild(fuelGroup);
            var startPosX = 840;
            var startPosY = 110;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "FUEL";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX - 110).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX - 40).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var lineLeft = document.createElementNS(Avionics.SVG.NS, "line");
            lineLeft.setAttribute("x1", (startPosX + 40).toString());
            lineLeft.setAttribute("y1", startPosY.toString());
            lineLeft.setAttribute("x2", (startPosX + 110).toString());
            lineLeft.setAttribute("y2", startPosY.toString());
            lineLeft.setAttribute("stroke", "white");
            lineLeft.setAttribute("stroke-width", "2");
            fuelGroup.appendChild(lineLeft);
            var rectMarginX = 40;
            var rectWidth = 60;
            var rectHeight = 30;
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "PPH";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELPPHValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueLeft.textContent = "0";
            this.FUELPPHValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELPPHValueLeft.setAttribute("y", startPosY.toString());
            this.FUELPPHValueLeft.setAttribute("fill", "green");
            this.FUELPPHValueLeft.setAttribute("font-size", "22");
            this.FUELPPHValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueLeft.setAttribute("text-anchor", "end");
            this.FUELPPHValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueLeft);
            this.FUELPPHValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELPPHValueRight.textContent = "0";
            this.FUELPPHValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELPPHValueRight.setAttribute("y", startPosY.toString());
            this.FUELPPHValueRight.setAttribute("fill", "green");
            this.FUELPPHValueRight.setAttribute("font-size", "22");
            this.FUELPPHValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELPPHValueRight.setAttribute("text-anchor", "end");
            this.FUELPPHValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELPPHValueRight);
            startPosY += rectHeight;
            var titleText = document.createElementNS(Avionics.SVG.NS, "text");
            titleText.textContent = "°C";
            titleText.setAttribute("x", startPosX.toString());
            titleText.setAttribute("y", startPosY.toString());
            titleText.setAttribute("fill", "white");
            titleText.setAttribute("font-size", "20");
            titleText.setAttribute("font-family", "Roboto-Light");
            titleText.setAttribute("text-anchor", "middle");
            titleText.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(titleText);
            this.FUELTempValueLeft = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueLeft.textContent = "15";
            this.FUELTempValueLeft.setAttribute("x", (startPosX - rectMarginX - rectWidth * 0.05).toString());
            this.FUELTempValueLeft.setAttribute("y", startPosY.toString());
            this.FUELTempValueLeft.setAttribute("fill", "green");
            this.FUELTempValueLeft.setAttribute("font-size", "22");
            this.FUELTempValueLeft.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueLeft.setAttribute("text-anchor", "end");
            this.FUELTempValueLeft.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueLeft);
            this.FUELTempValueRight = document.createElementNS(Avionics.SVG.NS, "text");
            this.FUELTempValueRight.textContent = "15";
            this.FUELTempValueRight.setAttribute("x", (startPosX + rectMarginX + rectWidth * 0.95).toString());
            this.FUELTempValueRight.setAttribute("y", startPosY.toString());
            this.FUELTempValueRight.setAttribute("fill", "green");
            this.FUELTempValueRight.setAttribute("font-size", "22");
            this.FUELTempValueRight.setAttribute("font-family", "Roboto-Bold");
            this.FUELTempValueRight.setAttribute("text-anchor", "end");
            this.FUELTempValueRight.setAttribute("alignment-baseline", "central");
            fuelGroup.appendChild(this.FUELTempValueRight);
        }
    }
    showPage2() {
        if (!this.root)
            return;
        Utils.RemoveAllChildren(this.root.querySelector(".SystemBody"));
        this.root.querySelector(".SystemHeader").textContent = "SYSTEMS 2/2";

        var rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        rootSVG.setAttribute("id", "Minimized");
        rootSVG.setAttribute("viewBox", "0 0 1000 1000");
        this.root.querySelector(".SystemBody").appendChild(rootSVG);
        {
            var trimGroup = document.createElementNS(Avionics.SVG.NS, "g");
            trimGroup.setAttribute("id", "TrimGroup");
            rootSVG.appendChild(trimGroup);
            var startPosX = 50;
            var startPosY = 30;
            var blockPosX = startPosX;
            var blockPosY = startPosY;
            var lineSize = 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", blockPosY.toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", blockPosY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (blockPosY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var textStartY = blockPosY + lineSize + 15;
            var textSpacingY = 18;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "T";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 0).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 1).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "I";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 2).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "M";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", (textStartY + textSpacingY * 3).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var lineStartY = (textStartY + textSpacingY * 3) + 15;
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", lineStartY.toString());
            line.setAttribute("x2", blockPosX.toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", blockPosX.toString());
            line.setAttribute("y1", (lineStartY + lineSize).toString());
            line.setAttribute("x2", (blockPosX + lineSize).toString());
            line.setAttribute("y2", (lineStartY + lineSize).toString());
            line.setAttribute("stroke", "white");
            line.setAttribute("stroke-width", "2");
            trimGroup.appendChild(line);
            blockPosX = startPosX + 80;
            blockPosY = startPosY + 25;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "AIL";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            blockPosY += 30;
            var gaugeWidth = 80;
            var gaugeHeight = 11;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (blockPosX - gaugeWidth * 0.5).toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "white");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "L";
            text.setAttribute("x", (blockPosX - gaugeWidth * 0.5 - 10).toString());
            text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "R";
            text.setAttribute("x", (blockPosX + gaugeWidth * 0.5 + 10).toString());
            text.setAttribute("y", (blockPosY + gaugeHeight * 0.5).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "start");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (blockPosX - gaugeWidth * 0.15).toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "green");
            trimGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", blockPosX.toString());
            rect.setAttribute("y", blockPosY.toString());
            rect.setAttribute("width", (gaugeWidth * 0.15).toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "green");
            trimGroup.appendChild(rect);
            this.AileronCursorX1 = blockPosX - gaugeWidth * 0.5;
            this.AileronCursorX2 = blockPosX + gaugeWidth * 0.5;
            this.AileronCursorY = blockPosY;
            this.AileronCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.AileronCursor.setAttribute("transform", "translate (" + this.AileronCursorX1 + " " + this.AileronCursorY + ")");
            this.AileronCursor.setAttribute("fill", "white");
            this.AileronCursor.setAttribute("d", "M0 0 l-5 -15 l10 0 l-5 15 Z");
            trimGroup.appendChild(this.AileronCursor);
            this.RudderCursorX1 = blockPosX - gaugeWidth * 0.5;
            this.RudderCursorX2 = blockPosX + gaugeWidth * 0.5;
            this.RudderCursorY = blockPosY + gaugeHeight;
            this.RudderCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.RudderCursor.setAttribute("transform", "translate (" + this.RudderCursorX1 + " " + this.RudderCursorY + ")");
            this.RudderCursor.setAttribute("fill", "white");
            this.RudderCursor.setAttribute("d", "M0 0 l-5 15 l10 0 l-5 -15 Z");
            trimGroup.appendChild(this.RudderCursor);
            blockPosY += 30 + gaugeHeight;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "RUD";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            blockPosX = startPosX + 180;
            blockPosY = startPosY + 10;
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ELEV";
            text.setAttribute("x", blockPosX.toString());
            text.setAttribute("y", blockPosY.toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            trimGroup.appendChild(text);
            var gaugeStartX = blockPosX;
            var gaugeStartY = blockPosY + 19;
            var gaugeWidth = 11;
            var gaugeHeight = 85;
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", gaugeStartY.toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", gaugeHeight.toString());
            rect.setAttribute("fill", "black");
            rect.setAttribute("stroke", "white");
            rect.setAttribute("stroke-width", "2");
            trimGroup.appendChild(rect);
            var rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", gaugeStartX.toString());
            rect.setAttribute("y", (gaugeStartY + gaugeHeight * 0.25).toString());
            rect.setAttribute("width", gaugeWidth.toString());
            rect.setAttribute("height", (gaugeHeight * 0.25).toString());
            rect.setAttribute("fill", "green");
            trimGroup.appendChild(rect);
            this.ElevatorCursorX = gaugeStartX + gaugeWidth;
            this.ElevatorCursorY1 = gaugeStartY + gaugeHeight;
            this.ElevatorCursorY2 = gaugeStartY;
            this.ElevatorCursor = document.createElementNS(Avionics.SVG.NS, "path");
            this.ElevatorCursor.setAttribute("transform", "translate (" + this.ElevatorCursorX + " " + this.ElevatorCursorY2 + ")");
            this.ElevatorCursor.setAttribute("fill", "white");
            this.ElevatorCursor.setAttribute("d", "M0 0 l15 -5 l0 10 l-15 -5 Z");
            trimGroup.appendChild(this.ElevatorCursor);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "ND";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (gaugeStartY + 14).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "top");
            trimGroup.appendChild(text);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "NU";
            text.setAttribute("x", (gaugeStartX - 8).toString());
            text.setAttribute("y", (gaugeStartY + gaugeHeight).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "bottom");
            trimGroup.appendChild(text);
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        if (!this.root)
            return;

        if(this.isVisible){
            if(this.currentPage == 1){
                let GenAmp1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:1", "amperes");
                this.DCAmpValueLeft.textContent = Math.round(GenAmp1).toString();
                let GenAmp2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:2", "amperes");
                this.DCAmpValueRight.textContent = Math.round(GenAmp2).toString();
                let GenVolt1 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:1", "volts");
                this.DCVoltValueLeft.textContent = Math.round(GenVolt1).toString();
                let GenVolt2 = SimVar.GetSimVarValue("ELECTRICAL GENALT BUS VOLTAGE:2", "volts");
                this.DCVoltValueRight.textContent = Math.round(GenVolt2).toString();
                let BatAmp = SimVar.GetSimVarValue("ELECTRICAL BATTERY LOAD:1", "amperes");
                this.BATAmpValue.textContent = Math.round(BatAmp).toString();
                let BatVolt = SimVar.GetSimVarValue("ELECTRICAL BATTERY VOLTAGE:1", "volts");
                this.BATVoltValue.textContent = Math.round(BatVolt).toString();
                this.BATTempValue.textContent = "--";
                let HydPSI1 = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:1", "psi");
                this.HYDPSIValueLeft.textContent = Math.round(HydPSI1).toString();
                let HydPSI2 = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:2", "psi");
                this.HYDPSIValueRight.textContent = Math.round(HydPSI2).toString();
                let PPHEng1 = SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "Pounds per hour");
                this.FUELPPHValueLeft.textContent = Math.round(PPHEng1).toString();
                let PPHEng2 = SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "Pounds per hour");
                this.FUELPPHValueRight.textContent = Math.round(PPHEng2).toString();
                this.FUELTempValueLeft.textContent = "--";
                this.FUELTempValueRight.textContent = "--";
            }
            else{

            }
        }
    }
}
registerInstrument("cj4-mfd-element", CJ4_MFD);

//# sourceMappingURL=CJ4_MFD.js.map