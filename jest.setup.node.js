
const { TextEncoder, TextDecoder } = require("util");

if (global.window === undefined) {

    const { JSDOM } = require("jsdom");
    const jsdom = new JSDOM();

    const { window } = jsdom;

    global.window = global;

    global.window.addEventListener = () => { };
    global.window.removeEventListener = () => { };

    global.document = window.document;
    global.navigator = window.navigator;
    global.DOMParser = window.DOMParser;
    global.Node = window.Node;
    global.XMLSerializer = window.XMLSerializer;
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
    global.window.location = { href: "" };
    global.window.dispatchEvent = () => { };

}

global.self = global; // Mock the `self` global variable