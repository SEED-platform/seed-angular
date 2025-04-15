import type { OnDestroy, OnInit } from '@angular/core'
import { Component, Input } from '@angular/core'
import type { InventoryType, State } from '../inventory.types'

import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

import { fromLonLat } from 'ol/proj'

@Component({
  selector: 'seed-inventory-detail-map',
  templateUrl: './map.component.html',
  imports: [],
})
export class MapComponent implements OnInit, OnDestroy {
  @Input() state: State
  @Input() type: InventoryType

  baseLayer: TileLayer
  boundingBox: unknown
  centroid: unknown
  enableMap = false
  geocodedData: State[]
  geocodedProperties: State[]
  geocodedTaxLots: State[]
  layers: Record<string, unknown> = { base_layer: { zIndex: 0, visible: 1 } }
  unGeocodedData: State[]

  ngOnInit() {
    this.enableMap = Boolean(this.state.ubid && this.state.bounding_box && this.state.centroid)

    if (this.enableMap) {
      this.setGeocodedData()
      this.buildLayers()
    }
  }

  geocodedRelated(data: State[], field: string) {
    const related = []

    for (const record of data) {
      if (record.related?.length) {
        related.push(...record.related.filter((r) => r[field]))
      }
    }
  }

  setGeocodedData() {
    this.geocodedData = this.state.long_lat ? [this.state] : []
    this.unGeocodedData = this.state.long_lat ? [] : [this.state]
    // this.geocodedProperties =
    this.boundingBox = this.state.bounding_box.replace(/^SRID=\d+;/, '')
    this.centroid = this.state.centroid.replace(/^SRID=\d+;/, '')
  }

  buildLayers() {
    this.layers = {
      points_layer: { zIndex: 2, visible: 1 },
      building_bb_layer: { zIndex: 3, visible: this.type === 'taxlots' ? 0 : 1 },
      building_centroid_layer: { zIndex: 4, visible: this.type === 'taxlots' ? 0 : 1 },
      taxlot_bb_layer: { zIndex: 5, visible: this.type === 'taxlots' ? 1 : 0 },
      taxlot_centroid_layer: { zIndex: 6, visible: this.type === 'taxlots' ? 1 : 0 },
    }
  }

  ngOnDestroy() {
    console.log('map destroy')
  }
  // This component is a placeholder for the map view of the inventory detail page.
  // It will be implemented in the future.
}
