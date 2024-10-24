(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MonacoJsxSyntaxHighlight = {}));
})(this, (function (exports) {
    var worker = "/******************************************************************************\r\nCopyright (c) Microsoft Corporation.\r\n\r\nPermission to use, copy, modify, and/or distribute this software for any\r\npurpose with or without fee is hereby granted.\r\n\r\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\r\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\r\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\r\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\r\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\r\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\r\nPERFORMANCE OF THIS SOFTWARE.\r\n***************************************************************************** */\r\n\r\nvar __assign = function() {\r\n    __assign = Object.assign || function __assign(t) {\r\n        for (var s, i = 1, n = arguments.length; i < n; i++) {\r\n            s = arguments[i];\r\n            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];\r\n        }\r\n        return t;\r\n    };\r\n    return __assign.apply(this, arguments);\r\n};\n\nvar getTypescriptUrl=function(){var t=\"https://cdnjs.cloudflare.com/ajax/libs/typescript/4.6.4/typescript.min.js\";try{return __TYPESCRIPT_CUSTOM_URL__||t}catch(r){return t}};\"undefined\"==typeof window&&self.importScripts([getTypescriptUrl()]);var Typescript=self.ts;\n\nvar JsxToken={angleBracket:\"jsx-tag-angle-bracket\",attributeKey:\"jsx-tag-attribute-key\",tagName:\"jsx-tag-name\",expressionBraces:\"jsx-expression-braces\",text:\"jsx-text\",orderTokenPrefix:\"jsx-tag-order\"};\n\nvar getRowAndColumn=function(n,o){for(var t=0,e=0;e+o[t]<n;)e+=o[t],t+=1;return {row:t+1,column:n-e}};var getNodeRange=function(n){return \"function\"==typeof n.getStart&&\"function\"==typeof n.getEnd?[n.getStart(),n.getEnd()]:void 0!==n.pos&&void 0!==n.end?[n.pos,n.end]:[0,0]};var calcPosition=function(n,o){var t=getNodeRange(n),e=t[0],r=t[1];return {indexes:[e,r],positions:[getRowAndColumn(e+1,o),getRowAndColumn(r,o)]}};\n\nvar disposeJsxElementOrFragment=function(n){var s=n.node,e=n.lines,t=n.classifications,o=n.config,a=n.context,i=\"\".concat(JsxToken.orderTokenPrefix,\"-\").concat(a.jsxTagOrder);if(a.jsxTagOrder=a.jsxTagOrder+1>o.jsxTagCycle?1:a.jsxTagOrder+1,s.kind===Typescript.SyntaxKind.JsxSelfClosingElement){var r=calcPosition(s,e).positions,c=calcPosition(s.tagName,e).positions;t.push({start:r[0],end:r[0],tokens:[JsxToken.angleBracket,i]}),t.push({start:__assign(__assign({},r[1]),{column:r[1].column-1}),end:r[1],tokens:[JsxToken.angleBracket,i]}),t.push({start:c[0],end:c[1],tokens:[JsxToken.tagName,i]});}else {var p=s.kind===Typescript.SyntaxKind.JsxFragment?s.openingFragment:s.openingElement,g=s.kind===Typescript.SyntaxKind.JsxFragment?s.closingFragment:s.closingElement,l=calcPosition(p,e).positions,k=calcPosition(g,e).positions;if(t.push({start:l[0],end:l[0],tokens:[JsxToken.angleBracket,i]}),t.push({start:l[1],end:l[1],tokens:[JsxToken.angleBracket,i]}),t.push({start:k[0],end:__assign(__assign({},k[0]),{column:k[0].column+1}),tokens:[JsxToken.angleBracket,i]}),t.push({start:k[1],end:k[1],tokens:[JsxToken.angleBracket,i]}),s.kind===Typescript.SyntaxKind.JsxElement){var m=calcPosition(p.tagName,e).positions,x=calcPosition(g.tagName,e).positions;t.push({start:m[0],end:m[1],tokens:[JsxToken.tagName,i]}),t.push({start:x[0],end:x[1],tokens:[JsxToken.tagName,i]});}}};\n\nvar disposeJsxAttributeKey=function(o){var t=o.node,i=o.lines,s=o.classifications,e=calcPosition(t,i).positions;s.push({start:e[0],end:e[1],tokens:[JsxToken.attributeKey]});};\n\nvar disposeJsxExpression=function(s){var o=s.node,e=s.lines,n=s.classifications,i=calcPosition(o,e).positions;n.push({start:i[0],end:i[0],tokens:[JsxToken.expressionBraces]}),n.push({start:i[1],end:i[1],tokens:[JsxToken.expressionBraces]});};\n\nvar disposeJsxText=function(o){var s=o.node,i=o.lines,t=o.classifications,n=calcPosition(s,i).positions;t.push({start:n[0],end:n[1],tokens:[JsxToken.text]});};\n\nvar disposeNode=function(e){var s=e.node,i=e.index;[Typescript.SyntaxKind.JsxFragment,Typescript.SyntaxKind.JsxElement,Typescript.SyntaxKind.JsxSelfClosingElement].includes(s.kind)&&disposeJsxElementOrFragment(e),s.parent&&s.parent.kind===Typescript.SyntaxKind.JsxAttribute&&s.kind===Typescript.SyntaxKind.Identifier&&0===i&&disposeJsxAttributeKey(e),s.kind===Typescript.SyntaxKind.JsxExpression&&disposeJsxExpression(e),s.kind===Typescript.SyntaxKind.JsxText&&disposeJsxText(e);},walkAST=function(e){disposeNode(e);var s=0;Typescript.forEachChild(e.node,(function(i){return walkAST(__assign(__assign({},e),{node:i,index:s++}))}));},withDefaultConfig=function(e){var s=(e||{}).jsxTagCycle;return {jsxTagCycle:void 0===s?3:s}};var analysis=function(e,s,i){try{var t=[],n=Typescript.createSourceFile(e,s,Typescript.ScriptTarget.ES2020,!0),r=s.split(\"\\n\").map((function(e){return e.length+1}));return walkAST({node:n,lines:r,context:{jsxTagOrder:1},classifications:t,config:withDefaultConfig(i),index:0}),t}catch(e){return (null==i?void 0:i.enableConsole)&&console.error(e),[]}};\n\nself.addEventListener(\"message\",(function(s){var a=s.data,e=a.code,i=a.filePath,n=a.version,o=a.config;try{var l=analysis(i,e,o);self.postMessage({classifications:l,version:n,filePath:i});}catch(s){(null==o?void 0:o.enableConsole)&&console.error(s);}}));\n";
    var Worker$1 = {
    	worker: worker
    };

    var getWorker = function () { return Worker$1; };

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var getTypescriptUrl = function () {
        var defaultUrl = 'https://cdnjs.cloudflare.com/ajax/libs/typescript/4.6.4/typescript.min.js';
        try {
            // @ts-ignore
            return __TYPESCRIPT_CUSTOM_URL__ || defaultUrl;
        }
        catch (_a) {
            return defaultUrl;
        }
    };
    if (typeof window === 'undefined') {
        // @ts-ignore
        self.importScripts([getTypescriptUrl()]);
    }
    var Typescript = self.ts;

    var JsxToken = {
        angleBracket: 'jsx-tag-angle-bracket',
        attributeKey: 'jsx-tag-attribute-key',
        tagName: 'jsx-tag-name',
        expressionBraces: 'jsx-expression-braces',
        text: 'jsx-text',
        orderTokenPrefix: 'jsx-tag-order'
    };

    /**
     * 获取对应下标所处行列数据
     * @param {*} index 索引下标(以1开始)
     * @param {*} lines 每行长度数据
     * @returns
     */
    var getRowAndColumn = function (index, lines) {
        var line = 0;
        var offset = 0;
        while (offset + lines[line] < index) {
            offset += lines[line];
            line += 1;
        }
        return { row: line + 1, column: index - offset };
    };
    /**
     * 获取节点位置
     * @param {} node 节点
     * @returns
     */
    var getNodeRange = function (node) {
        if (typeof node.getStart === 'function' && typeof node.getEnd === 'function') {
            return [node.getStart(), node.getEnd()];
        }
        else if (typeof node.pos !== 'undefined' && typeof node.end !== 'undefined') {
            return [node.pos, node.end];
        }
        return [0, 0];
    };
    // 计算开始结束行列位置
    var calcPosition = function (node, lines) {
        var _a = getNodeRange(node), start = _a[0], end = _a[1];
        return {
            indexes: [start, end],
            positions: [getRowAndColumn(start + 1, lines), getRowAndColumn(end, lines)]
        };
    };

    /**
     * 处理 jsx element 或者 fragment
     * @param {*} data
     */
    var disposeJsxElementOrFragment = function (data) {
        var node = data.node, lines = data.lines, classifications = data.classifications;
        var config = data.config;
        var context = data.context;
        var orderToken = "".concat(JsxToken.orderTokenPrefix, "-").concat(context.jsxTagOrder);
        context.jsxTagOrder = context.jsxTagOrder + 1 > config.jsxTagCycle ? 1 : context.jsxTagOrder + 1;
        // em <div />
        if (node.kind === Typescript.SyntaxKind.JsxSelfClosingElement) {
            var positions = calcPosition(node, lines).positions;
            var tagNamePositions = calcPosition(node.tagName, lines).positions;
            // <div /> => "<"
            classifications.push({
                start: positions[0],
                end: positions[0],
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // <div /> => "/>"
            classifications.push({
                start: __assign(__assign({}, positions[1]), { column: positions[1].column - 1 }),
                end: positions[1],
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // <div /> => "div"
            classifications.push({
                start: tagNamePositions[0],
                end: tagNamePositions[1],
                tokens: [JsxToken.tagName, orderToken]
            });
        }
        else {
            var openingNode = node.kind === Typescript.SyntaxKind.JsxFragment
                ? node.openingFragment
                : node.openingElement;
            var closingNode = node.kind === Typescript.SyntaxKind.JsxFragment
                ? node.closingFragment
                : node.closingElement;
            var openingPositions = calcPosition(openingNode, lines).positions;
            var closingPositions = calcPosition(closingNode, lines).positions;
            // <div> => "<"
            classifications.push({
                start: openingPositions[0],
                end: openingPositions[0],
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // <div> => ">"
            classifications.push({
                start: openingPositions[1],
                end: openingPositions[1],
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // </div> => "</"
            classifications.push({
                start: closingPositions[0],
                end: __assign(__assign({}, closingPositions[0]), { column: closingPositions[0].column + 1 }),
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // </div> => ">"
            classifications.push({
                start: closingPositions[1],
                end: closingPositions[1],
                tokens: [JsxToken.angleBracket, orderToken]
            });
            // <div> </div> => "div"
            if (node.kind === Typescript.SyntaxKind.JsxElement) {
                var openingTagNamePositions = calcPosition(openingNode.tagName, lines).positions;
                var closingTagNamePositions = calcPosition(closingNode.tagName, lines).positions;
                classifications.push({
                    start: openingTagNamePositions[0],
                    end: openingTagNamePositions[1],
                    tokens: [JsxToken.tagName, orderToken]
                });
                classifications.push({
                    start: closingTagNamePositions[0],
                    end: closingTagNamePositions[1],
                    tokens: [JsxToken.tagName, orderToken]
                });
            }
        }
    };

    /**
     * 分析jsx attribute key
     * @param data
     */
    var disposeJsxAttributeKey = function (data) {
        var node = data.node, lines = data.lines, classifications = data.classifications;
        var positions = calcPosition(node, lines).positions;
        classifications.push({
            start: positions[0],
            end: positions[1],
            tokens: [JsxToken.attributeKey]
        });
    };

    var disposeJsxExpression = function (data) {
        var node = data.node, lines = data.lines, classifications = data.classifications;
        var positions = calcPosition(node, lines).positions;
        // className={`666`} => "{"
        classifications.push({
            start: positions[0],
            end: positions[0],
            tokens: [JsxToken.expressionBraces]
        });
        // className={`666`} => "}"
        classifications.push({
            start: positions[1],
            end: positions[1],
            tokens: [JsxToken.expressionBraces]
        });
    };

    var disposeJsxText = function (data) {
        var node = data.node, lines = data.lines, classifications = data.classifications;
        var positions = calcPosition(node, lines).positions;
        classifications.push({
            start: positions[0],
            end: positions[1],
            tokens: [JsxToken.text]
        });
    };

    var disposeNode = function (data) {
        var node = data.node, index = data.index;
        // 寻找到 jsx element or fragment 节点
        if ([
            Typescript.SyntaxKind.JsxFragment,
            Typescript.SyntaxKind.JsxElement,
            Typescript.SyntaxKind.JsxSelfClosingElement
        ].includes(node.kind)) {
            disposeJsxElementOrFragment(data);
        }
        // jsx attribute key
        if (node.parent &&
            node.parent.kind === Typescript.SyntaxKind.JsxAttribute &&
            node.kind === Typescript.SyntaxKind.Identifier &&
            index === 0) {
            disposeJsxAttributeKey(data);
        }
        // jsx expression
        if (node.kind === Typescript.SyntaxKind.JsxExpression) {
            disposeJsxExpression(data);
        }
        if (node.kind === Typescript.SyntaxKind.JsxText) {
            disposeJsxText(data);
        }
    };
    var walkAST = function (data) {
        disposeNode(data);
        var counter = 0;
        Typescript.forEachChild(data.node, function (child) {
            return walkAST(__assign(__assign({}, data), { node: child, index: counter++ }));
        });
    };
    var withDefaultConfig = function (config) {
        var _a = (config || {}).jsxTagCycle, jsxTagCycle = _a === void 0 ? 3 : _a;
        return {
            jsxTagCycle: jsxTagCycle
        };
    };
    var analysis = function (filePath, code, config) {
        try {
            var classifications = [];
            var sourceFile = Typescript.createSourceFile(filePath, code, Typescript.ScriptTarget.ES2020, true);
            // 切割分析每一行的长度
            var lines = code.split('\n').map(function (line) { return line.length + 1; });
            walkAST({
                node: sourceFile,
                lines: lines,
                context: { jsxTagOrder: 1 },
                classifications: classifications,
                config: withDefaultConfig(config),
                index: 0
            });
            return classifications;
        }
        catch (e) {
            // 根据配置打印错误
            if (config === null || config === void 0 ? void 0 : config.enableConsole) {
                console.error(e);
            }
            return [];
        }
    };

    /**
     * 高亮
     */
    var MonacoJsxSyntaxHighlight = /** @class */ (function () {
        function MonacoJsxSyntaxHighlight(worker, monaco, config) {
            var _this = this;
            this.createWorkerFromPureString = function (content, config) {
                // URL.createObjectURL
                window.URL = window.URL || window.webkitURL;
                var blob;
                // replace the custom url
                content = content.replace('__TYPESCRIPT_CUSTOM_URL__', (config === null || config === void 0 ? void 0 : config.customTypescriptUrl) ? "'".concat(config === null || config === void 0 ? void 0 : config.customTypescriptUrl, "'") : 'undefined');
                try {
                    blob = new Blob([content], { type: 'application/javascript' });
                }
                catch (e) {
                    window.BlobBuilder =
                        window.BlobBuilder ||
                            window.WebKitBlobBuilder ||
                            window.MozBlobBuilder;
                    blob = new window.BlobBuilder();
                    blob.append(content);
                    blob = blob.getBlob();
                }
                var worker = new Worker(URL.createObjectURL(blob));
                // free
                URL.revokeObjectURL(blob);
                return worker;
            };
            this.highlighterBuilder = function (context) {
                var editor = context.editor, _a = context.filePath, filePath = _a === void 0 ? editor.getModel().uri.toString() : _a;
                var decorationsRef = { current: [] };
                var disposeMessage = function (event) {
                    var _a = event.data, classifications = _a.classifications, version = _a.version, disposeFilePath = _a.filePath;
                    requestAnimationFrame(function () {
                        // 确认为本文件，并且为最新版本
                        if (disposeFilePath === filePath && version === editor.getModel()?.getVersionId()) {
                            var preDecoration = decorationsRef.current;
                            decorationsRef.current = editor.deltaDecorations(preDecoration, classifications.map(function (classification) { return ({
                                range: new _this.monaco.Range(classification.start.row, classification.start.column, classification.end.row, classification.end.column + 1),
                                options: {
                                    inlineClassName: classification.tokens.join(' ')
                                }
                            }); }));
                        }
                    });
                };
                // 注册监听事件
                _this.worker.addEventListener('message', disposeMessage);
                return {
                    highlighter: function (code) {
                        requestAnimationFrame(function () {
                            var disposeCode = code || editor.getModel().getValue();
                            // send message to worker
                            _this.worker.postMessage({
                                code: disposeCode,
                                filePath: filePath,
                                version: editor.getModel().getVersionId()
                            });
                        });
                    },
                    dispose: function () {
                        _this.worker.removeEventListener('message', disposeMessage);
                    }
                };
            };
            this.monaco = monaco;
            if (typeof worker === 'string') {
                this.worker = new Worker(worker);
            }
            else if (worker.worker &&
                typeof worker.worker === 'string') {
                this.worker = this.createWorkerFromPureString(worker.worker, config);
            }
            else {
                this.worker = worker;
            }
        }
        return MonacoJsxSyntaxHighlight;
    }());

    exports.MonacoJsxSyntaxHighlight = MonacoJsxSyntaxHighlight;
    exports.analysis = analysis;
    exports.getWorker = getWorker;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
