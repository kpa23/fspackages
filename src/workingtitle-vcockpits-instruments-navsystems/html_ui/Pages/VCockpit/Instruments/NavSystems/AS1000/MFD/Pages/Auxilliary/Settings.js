class AS1000_Default_Settings {
}

AS1000_Default_Settings.base = {
    weight: "kg",
    dis_spd: "nautical",
};

class AS1000_Settings {
    constructor(aircraft, defaults) {
        this.aircraft = aircraft;
        this.defaults = defaults;
        this.settings = {};
        this.lastUpdated = 0;

        this.load();
    }
    getValue(key) {
        if (key in this.settings) {
            return this.settings[key];
        } else if (key in this.defaults) {
            return this.defaults[key];
        } else {
            return null;
        }
    }
    setValue(key, value) {
        this.settings[key] = value;
    }
    getStorageKey() { 
        return "config_" + this.aircraft;
    }
    getTimestampKey() { 
        return "config_timestamp_" + this.aircraft;
    }
    save() {
        let json = JSON.stringify(this.settings);
        this.lastUpdated = (new Date()).getTime();
        SetStoredData(this.getStorageKey(), json);
        SetStoredData(this.getTimestampKey(), this.lastUpdated.toString());
        console.log("Saving settings " + this.lastUpdated);
    }
    load() {
        let storedData = GetStoredData(this.getStorageKey());
        if (storedData) {
            this.settings = JSON.parse(storedData);
            this.lastUpdated = GetStoredData(this.getTimestampKey());
        }
    }
    update() {
        let lastUpdated = parseInt(GetStoredData(this.getTimestampKey()));
        if (lastUpdated && lastUpdated > this.lastUpdated) {
            console.log("Updating settings");
            this.load();
        }
    }
}

class AS1000_Aux_Settings_Page extends HTMLElement {
    connectedCallback() {
        let template = document.getElementById('aux-settings');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        this.settings = null;

        this.selectables = [];
        this.selectableCallback = (_event, _index) => this.onSelectElement(_event, _index);

        this.addEventListener("change", (e) => {
            this.settings.setValue(e.target.dataset.setting, e.target.value);
            this.settings.save();
            console.log(`Modified: ${e.target.dataset.setting} -> ${e.target.value}`);
        });
    };
    applySettings(settings) {
        this.settings = settings;
    }
    /*<div class="element" data-id="weight">
                    <div class="name">Weight</div>
                    <drop-down-selector class="name">
                        <drop-down-selector-option value="kg">Kilograms (KG)</drop-down-selector-option>
                        <drop-down-selector-option value="lb">Pounds (LB)</drop-down-selector-option>
                    </drop-down-selector>
                </div>*/
    enter(gps, inputStack) {
        this.gps = gps;
        this.inputStack = inputStack;

        let selectableElements = [];
        this.selectables = [];
        for (let selectableNode of this.querySelectorAll("drop-down-selector, numeric-input, toggle-switch")) {
            let selectableElement = new SelectableElement(gps, selectableNode, (_event) => this.onSelectElement(_event, selectableNode));
            let selectable = {
                element: selectableElement
            };
            selectableElements.push(selectableElement);
            this.selectables.push(selectable);
        }

        this.inputLayer = new Selectables_Input_Layer(selectableElements);
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
    }
    onSelectElement(_event, node) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            node.enter(this.gps, this.inputStack);/*.then(() => {
                this.inputLayer.onLargeInc();
            });*/
        }
    }
}
customElements.define("g1000-aux-settings", AS1000_Aux_Settings_Page);

class AS1000_MFD_Page extends NavSystemPage {
    constructor(name, element) {
        super(name, "");
        this.element = element;
    }
    init() {
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    } 
}

class AS1000_MFD_SystemSettings extends NavSystemElement {
    constructor(pageContainer, inputStack) {
        super("System Settings");
        this.pageContainer = pageContainer;
        this.inputStack = inputStack;
    }
    getDefaultSelectables() {
        return [];
    }
    init() {
    }
    onReady() {
        return true;
    }
    onEnter() {
        this.pageElement = document.createElement("g1000-aux-settings");
        this.pageContainer.appendChild(this.pageElement);
        this.pageElement.applySettings(this.gps.settings);
        this.inputStackManipulator = this.inputStack.push(new Page_Input_Layer(this));
    }
    activate() {
        this.pageElement.enter(this.gps, this.inputStack);
    }
    deactivate() {
        this.pageElement.exit();
    }
    onUpdate(_deltaTime) {
        
    }
    onExit() {
        this.pageElement.exit();
        this.pageContainer.removeChild(this.pageElement);
        this.inputStackManipulator.pop();
    }
    onEvent(_event) {
    }
}