import type { UrlSerializer, UrlTree } from '@angular/router'
import { DefaultUrlSerializer } from '@angular/router'

export class LowerCaseUrlSerializer implements UrlSerializer {
  private _default = new DefaultUrlSerializer()

  parse(url: string): UrlTree {
    return this._default.parse(url.toLowerCase())
  }

  serialize(tree: UrlTree): string {
    return this._default.serialize(tree)
  }
}