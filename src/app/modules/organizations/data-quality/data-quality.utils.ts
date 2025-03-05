import type { Rule, UnitSymbols } from '@seed/api/data-quality'

export class DataQualityUtils {
  private static _unitLookup = {
    'ft**2': 'square feet',
    'm**2': 'square metres',
    'kBtu/ft**2/year': 'kBtu/sq. ft./year',
    'gal/ft**2/year': 'gal/sq. ft./year',
    'GJ/m**2/year': 'GJ/m²/year',
    'MJ/m**2/year': 'MJ/m²/year',
    'kWh/m**2/year': 'kWh/m²/year',
    'kBtu/m**2/year': 'kBtu/m²/year',
  }

  static getDisplayName(columnDisplayName: string, rule: Rule): string {
    return `${columnDisplayName} ${this.getCriteria(rule)}`
  }

  static getCriteria(rule: Rule): string {
    switch (rule.condition) {
      case 'not_null':
        return 'is not null'
      case 'required':
        return 'is required'
      case 'include':
        return `must include "${rule.text_match}"`
      case 'exclude':
        return `must not include "${rule.text_match}"`
      case 'range':
        return this.getRangeText(rule)
      default:
        return rule.condition
    }
  }

  static getGoalCriteria(rule: Rule): string {
    const cycleText = rule.cross_cycle ? '% change across cycles ' : ''
    return cycleText + this.getCriteria(rule)
  }

  static getRangeText(rule: Rule): string {
    const { min, max, data_type, units } = rule
    const unitText = this._unitLookup[units as UnitSymbols] || ''

    if (min !== null && max !== null) {
      const minText = data_type === 2 ? this.formatDate(min) : min.toLocaleString()
      const maxText = data_type === 2 ? this.formatDate(max) : max.toLocaleString()
      return `is between [ ${minText} ] and [ ${maxText} ] ${unitText}`
    }

    if (min !== null) return `is greater than [ ${min.toLocaleString()} ] ${unitText}`
    if (max !== null) return `is less than [ ${max.toLocaleString()} ] ${unitText}`

    return ''
  }

  static formatDate(dateYMD: number): string {
    const dateString = dateYMD.toString()
    const year = dateString.slice(0, 4)
    const month = dateString.slice(4, 6)
    const day = dateString.slice(6, 8)
    return `${month}/${day}/${year}`
  }
}
