var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/node/render.tsx
import { convert } from "html-to-text";
import { Suspense } from "react";

// src/shared/plain-text-selectors.ts
var plainTextSelectors = [
  { selector: "img", format: "skip" },
  { selector: "[data-skip-in-text=true]", format: "skip" },
  {
    selector: "a",
    options: { linkBrackets: false }
  }
];

// src/shared/utils/pretty.ts
import * as html from "prettier/plugins/html";
import { format } from "prettier/standalone";
function recursivelyMapDoc(doc, callback) {
  if (Array.isArray(doc)) {
    return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
  }
  if (typeof doc === "object") {
    if (doc.type === "group") {
      return __spreadProps(__spreadValues({}, doc), {
        contents: recursivelyMapDoc(doc.contents, callback),
        expandedStates: recursivelyMapDoc(
          doc.expandedStates,
          callback
        )
      });
    }
    if ("contents" in doc) {
      return __spreadProps(__spreadValues({}, doc), {
        contents: recursivelyMapDoc(doc.contents, callback)
      });
    }
    if ("parts" in doc) {
      return __spreadProps(__spreadValues({}, doc), {
        parts: recursivelyMapDoc(doc.parts, callback)
      });
    }
    if (doc.type === "if-break") {
      return __spreadProps(__spreadValues({}, doc), {
        breakContents: recursivelyMapDoc(doc.breakContents, callback),
        flatContents: recursivelyMapDoc(doc.flatContents, callback)
      });
    }
  }
  return callback(doc);
}
var modifiedHtml = __spreadValues({}, html);
if (modifiedHtml.printers) {
  const previousPrint = modifiedHtml.printers.html.print;
  modifiedHtml.printers.html.print = (path, options, print, args) => {
    const node = path.getNode();
    const rawPrintingResult = previousPrint(path, options, print, args);
    if (node.type === "ieConditionalComment") {
      const printingResult = recursivelyMapDoc(rawPrintingResult, (doc) => {
        if (typeof doc === "object" && doc.type === "line") {
          return doc.soft ? "" : " ";
        }
        return doc;
      });
      return printingResult;
    }
    return rawPrintingResult;
  };
}
var defaults = {
  endOfLine: "lf",
  tabWidth: 2,
  plugins: [modifiedHtml],
  bracketSameLine: true,
  parser: "html"
};
var pretty = (str, options = {}) => {
  return format(str.replaceAll("\0", ""), __spreadValues(__spreadValues({}, defaults), options));
};

// src/node/read-stream.ts
import { Writable } from "node:stream";
var decoder = new TextDecoder("utf-8");
var readStream = (stream) => __async(void 0, null, function* () {
  let result = "";
  if ("pipeTo" in stream) {
    const writableStream = new WritableStream({
      write(chunk) {
        result += decoder.decode(chunk);
      }
    });
    yield stream.pipeTo(writableStream);
  } else {
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        result += decoder.decode(chunk);
        callback();
      }
    });
    stream.pipe(writable);
    yield new Promise((resolve, reject) => {
      writable.on("error", reject);
      writable.on("close", () => {
        resolve();
      });
    });
  }
  return result;
});

// src/node/render.tsx
import { jsx } from "react/jsx-runtime";
var render = (node, options) => __async(void 0, null, function* () {
  const suspendedElement = /* @__PURE__ */ jsx(Suspense, { children: node });
  const reactDOMServer = yield import("react-dom/server").then(
    // This is beacuse react-dom/server is CJS
    (m) => m.default
  );
  let html2;
  if (Object.hasOwn(reactDOMServer, "renderToReadableStream")) {
    html2 = yield readStream(
      yield reactDOMServer.renderToReadableStream(suspendedElement)
    );
  } else {
    yield new Promise((resolve, reject) => {
      const stream = reactDOMServer.renderToPipeableStream(suspendedElement, {
        onAllReady() {
          return __async(this, null, function* () {
            html2 = yield readStream(stream);
            resolve();
          });
        },
        onError(error) {
          reject(error);
        }
      });
    });
  }
  if (options == null ? void 0 : options.plainText) {
    return convert(html2, __spreadValues({
      selectors: plainTextSelectors
    }, options.htmlToTextOptions));
  }
  const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
  const document = `${doctype}${html2.replace(/<!DOCTYPE.*?>/, "")}`;
  if (options == null ? void 0 : options.pretty) {
    return pretty(document);
  }
  return document;
});

// src/node/index.ts
var renderAsync = (element, options) => {
  return render(element, options);
};
export {
  plainTextSelectors,
  pretty,
  render,
  renderAsync
};
