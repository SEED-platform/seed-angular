import type { HttpRequest } from '@angular/common/http'
import type { Observable } from 'rxjs'

export type MockApiReplyCallback =
  | ((data: { request: HttpRequest<any>; urlParams: Record<string, string> }) => [number, string | any] | Observable<any>)
  | undefined

export type MockApiMethods = 'get' | 'post' | 'patch' | 'delete' | 'put' | 'head' | 'jsonp' | 'options'
