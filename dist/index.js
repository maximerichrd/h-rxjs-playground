"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const got_1 = __importDefault(require("got"));
class DomainError extends Error {
    constructor(code, message) {
        super();
        this.code = code;
        this.message = message;
    }
}
// in a shared error module
// cf https://blog.angular-university.io/rxjs-error-handling/
const globalErrorHandler = (error) => {
    if (error instanceof DomainError) {
        switch (error.code) {
            case 404:
                console.error("404 Not Found Error: ", error);
                return rxjs_1.of({ code: 404, message: error.message });
            case 500:
                console.error("500 Internal Error: ", error);
                return rxjs_1.of({ code: 500, message: error.message });
            default:
                console.error(`${error.code} Error`, error);
                return rxjs_1.of({ code: error.code, message: error.message });
        }
    }
    else
        return rxjs_1.of({ code: 500, message: "500 Internal Error" });
};
// in a Service layer
const firstService = () => rxjs_1.from(got_1.default(`https://httpstat.us/200`).json()).pipe(rxjs_1.catchError((err) => rxjs_1.throwError(() => new DomainError(500, "First Service error"))));
// in another Service layer
const secondService = () => rxjs_1.from(
// this Promise (fake http call) will be turned into 
// an Observable<SecondServiceResponse>
new Promise((resolve, reject) => {
    const v = Math.floor(Math.random() * 2);
    const maybeTrue = Boolean(v);
    console.log(v);
    if (maybeTrue) {
        setTimeout(() => resolve({ sku: 300, name: "A wonderful watch" }), 1000);
    }
    else {
        setTimeout(() => reject(new Error("Second Service Error")), 1000);
    }
})).pipe(rxjs_1.catchError((err) => rxjs_1.throwError(() => new DomainError(500, "Second Service error"))));
// in another Service layer
const thirdService = () => rxjs_1.from(got_1.default(`https://httpstat.us/400`).json()).pipe(rxjs_1.catchError((err) => rxjs_1.throwError(() => new DomainError(500, "Third Service error"))));
// in another Service layer
/* const composedService = ():O<ComposedServiceResponse> =>
  combineLatest([
    firstService(),
    secondService(),
    thirdService()
  ]).pipe(
    map(([
      firstServiceResponse,
      secondServiceResponse,
      thirdServiceResponse
    ]) => {
      return { skus: [
        firstServiceResponse.code,
        secondServiceResponse.sku,
        thirdServiceResponse.code
      ]}
    })
  ) */
const composedService2 = () => firstService().pipe(rxjs_1.switchMap(x => secondService().pipe(rxjs_1.switchMap(y => thirdService().pipe(rxjs_1.map(z => {
    return { skus: [
            x.code,
            y.sku,
            z.code
        ] };
}))))));
// in the Controller layer
function buildResponse(data) {
    return { products_count: data.skus.length, product_codes: data.skus };
}
function sendResponse(data) {
    console.log("Controller Response: ", data);
}
composedService2().pipe(rxjs_1.map(data => buildResponse(data)), rxjs_1.catchError(globalErrorHandler)).subscribe({
    next: res => sendResponse(res)
});
//# sourceMappingURL=index.js.map