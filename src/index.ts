import { 
  Observable as O,
  map, 
  from, 
  catchError, 
  of, 
  combineLatest, 
  throwError, 
  switchMap,
  concat,
  concatAll,
  concatMap,
  mergeMap,
  forkJoin,
  Observable,
  OperatorFunction
} from 'rxjs';
import got, { CancelableRequest } from "got";
import {combine_} from "./rx-utils"


type FirstServiceResponse = {
  code: number,
  description: string
}

type SecondServiceResponse = {
  sku: number,
  name: string
}

type ThirdServiceResponse = {
  code: number,
}

type ComposedServiceResponse = {
  skus: number[],
}

type ControllerResponse = {
  products_count: number, 
  product_codes: number[]
}

type ControllerErrorResponse = {
  code: number,
  message: string
}

class DomainError extends Error {
  code: number
  message: string
  error: Error

  constructor(code: number, message: string, error: Error) {
    super()
    this.code = code
    this.message = message
    this.error = error
  }

}

interface Params {
  fisrt: FirstServiceResponse;
  second: SecondServiceResponse;
  third: FirstServiceResponse;
}

// in a shared error module
// cf https://blog.angular-university.io/rxjs-error-handling/
const globalErrorHandler = (error: unknown) => {
  if (error instanceof DomainError) {
    switch (error.code) {
      case 404 : 
        console.error("404 Not Found Error: ", error)
        return of({code: 404, message: error.message})
      case 500 :
        console.error("500 Internal Error: ", error)
        return of({code: 500, message: error.message}) 
      default: 
        console.error(`${error.code} Error`, error)
        return of({code: error.code, message: error.message})
    }
  }
  else return of({code: 500, message: "500 Internal Error"})
}

// in a Service layer
const firstService = ():O<FirstServiceResponse> => 
  from<CancelableRequest<FirstServiceResponse>>(
    got(`https://httpstat.us/200`).json()
  ).pipe(
    catchError((e) => throwError(() => new DomainError(500, "First Service error", e)))
  )

// in another Service layer
const secondService = (data: FirstServiceResponse):O<SecondServiceResponse> => 
  from<Promise<SecondServiceResponse>>(
    // this Promise (fake http call) will be turned into 
    // an Observable<SecondServiceResponse>
    new Promise((resolve, reject) => {
      if(!data) console.log("first service problem")

      const v = Math.floor(Math.random() * 2)
      const maybeTrue = Boolean(v)
      console.log(v)

      if(maybeTrue) {
        setTimeout(() => resolve({sku: 300, name: "A wonderful watch"}), 10)
      } else {
        setTimeout(() => reject(new Error("Second Service Error")), 10) 
      }
    })
  ).pipe(
    catchError((e) => throwError(() => new DomainError(500, "Second Service error", e)))
  )

// in another Service layer
const thirdService = ():O<ThirdServiceResponse> => 
  from<CancelableRequest<ThirdServiceResponse>>(
    got(`https://httpstat.us/400`).json()
  ).pipe(
    catchError((e) => throwError(() => new DomainError(500, "Third Service error", e)))
  )

// This service runs 3 services sequentially, in order
// but does not stop the sequence when one of these services fails

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


// This service runs 3 services sequentially, in order
// and stops the sequence when one of these services fails
// GOOD !
// still problem: the nested arrays in the result
const composedService1 = () => 
firstService()
.pipe(
  switchMap(x => secondService(x).pipe(
    switchMap(y => thirdService().pipe(
      map(z => {
        return { skus : [ x.code, y.sku, z.code] }
      })
    ))
  ))
)


// Now we refacto the composedService1 above
function bind<A, B>(
  service: (p: A) => () => Observable<B>
) {
  return switchMap((x: A) => 
    combineLatest([
      of(x),
      service(x)()
    ])
  ) 
}

const composedService = () => 
  firstService()
  .pipe(
    bind((result: FirstServiceResponse) => () => secondService(result)),
    bind(() => thirdService),
    // result below
    // is full of nested arrays 
    // and this is a problem, we cannot code like this
    map(([[first, second], third]) => ({ skus: [first.code, second.sku, third.code]}))
)

/*
const composedServiceC = () => 
concatMap

firstService()
.pipe(
  switchMap(x => secondService().pipe(
    switchMap(y => thirdService().pipe(
      map(z => {
        return { skus : [ x.code, y.sku, z.code] }
      })
    ))
  ))
)

*/
// Parallel calls
// problem: even when secondService errors, the response is the thirdService error.
/* const composedServiceF = () => 
      forkJoin(
        [
          firstService(),
          secondService(),
          thirdService()
        ]
      ).pipe(
        map(([one, two, three]) => {
          return {skus: [one.code, two.sku, three.code]}
        })
      ) */

/* const composedService = () =>
  firstService().pipe(
    mergeMap(x => secondService()),
    mergeMap(x => thirdService()),
  ) */

// in the Controller layer
function buildResponse(data: ComposedServiceResponse) {
  return {products_count: data.skus.length, product_codes: data.skus}
}

function sendResponse<T>(data: T) {
  console.log("Controller Response: ", data)
}

const controller = () => composedService().pipe(
  map(data => buildResponse(data)),
  catchError(globalErrorHandler) 
).subscribe({
  next: res => sendResponse<ControllerResponse | ControllerErrorResponse>(res)
})

controller()



