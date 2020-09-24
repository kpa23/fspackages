class Drop_Down_Selector_Input_Layer extends Selectables_Input_Layer
{
    constructor(dropDown, selectables) {
        super(selectables, true);
        this.dropDown = dropDown;
    }
    onSelectedElement(element) {
        this.dropDown.selectionUpdated(element.getAttribute("value"));
    }
}

class AS1000_Drop_Down_Selector extends HTMLElement {
    constructor() {
        super();
        this.options = [];
        this._value = null;
        this.elements = {
            value: null,
            popup: null
        };
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value != value) {
            this._value = value;
            for (let option of this.getOptions()) {
                if (option.getAttribute("value") == value) {
                    this.updateSelectedValue(option.innerHTML);

                    let evt = document.createEvent("HTMLEvents");
                    evt.initEvent("change", true, true);
                    this.dispatchEvent(evt);
                }
            }
        }
    }
    connectedCallback() {
        for (let optionNode of this.querySelectorAll("drop-down-selector-option")) {
            this.options.push(optionNode);
        }

        const template = `
            <div class="value"></div>
            <div class="popup"></div>
        `;

        this.innerHTML = template;

        this.elements.value = this.querySelector(".value");
        this.elements.popup = this.querySelector(".popup");

        for (let option of this.options) {
            this.elements.popup.appendChild(option);
        }
        if (this.options.length > 0) {
            this.value = this.options[0].getAttribute("value");
        }
    }
    clearOptions() {
        this.options = [];
        this.elements.popup.innerHTML = "";
    }
    addOption(value, text) {
        let option = document.createElement("drop-down-selector-option");
        option.setAttribute("value", value);
        option.innerHTML = text;
        this.options.push(option);
        this.elements.popup.appendChild(option);
        if (this.options.length == 1) {
            this.value = this.options[0].getAttribute("value");
        }
    }
    getOptions() {
        return this.options;
    }
    updateSelectedValue(html) {
        this.elements.value.innerHTML = html;
    }
    selectionUpdated(value) {
        if (this.shouldUpdateOnSelection()) {
            this.value = value;
        }
    }
    shouldUpdateOnSelection() {
        return this.hasAttribute("updateOnSelection");
    }
    back() {
        this.exit();
    }
    enter(gps, inputStack) {
        return new Promise((resolve) => {
            let selectableElements = [];
            let selectedIndex = 0;
            let i = 0;
            for (let option of this.getOptions()) {
                let selectableElement = new SelectableElement(gps, option, _event => this.onSelectEvent(_event, option.getAttribute("value")))
                selectableElements.push(selectableElement);
                if (option.getAttribute("value") == this.value)
                    selectedIndex = i;
                i++;
            }
            let inputLayer = new Drop_Down_Selector_Input_Layer(this, selectableElements);
            inputLayer.index = selectedIndex;
            inputLayer.setExitHandler(this);
            this.inputStackManipulator = inputStack.push(inputLayer);
            this.setAttribute("ACTIVE","ACTIVE");
            this.resolve = resolve;
        });
    }
    exit() {
        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
        this.removeAttribute("ACTIVE");
        this.resolve();
    }
    onSelectEvent(_event, value) {
        if (_event == "ENT_Push") {
            this.value = value;
            this.exit();
        }
    }
}
customElements.define("drop-down-selector", AS1000_Drop_Down_Selector);