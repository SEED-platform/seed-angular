import { TranslocoDirective } from '@jsverse/transloco'
import { ExternalLinkDirective } from './directives'

export * from './seed.provider'

export const SharedImports = [ExternalLinkDirective, TranslocoDirective] as const
