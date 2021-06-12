/**
 *  SVGPan library 1.4
 * ====================
 *
 * @author Samin Shams
 */
var has_touch = 'ontouchstart' in window;
var root = document.getElementsByTagName('svg')[0];
var state = 'none', stateTarget, stateOrigin, stateTf;
var allowMove = false;

if (!has_touch) {
    setupHandlers(root);
}
/**
 * Register handlers
 */
function setupHandlers(root){
    setAttributes(root, {
        "onmouseup" : "add(evt)",
        "onmousedown" : "handleMouseDown(evt)",
        "onmousemove" : "handleMouseMove(evt)",
        "onmouseup" : "handleMouseUp(evt)",
        "onmouseout" : "handleMouseUp(evt)",
        "onmousewheel" : "handleMouseWheel(evt)"
    })

    var useragent = navigator.userAgent.toLowerCase();

    if(useragent.indexOf('webkit') >= 0) {
        window.addEventListener('mousewheel', handleMouseWheel, false); // Chrome/Safari
    } else {
        window.addEventListener('DOMMouseScroll', handleMouseWheel, false); // Others
    }
    window.onmousewheel = document.onmousewheel = handleMouseWheel;

    var g = root.getElementsByTagName('g')[0];
    var m = g.getCTM();

    root.removeAttribute('viewBox');
    if (root.hasAttribute('viewBox')) {
        root.setAttribute('viewBox', 'null');
    }

    if(useragent.indexOf('safari') >= 0) {
        if (useragent.indexOf('chrome') >= 0) {
            setCTM(g, m);
        }
    } else {
       setCTM(g, m);
    }
}

/**
 * Instance an SVGPoint object with given event coordinates.
 */
function getEventPoint(evt) {
    var p = root.createSVGPoint();

    p.x = evt.pageX;
    p.y = evt.pageY;

    return p;
}

/**
 * Sets the current transform matrix of an element.
 */
function setCTM(element, matrix) {
    var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";

    element.setAttribute("transform", s);
}

/**
 * Dumps a matrix to a string (useful for debug).
 */
function dumpMatrix(matrix) {
    var s = "matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";

    return s;
}

/**
 * Sets attributes of an element.
 */
function setAttributes(element, attributes){
    for (i in attributes)
        element.setAttributeNS(null, i, attributes[i]);
}

/**
 * Handle mouse move event.
 */
function handleMouseWheel(evt) {

    if(evt.preventDefault)
        evt.preventDefault();

    evt.returnValue = false;

    var svgDoc = evt.target.ownerDocument;

    var delta;
    if(evt.wheelDelta) {
        delta = evt.wheelDelta/2400; // Chrome/Safari
    } else {
        delta = evt.detail/-60; // Mozilla
    }

    var z = 1 + delta; // Zoom factor: 0.9/1.1

    var g = svgDoc.getElementsByTagName('g')[0];
    
    var p = getEventPoint(evt);

    p = p.matrixTransform(g.getCTM().inverse());

    // Compute new scale matrix in current mouse position
    var k = root.createSVGMatrix().translate(p.x, p.y).scale(z).translate(-p.x, -p.y);

    setCTM(g, g.getCTM().multiply(k));

    if(typeof(stateTf) == "undefined")
        stateTf = g.getCTM().inverse();

    stateTf = stateTf.multiply(k.inverse());
}

/**
 * Handle mouse move event.
 */
function handleMouseMove(evt) {
    if(evt.preventDefault)
        evt.preventDefault();

    evt.returnValue = false;

    var svgDoc = evt.target.ownerDocument;

    var g = svgDoc.getElementsByTagName('g')[0];

    if(state == 'pan') {
        // Pan mode
        var p = getEventPoint(evt).matrixTransform(stateTf);

        setCTM(g, stateTf.inverse().translate(p.x - stateOrigin.x, p.y - stateOrigin.y));
    } else if(state == 'move') {
        // Move mode
        var p = getEventPoint(evt).matrixTransform(g.getCTM().inverse());

        setCTM(stateTarget, root.createSVGMatrix().translate(p.x - stateOrigin.x, p.y - stateOrigin.y).multiply(g.getCTM().inverse()).multiply(stateTarget.getCTM()));

        stateOrigin = p;
    }
}

/**
 * Handle click event.
 */
function handleMouseDown(evt) {
    if(evt.preventDefault)
        evt.preventDefault();

    evt.returnValue = false;

    var svgDoc = evt.target.ownerDocument;

    var g = svgDoc.getElementsByTagName('g')[0];

    if(evt.target.tagName == "svg" || !allowMove) {
        // Pan mode */
        state = 'pan';
    } else {
        // Move mode
        state = 'move';
        stateTarget = evt.target;
    }
    stateTf = g.getCTM().inverse();
    stateOrigin = getEventPoint(evt).matrixTransform(stateTf);
}

/**
 * Handle mouse button release event.
 */
function handleMouseUp(evt) {
    if(evt.preventDefault)
        evt.preventDefault();

    evt.returnValue = false;

    var svgDoc = evt.target.ownerDocument;

    if(state == 'pan' || state == 'move') {
        // Quit pan mode
        state = '';
    }
}