import got, { CancelableRequest } from 'got';
import { 
  Observable,
  OperatorFunction,
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
  forkJoin
} from 'rxjs';

/* export function switchMap_<P,V>(p: (params: P) => V): OperatorFunction<P, any[]> {
  return switchMap(x(p))
} */

function map_<K extends string, P, V>(project: (params: P) => V): OperatorFunction<P, P>;
function map_<K extends string, P, V>(project: (params: P) => V, key: K): OperatorFunction<P, P & Record<K, V>>;
function map_<K extends string, P, V>(project: (params: P) => V, key?: K): OperatorFunction<P, P> {
  return map(gatherParams(project, key ?? ""));
}

function gatherParams<K extends string, P, V>(fn: (params: P) => V): (params: P) => P;
function gatherParams<K extends string, P, V>(fn: (params: P) => V, key: K): (params: P) => P & Record<K, V>;
function gatherParams<K extends string, P, V>(fn: (params: P) => V, key?: K): (params: P) => P {
  return (params: P) => {
    if (typeof key === 'string') {
      return Object.assign({}, params, { [key]: fn(params) } as Record<K, V>);
    }

    return params;
  };
}


/* export function switchMap_T<P,V>(fn: (previous: P)=> V, project: () => Observable<V>): OperatorFunction<P, [P, V]> {
  return switchMap((x: P) => combine_<P, V>(project)(x))
} */

type arr = (string | number)[]

const x : arr = ["s", 3]

export function combine_<X,V>(arr: [X, () => Observable<V>]): Observable<[X,V]> {
  return combineLatest([
    of(arr[0]),
    arr[1]()
  ])
}