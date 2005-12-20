
/**
 * Athena Widgets
 *
 * This module defines a base class useful for adding behaviors to
 * discrete portions of a page.  These widgets can be independent of
 * other content on the same page, allowing separately developed
 * widgets to be combined, or multiple instances of a single widget to
 * appear repeatedly on the same page.
 */

Nevow.Athena.Widget = Nevow.Athena.RemoteReference.subclass();
Nevow.Athena.Widget.prototype.__init__ = function(widgetNode) {
    this.node = widgetNode;
    Nevow.Athena.Widget.upcall(this, "__init__", Nevow.Athena.athenaIDFromNode(widgetNode));
};

Nevow.Athena.Widget.prototype.visitNodes = function(visitor) {
    Nevow.Athena._walkDOM(this.node, function(node) {
        var result = visitor(node);
        if (result || result == undefined) {
            return true;
        } else {
            return false;
        }
    });
};

Nevow.Athena.Widget.prototype.nodeByAttribute = function(attrName, attrValue) {
    return Nevow.Athena.NodeByAttribute(this.node, attrName, attrValue);
};

Nevow.Athena.Widget.prototype.nodesByAttribute = function(attrName, attrValue) {
    return Nevow.Athena.NodesByAttribute(this.node, attrName, attrValue);
};

Nevow.Athena.Widget._athenaWidgets = {};

/**
 * Given any node within a Widget (the client-side representation of a
 * LiveFragment), return the instance of the Widget subclass that corresponds
 * with that node, creating that Widget subclass if necessary.
 */
Nevow.Athena.Widget.get = function(node) {
    var widgetNode = Nevow.Athena.nodeByDOM(node);
    var widgetId = Nevow.Athena.athenaIDFromNode(widgetNode);
    if (Nevow.Athena.Widget._athenaWidgets[widgetId] == null) {
        Nevow.Athena.Widget._athenaWidgets[widgetId] = new this(widgetNode);
    }
    return Nevow.Athena.Widget._athenaWidgets[widgetId];
};

/**
 * Search the whole document for a particular widget id.
 */
Nevow.Athena.Widget.fromAthenaID = function(widgetId) {
    var visitor = function(node) {
        return (Nevow.Athena.athenaIDFromNode(node) == widgetId);
    }
    var nodes = Nevow.Athena._walkDOM(document, visitor);

    if (nodes.length != 1) {
        throw new Error(nodes.length + " nodes with athena id " + widgetId);
    };

    return Nevow.Athena.Widget.get(nodes[0]);
};

/*
 * Walk the document.  Find things with a athena:class attribute
 * and instantiate them.
 */
Nevow.Athena.Widget._instantiateWidgets = function() {
    var visitor = function(n) {
        var cls = Nevow.Athena.athenaClassFromNode(n);
        if (cls) {
            Divmod.debug("widget", "Found Widget class " + cls + ", instantiating.");
            var inst = cls.get(n);
            Divmod.debug("widget", "Widget class " + cls + " instantiated.");
            if (inst.loaded != undefined) {
                inst.loaded();
                Divmod.debug("widget", "Widget class " + cls + " loaded.");
            }
        }
    }
    Nevow.Athena._walkDOM(document, visitor);
}

Nevow.Athena.callByAthenaID = function(athenaID, methodName, varargs) {
    var widget = Nevow.Athena.Widget.fromAthenaID(athenaID);
    Divmod.debug('widget', 'Invoking ' + methodName + ' on ' + widget + '(' + widget[methodName] + ')');
    return widget[methodName].apply(widget, varargs);
};

/**
 * Instantiate Athena Widgets, make initial server connection, and set
 * up listener for "onunload" event to do finalization.
 */
Nevow.Athena.Widget._initialize = function() {
    Divmod.debug("widget", "Instantiating live widgets");
    Nevow.Athena.Widget._instantiateWidgets();
    Divmod.debug("widget", "Finished instantiating live widgets");
}

MochiKit.DOM.addLoadEvent(Nevow.Athena.Widget._initialize);