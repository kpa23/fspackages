class DOMUtilities
{
}

DOMUtilities.IsChildOf = function(child, parent) {
    let parentNode = child.parentNode;
    do {
        if (parentNode == parent)
            return true;
    } while (parentNode = parentNode.parentNode);
    return false;
}

DOMUtilities.IsChildOfSelector = function(child, selector) {
    let parentNode = child.parentNode;
    do {
        if (parentNode.matches(selector))
            return true;
    } while (parentNode = parentNode.parentNode);
    return false;
}

DOMUtilities.GetClosestParent = function(child, selector) {
    let parentNode = child.parentNode;
    do {
        if (parentNode.matches(selector))
            return parentNode;
    } while (parentNode = parentNode.parentNode);
    return null;
}

DOMUtilities.RemoveChildren = function(node, selector) {
    for(let child of node.children) {
        if(selector) {
            if(!node.matches(selector))
                continue;
        }
        node.removeChild(child);
    }
}