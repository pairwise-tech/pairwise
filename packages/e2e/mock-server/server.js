"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var http_1 = __importDefault(require("http"));
var body_parser_1 = __importDefault(require("body-parser"));
var faker_1 = __importDefault(require("faker"));
var cors_1 = __importDefault(require("cors"));
var express_1 = __importDefault(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var app = express_1["default"]();
// @ts-ignore
app.use(morgan_1["default"]("dev"));
app.use(cors_1["default"]());
app.use(body_parser_1["default"].json());
app.get("/", function (req, res) { return res.send("hi!"); });
app.get("/facebook/profile", function (req, res) {
    var first = faker_1["default"].name.firstName();
    var last = faker_1["default"].name.lastName();
    var result = {
        id: faker_1["default"].random.uuid(),
        name: first + " " + last,
        first_name: first,
        last_name: last,
        email: faker_1["default"].internet.email()
    };
    res.json(result);
});
var PORT = 7000;
var server = http_1["default"].createServer(app);
server.listen(PORT, function () {
    console.log("Mock server listening at http://localhost:" + PORT);
});
