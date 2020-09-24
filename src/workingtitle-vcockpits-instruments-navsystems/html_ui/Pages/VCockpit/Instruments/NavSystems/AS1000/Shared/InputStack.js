class Input_Layer
{
    onLargeInc() {return false;}
    onLargeDec() {return false;}
    onSmallInc() {return false;}
    onSmallDec() {return false;}
    onMenuPush() {return false;}
    onNavigationPush() {return false;}
    onEnter() {return false;}
    onCLR() {return false;}
    onProceduresPush() {return false;}
    onFlightPlan() {return false;}

    processEvent(_event) {
        switch (_event) {
            case "NavigationLargeInc":
                return this.onLargeInc();
            case "NavigationLargeDec":
                return this.onLargeDec();
            case "NavigationSmallInc":
                return this.onSmallInc();
            case "NavigationSmallDec":
                return this.onSmallDec();
            case "MENU_Push":
                return this.onMenuPush();
            case "ENT_Push":
                return this.onEnter();
            case "NavigationPush":
                return this.onNavigationPush();
            case "PROC_Push":
                return this.onProceduresPush();
            case "CLR":
                return this.onCLR();
            case "FPL_Push":
                return this.onFlightPlan();
        }
        return false;
    }

    onActivate() {}
    onDeactivate() {}
}

class Selectables_Input_Layer extends Input_Layer
{
    constructor(elements, navigateWithSmall = false) {
        super();
        this._index = 0;
        this._elements = elements;
        this.navigateWithSmall = navigateWithSmall;
    }
    get index() {
        return this._index;
    }
    set index(index) {
        if (this.selectedElement)
            this.selectedElement.element.removeAttribute("state");
        index = Math.min(this._elements.length - 1, Math.max(0, index));
        this._index = index;
        if (this.selectedElement) {
            this.selectedElement.element.setAttribute("state","Selected");
            this.selectedElement.SendEvent("selectable-selected", this.selectedElement);
            this.onSelectedElement(this.selectedElement.element);

            let scrollableContainer = DOMUtilities.GetClosestParent(this.selectedElement, ".scrollable-container");
            if (scrollableContainer) {
                let y = this.selectedElement.offsetTop;
                scrollableContainer.scrollTop = y;
            }
        }
        //scrollable-container
    }
    set elements(elements) {
        this._elements = elements;
        if (this._elements) 
            this.index = Math.min(this.index, this._elements.length - 1);
        else
            this.index = 0;
    }
    get numElements() {
        return this._elements.length;
    }
    get selectedElement() {
        return this._elements[this._index];
    }
    onSelectedElement(element) {
    }
    setExitHandler(handler) {
        this.exitHandler = handler;
    }
    onLargeInc() {
        this.index = (this._index + 1) % this.numElements;
    }
    onLargeDec() {
        let newIndex = (this._index - 1);
        if (newIndex < 0) 
            newIndex = this.numElements - 1;
        this.index = newIndex;
    }
    onSmallInc() {
        if (this.navigateWithSmall)
            return this.onLargeInc();
        if (this.selectedElement) {
            return this.selectedElement.SendEvent("NavigationSmallInc", this.index);
        }
    }
    onSmallDec() {
        if (this.navigateWithSmall)
            return this.onLargeDec();
        if (this.selectedElement) {
            return this.selectedElement.SendEvent("NavigationSmallDec", this.index);
        }
    }
    onNavigationPush() {
        if (this.exitHandler) {
            this.exitHandler.back();
        }
    }
    onEnter() {
        if (this.selectedElement) {
            return this.selectedElement.SendEvent("ENT_Push", this.index);
        }
    }
    onActivate() {
        if (this.selectedElement) {
            this.selectedElement.element.setAttribute("state","Selected");
        }
    }
    onDeactivate() {
        if (this.selectedElement) {
            this.selectedElement.element.removeAttribute("state");
        }
    }
}

class Page_Input_Layer extends Input_Layer {
    constructor(page) {
        super();
        this.page = page;
        this.active = false;
    }
    onNavigationPush() {
        this.page.activate();
    }
}

class Base_Input_Layer extends Input_Layer {
    constructor(navSystem) {
        super();
        this.navSystem = navSystem;
    }
    processEvent(_event) {
        this.navSystem.computeEvent2(_event);
    }
}

class Input_Stack {
    constructor(gps) {
        this.gps = gps;
        this.stack = [];
    }
    get currentLayer() {
        return (this.stack.length > 0) ? this.stack[this.stack.length - 1] : null;
    }
    push(layer) {
        let stackSize = this.stack.length;
        if (this.currentLayer) {
            this.currentLayer.onDeactivate();
        }
        this.stack.push(layer);
        this.currentLayer.onActivate();
        console.log("Input stack pushed");
        return {
            pop: () => {
                this.pop(stackSize);
            }
        };
    }
    pop(index) {
        console.log("Input stack popped");
        while(this.stack.length > index) {
            this.currentLayer.onDeactivate();
            this.stack.pop();
        }
        if (this.currentLayer) {
            this.currentLayer.onActivate();
        }
    }
    processEvent(_event) {
        if (!this.currentLayer)
            return;
        let i = this.stack.length - 1;
        while(i >= 0) {
            let layer = this.stack[i];
            let handled = layer.processEvent(_event);
            if (handled !== false)
                return;
            i--;
        }
    }
}