import got from "got";
import {
  Result,
  ResultAsync,
} from 'neverthrow'

type FirstServiceResponse = {
  code: number,
  description: string
}

type HttpCallOkResponse  = {
  sku: number,
  name: string
}


type SecondServiceResponse = {
  sku: number,
  name: string
  code: number
}

type ThirdServiceResponse = {
  sku: number,
  name: string
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

const unstableHttpCall: Promise<HttpCallOkResponse> = new Promise(
  (resolve, reject) => {
    const v = Math.floor(Math.random() * 2)
    const maybeTrue = Boolean(v)
    console.log(`Will the fake unstable http call succeed ? ${v}`)

    if(maybeTrue) {
      setTimeout(() => resolve({sku: 300, name: "A wonderful watch"}), 10)
    } else {
      setTimeout(() => reject(new Error("Http Call Error")), 10) 
    }
  }
)

const firstService = (): ResultAsync<FirstServiceResponse, DomainError> => {
    return ResultAsync.fromPromise(
      got(`https://httpstat.us/200`).json(),
      () => new DomainError(500, "First Service error")
    )
}

const secondService = (param: {code: number}): ResultAsync<SecondServiceResponse, DomainError> => {
  console.log("Use param", param)
  return ResultAsync
    .fromPromise(
    unstableHttpCall,
    () => new DomainError(500, "Second Service error")
    )
    .map(res => ({sku: res.sku, name: res.name, code: param.code}))


}

const thirdService = (): ResultAsync<ThirdServiceResponse, DomainError> => {
  return ResultAsync.fromPromise(
    unstableHttpCall,
    () => new DomainError(500, "Third Service error")
  )

}


type Dependencies = {
  firstService: typeof firstService,
  secondService: typeof secondService,
}

type ThirdAndSecond = {
  second: SecondServiceResponse,
  third: ThirdServiceResponse
}

const controllerTask = ({
  firstService,
  secondService 
}: Dependencies): ResultAsync<ThirdAndSecond, DomainError> => {

  return firstService()
    .map(r => r.code)
    .andThen(code => secondService({ code }))
    .andThen(second => thirdService()
      .map(thirdResponse => ({ second, third: thirdResponse }))
    )
}

const controller = async (deps: Dependencies) => {
  const task: Result<ThirdAndSecond, DomainError> = await controllerTask(deps)

  return task
    .map((t: ThirdAndSecond) => send(buildResponse(t)))
    .mapErr((e: DomainError) => send(negotiateErrorResponse(e)))
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

