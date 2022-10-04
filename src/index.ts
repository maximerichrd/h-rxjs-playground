import { 
  Observable as O,
  map, 
  from, 
  catchError, 
  of, 
  combineLatest, 
  throwError, 
  switchMap
} from 'rxjs';
import got, { CancelableRequest } from "got";


type FirstServiceResponse = {
  code: number,
  description: string
}

type SecondServiceResponse = {
  sku: number,
  name: string
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

  constructor(code: number, message: string) {
    super()
    this.code = code
    this.message = message
  }

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
    catchError((err) => throwError(() => new DomainError(500, "First Service error")))
  )

// in another Service layer
const secondService = ():O<SecondServiceResponse> => 
  from<Promise<SecondServiceResponse>>(
    // this Promise (fake http call) will be turned into 
    // an Observable<SecondServiceResponse>
    new Promise((resolve, reject) => {
      const v = Math.floor(Math.random() * 2)
      const maybeTrue = Boolean(v)
      console.log(v)

      if(maybeTrue) {
        setTimeout(() => resolve({sku: 300, name: "A wonderful watch"}), 1000)
      } else {
        setTimeout(() => reject(new Error("Second Service Error")), 1000) 
      }
    })
  ).pipe(
    catchError((err) => throwError(() => new DomainError(500, "Second Service error")))
  )

// in another Service layer
const thirdService = ():O<FirstServiceResponse> => 
  from<CancelableRequest<FirstServiceResponse>>(
    got(`https://httpstat.us/400`).json()
  ).pipe(
    catchError((err) => throwError(() => new DomainError(500, "Third Service error")))
  )

// in another Service layer
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
// but stops the sequence when one of these services fails
const composedService = () => 
firstService()
.pipe(
  switchMap(x => secondService()
  .pipe(
    switchMap(y => thirdService()
    .pipe(
      map(z => {
        return { skus : [ x.code, y.sku, z.code] }
      })
    ))
  ))
)

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



