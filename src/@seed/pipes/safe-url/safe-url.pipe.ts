import type { PipeTransform } from '@angular/core'
import { Pipe } from '@angular/core'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser'

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) { }

  transform(url: string): SafeResourceUrl {
    return this._sanitizer.bypassSecurityTrustResourceUrl(url)
  }
}
