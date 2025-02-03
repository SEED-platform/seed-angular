import type { OnChanges } from '@angular/core'
import { Directive, HostBinding, Input } from '@angular/core'

@Directive({
  selector: 'a[href]',
})
export class ExternalLinkDirective implements OnChanges {
  @HostBinding('attr.href') hrefAttr: string | null = null
  @HostBinding('attr.rel') relAttr: string | null = null
  @HostBinding('attr.target') targetAttr: string | null = null
  @Input() href: string | undefined

  static isLinkExternal(href: string | null) {
    if (!href || href.startsWith('mailto:')) return false
    return new URL(document.baseURI).origin !== new URL(href, document.baseURI).origin
  }

  ngOnChanges() {
    if (this.href) {
      this.hrefAttr = this.href

      if (ExternalLinkDirective.isLinkExternal(this.href)) {
        this.relAttr = 'noopener noreferrer'
        this.targetAttr = '_blank'
      } else {
        this.relAttr = null
        this.targetAttr = null
      }
    }
  }
}
