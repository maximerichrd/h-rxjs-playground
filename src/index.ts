import got from "got";
import { Ok, Err, Result } from 'ts-results';

type FirstServiceResponse = {
  code: number,
  description: string
}

type HttpCallOkResponse  = {
  sku: number,
  name: string
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

const unstableHttpCall: Promise<HttpCallOkResponse> = new Promise<HttpCallOkResponse>(
  (resolve, reject) => {
    const v = Math.floor(Math.random() * 2)
    const maybeTrue = Boolean(v)
    console.log(`Will the fake unstable http call succeed ? ${v}`)

    if(maybeTrue) {
      setTimeout(() => Ok(resolve({sku: 300, name: "A wonderful watch"})), 10)
    } else {
      setTimeout(() => Err(reject(new Error("Http Call Error"))), 10) 
    }
  }
)

const firstService = async (): Promise<Result<FirstServiceResponse, DomainError>> => {
    try {
      // this url always returns status 200 OK
      const response: FirstServiceResponse = await got(`https://httpstat.us/200`).json()
      return Ok(response)
    } catch (e) {
      return Err(new DomainError(500, "First Service error", e))
    }
  }

const secondService = async (param: {code: number}): Promise<Result<HttpCallOkResponse, DomainError>> => {
  try {
    // simulate a simple use of our param
    if (!param) console.log("Simple use of our param")

    return Ok<HttpCallOkResponse>(await unstableHttpCall)
  } catch (e) {
    return Err(new DomainError(500, "Second Service error", e))
  }
}

const thirdService = async (): Promise<Result<HttpCallOkResponse, DomainError>> => {
  try {
    return Ok<HttpCallOkResponse>(await unstableHttpCall)
  } catch (e) {
    return Err(new DomainError(500, "Second Service error", e))
  }
}


type Dependencies = {
  firstService: typeof firstService,
  secondService: typeof secondService,
}

type ControllerTask = {
  sku: number
  name: string
  code: number
}
const controllerTask = async ({
  firstService,
  secondService 
}: Dependencies): Promise<Result<ControllerTask, DomainError>> => {
  try {
    const code = (await firstService()).unwrap().code;

    (await secondService({ code })).unwrap()

    const {sku, name} = (await thirdService()).unwrap()
    return Ok({ sku, name, code })
  } catch (e) {
    return Err(e)
  }
}

const controller = async (deps: Dependencies) => {
  const task: Result<ControllerTask, DomainError> = await controllerTask(deps)

  return task
    .map(t => send(buildResponse(t)))
    .mapErr(e => send(negotiateErrorResponse(e)))

}


function buildResponse<T = Object>(data: T) {
  return JSON.stringify(data)
}

function negotiateErrorResponse(e: DomainError) {
  console.error("Error on route x")
  return JSON.stringify({ code: e.code, message: e.message })

}

function send<T>(data: T) {
  console.log("Controller Response: ", data)
}

