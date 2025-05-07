import type { AfterViewInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, EMPTY, finalize, map, mergeMap, range, scan, switchMap, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Organization, OrgCycle } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import type { FilterResponse, InventoryTypeGoal, State } from 'app/modules/inventory/inventory.types'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatIconModule } from '@angular/material/icon'
import { MapService } from '@seed/services/map'
import { defaults as defaultControls } from 'ol/control'
import Circle from 'ol/style/Circle'
import Cluster from 'ol/source/Cluster'
import { Overlay, type Feature } from 'ol'
import Fill from 'ol/style/Fill'
import { fromLonLat } from 'ol/proj'
import GeoJSON from 'ol/format/GeoJSON'
import HexBin from 'ol-ext/source/HexBin'
import Icon from 'ol/style/Icon'
import Map from 'ol/Map'
import OSM from 'ol/source/OSM'
import Source from 'ol/source/Source'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import TileLayer from 'ol/layer/Tile'
import { transformExtent } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import View from 'ol/View'
import WKT from 'ol/format/WKT'
import Text from 'ol/style/Text'
import { Label } from '@seed/api/label'

@Component({
  selector: 'seed-inventory-list-map',
  templateUrl: './map.component.html',
  imports: [
    MatSelectModule,
    PageComponent,
    MatProgressBarModule,
    MatIconModule,
  ],
})
export class MapComponent implements AfterViewInit {
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _mapService = inject(MapService)
  private _userService = inject(UserService)
  private _route = inject(ActivatedRoute)

  baseLayer: TileLayer
  censusTractLayer: VectorLayer
  currentUser: CurrentUser
  chunk = 250
  cycles: OrgCycle[]
  cycle: OrgCycle
  data: State[] = []
  defaultField: 'property_display_field' | 'taxlot_display_field'
  filteredRecords = 0
  geocodedData: State[] = []
  geocodedProperties: State[]
  geocodedTaxlots: State[]
  group: { views_list: number[] } // FUTURE: HANDLE GROUPS
  groupId: number // FUTURE: HANDLE GROUPS
  hexbinColor = [75, 0, 130]
  hexbinLayer: VectorLayer
  hexbinMaxOpacity = 0.8
  hexbinMinOpacity = 0.2
  hexagonSize = 750
  highlightDACs = true
  inProgress = false
  layers: Record<string, { zIndex: number; visible: boolean }>
  map: Map
  orgId: number
  pointsLayer: VectorLayer
  popupOverlay = new Overlay({
    element: document.getElementById('popup-element'),
    positioning: 'bottom-center',
    stopEvent: false,
    autoPan: true,
    // autoPanMargin: 75, ?????????? dne?
    offset: [0, -10]
  })
  progress = { current: 0, total: 0, percent: 0, chunk: 0 }
  propertyBBLayer: VectorLayer
  propertyCentroidLayer: VectorLayer
  requestParams: URLSearchParams
  requestData = {}
  selectedLabels: Label[] = []
  taxlotBBLayer: VectorLayer
  taxlotCentroidLayer: VectorLayer
  type = this._route.snapshot.paramMap.get('type') as InventoryTypeGoal


  ngAfterViewInit(): void {
    this.defaultField = this.type === 'properties' ? 'property_display_field' : 'taxlot_display_field'
    this.initPage()
  }

  selectCycle() {
    this.currentUser.settings.cycleId = this.cycle.cycle_id
    this.updateOrgUserSettings().pipe(
      switchMap(() => this.initMap()),
    ).subscribe()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.id, this.orgId, this.currentUser.settings)
  }

  initPage() {
    this._organizationService.currentOrganization$.pipe(
      switchMap((org) => this.getDependencies(org)),
      switchMap(() => this.initMap()),
    ).subscribe()
  }

  getDependencies(org: Organization) {
    this.orgId = org.id
    this.cycles = org.cycles
    // if only one call, just use switchmap
    return combineLatest([
      this._userService.currentUser$,
    ]).pipe(
      tap(([currentUser]) => {
        this.currentUser = currentUser
        this.cycle = this.cycles.find((c) => c.cycle_id === this.currentUser.settings.cycleId) ?? this.cycles[0]
      }),
    )
  }

  initMap() {
    console.log('initMap')
    this.inProgress = true
    this.progress = { current: 0, total: 0, percent: 0, chunk: 0 }

    if (!this.cycle) return EMPTY

    return this.getTotalRecords().pipe(
      switchMap((totalPages) => this.fetchRecords(totalPages)),
      tap(() => {
        this.geocodeRelated()
        this.setLayers()
        this.renderMap()
        this.setMapOptions()
        this.zoomCenter(this.pointsSource().getSource())
      }),
    )
  }

  getTotalRecords() {
    return this._inventoryService.getRecordCount(this.orgId, this.cycle.cycle_id, this.type).pipe(
      map((count: number) => {
        this.progress.total = count
        const totalPages = Math.ceil(count / this.chunk)
        this.progress.chunk = 100 / totalPages
        return totalPages
      }),
    )
  }

  fetchRecords(totalPages: number) {
    const inventory_type = this.type === 'properties' ? 'property' : 'taxlot'
    const include_property_ids = this.type === 'goal' ? this.group?.views_list : []

    this.requestParams = new URLSearchParams({
      cycle: this.cycle.cycle_id.toString(),
      ids_only: 'false',
      include_related: 'true',
      page: null,
      organization_id: this.orgId.toString(),
      per_page: this.chunk.toString(),
      inventory_type,
    })

    this.requestData = {
      include_property_ids,
      profile_id: null,
      filters: null,
      sorts: null,
    }

    // Fetch all records, one page at a time. mergeMap makes concurrent requests. scan accumulates results
    return range(1, totalPages).pipe(
      mergeMap((page: number) => {
        this.requestParams.set('page', page.toString())
        return this._inventoryService.getAgInventory(this.requestParams.toString(), this.requestData).pipe(
          map(({ results }: FilterResponse) => results),
          tap(() => { this.updateProgress() }),
        )
      }),
      scan((allData: State[], pageData: State[]) => [...allData, ...pageData], []),
      tap((allData: State[]) => {
        this.data = allData
        this.geocodedData = allData.filter(({ long_lat }) => long_lat)
        this.filteredRecords = this.geocodedData.length
      }),
      finalize(() => {
        this.inProgress = false
      }),
    )
  }

  async setLayers() {
    this.layers = {
      baseLayer: { zIndex: 0, visible: true },
      censusTractLayer: { zIndex: 1, visible: true },
      hexbinLayer: { zIndex: 2, visible: this.type === 'properties' },
      propertyBBLayer: { zIndex: 3, visible: this.type === 'properties' },
      propertyCentroidLayer: { zIndex: 4, visible: this.type === 'properties' },
      taxlotBBLayer: { zIndex: 5, visible: this.type !== 'properties' },
      taxlotCentroidLayer: { zIndex: 6, visible: this.type !== 'properties' },
      pointsLayer: { zIndex: 7, visible: true },
    }

    this.baseLayer = new TileLayer({ source: new OSM(), zIndex: this.layers.baseLayer.zIndex })

    this.pointsLayer = new VectorLayer({
      source: this.pointsSource(),
      zIndex: this.layers.pointsLayer.zIndex,
      style: (feature: Feature) => {
        const features = feature.get('features') as Feature[] | undefined
        const size: number = features ? features.length : 0
        return size > 1 ? this.clusterPointStyle(size) : this.singlePointStyle()
      },
    })

    this.propertyBBLayer = new VectorLayer({
      source: this.boundingBoxSource(this.geocodedProperties),
      zIndex: this.layers.propertyBBLayer.zIndex,
      style: this.propertyStyle(),
    })

    this.propertyCentroidLayer = new VectorLayer({
      source: this.centroidSource(this.geocodedProperties),
      zIndex: this.layers.propertyCentroidLayer.zIndex,
      style: this.propertyStyle(),
    })

    this.taxlotBBLayer = new VectorLayer({
      source: this.boundingBoxSource(this.geocodedTaxlots),
      zIndex: this.layers.taxlotBBLayer.zIndex,
      style: this.taxlotStyle(),
    })

    this.taxlotCentroidLayer = new VectorLayer({
      source: this.centroidSource(this.geocodedTaxlots),
      zIndex: this.layers.taxlotCentroidLayer.zIndex,
      style: this.taxlotStyle(),
    })

    this.censusTractLayer = new VectorLayer({
      source: await this.censusTractSource(),
      zIndex: this.layers.censusTractLayer.zIndex,
      style: (feature: Feature) => {
        const tractId = feature.get('GEOID10') as number
        const isDisadvantaged = this._mapService.isDisadvantaged(tractId)
        return new Style({
          stroke: new Stroke({ color: '#185189', width: 2 }),
          fill: isDisadvantaged && this.highlightDACs ? new Fill({ color: '#45829b' }) : undefined,
        })
      },
    })

    this.setHexbinLayer()
  }

  renderMap() {
    console.log('renderMap')
    let layers = Object.entries(this.layers).reduce((acc, [layerName, { visible }]) => {
      const layer = this[layerName]
      if (visible && layer) acc.push(layer)
      return acc
    }, [])

    this.map = new Map({
      target: 'map',
      layers,
      view: new View({
        maxZoom: 19,
        // center: [0, 0],
        // zoom: 2,
        // projection: 'EPSG:3857'
      })
    })


  }

  setMapOptions() {
    this.map.on('moveend', async () => {
      this.censusTractLayer.setSource(await this.censusTractSource())
    })
    this.map.addOverlay(this.popupOverlay)
    this.map.on('click', (event) => {
      const element = this.popupOverlay.getElement()
      const points = []
      
      this.map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
        // disregard hexbin/census clicks
        if (![this.layers.hexbinLayer.zIndex, this.layers.censusTractLayer.zIndex, undefined].includes(layer.getProperties().zIndex)) {
          points.push(...(feature.get('features') ?? []))
        }
      })

      if (!points.length) {
        console.log('jquery needs migrating: "$(element).popover("destroy")"')
      } else if (points.length === 1) {
        this.showPointInfo(points[0], element)
      } else {
        this.zoomOnCluster(points)
      }
    })
  }

  updateProgress() {
    this.progress.percent += this.progress.chunk
    this.progress.current = Math.min(this.progress.current + this.chunk, this.progress.total)
  }

  geocodeRelated() {
    if (this.type === 'properties') {
      this.geocodedProperties = this.data.filter(({ bounding_box }) => bounding_box)
      this.geocodedTaxlots = this.geocodedRelated()
    } else {
      this.geocodedProperties = this.geocodedRelated()
      this.geocodedTaxlots = this.data.filter(({ bounding_box }) => bounding_box)
    }
  }

  geocodedRelated() {
    // filter for only records with related
    const related: State[] = this.data.flatMap((record) => record.related?.filter((r) => r.bounding_box) || [])
    // remove duplicates based on id
    const uniqRelated: State[] = related.filter((record, idx, arr) => arr.findIndex((x) => x.id === record.id) === idx)
    return uniqRelated
  }

  setHexbinLayer() {
    this.hexbinLayer = new VectorLayer({
      source: this.hexbinSource(),
      zIndex: this.layers.hexbinLayer.zIndex,
      opacity: this.hexbinMaxOpacity,
      style: (feature: Feature) => {
        const { features } = feature.getProperties()
        const siteEUIKey = Object.keys(features[0].values_).find((key) => key.startsWith('site_eui'))
        const siteEUIs = features.map((point) => point.values_[siteEUIKey])
        const totalEUI = siteEUIs.reduce((acc, eui) => acc + eui, 0)
        const opacity = Math.min(this.hexbinMinOpacity, totalEUI / this.hexagonSize)
        const color = [...this.hexbinColor, opacity]
        return [new Style({ fill: new Fill({ color }) })]
      }
    })
  }

  hexbinSource = (records = this.geocodedData) => new HexBin({
    source: this.buildingSources(records),
    size: this.hexagonSize,
  })


  hexbinInfoBarColor() {
    const hexbinColorCode = this.hexbinColor.join(',')
    const leftColor = `rgb(${hexbinColorCode},${this.hexbinMaxOpacity * this.hexbinMinOpacity})`
    const rightColor = `rgb(${hexbinColorCode},${this.hexbinMaxOpacity})`
    return { background: `linear-gradient(to right, ${leftColor}, ${rightColor})` }
  }

  buildingSources(records: State[]) {
    const features = records.map((record) => {
      const feature = new WKT().readFeature(record.long_lat, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      })
      feature.setProperties(record)
      return feature
    })
    return new VectorSource({ features })
  }

  boundingBoxSource(records: State[]) {
    const features = records.reduce((acc: Feature[], record) => {
      if (record.bounding_box) {
        try {
          const feature = new WKT().readFeature(record.bounding_box, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          })
          feature.setProperties(record)
          acc.push(feature)
        } catch (e) {
          console.error(`Failed to process bounding box for id ${record.id}:`, e)
        }
      }
      return acc
    }, [])

    return new VectorSource({ features })
  }

  centroidSource(records: State[]) {
    const features = records.reduce((acc: Feature[], record) => {
      if (record.centroid) {
        try {
          const feature = new WKT().readFeature(record.centroid, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          })
          feature.setProperties(record)
          acc.push(feature)
        } catch (e) {
          console.error(`Failed to process centroid for id ${record.id}:`, e)
        }
      }
      return acc
    }, [])

    return new VectorSource({ features })
  }

  // this is async. how to handle?
  async censusTractSource() {
    let geojson = { type: 'FeatureCollection', features: [] }

    try {
      // only show census tracts at a reasonable zoom level
      if (this.map?.getView().getZoom() >= 11) {
        const extents = this.map.getView().calculateExtent(this.map.getSize())
        const [west, south, east, north] = transformExtent(extents, this.map.getView().getProjection(), 'EPSG:4326')
        const url = `https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/usa_november_2022/FeatureServer/0/query?where=1%3D1&outFields=GEOID10&geometry=${west}%2C${south}%2C${east}%2C${north}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`;
        geojson = await (await fetch(url)).json() as { type: string; features: { properties: { GEOID10: string } }[] }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const tractIds = geojson.features.reduce((acc: string[], feature: { properties: { GEOID10: string } }) => {
          return acc.concat(feature.properties.GEOID10)
        }, [])
        await this._mapService.checkDisadvantagedStatus(tractIds as number[])
      }
    } catch (e) {
      console.error(e)
    }
    const features = new GeoJSON().readFeatures(geojson, {
      featureProjection: 'EPSG:3857',
    })
    return new VectorSource({ features })
  }

  clusterPointStyle(size: number) {
    const relativeRadius = 10 + Math.min(7, size / 50)
    return new Style({
      image: new Circle({
        radius: relativeRadius,
        stroke: new Stroke({ color: '#fff' }),
        fill: new Fill({ color: '#3399CC' }),
      }),
      text: new Text({
        text: size.toString(),
        fill: new Fill({ color: '#fff' }),
      }),
    })
  }

  singlePointStyle = () => new Style({ image: new Icon({ src: '/images/map_pin.webp', anchor: [0.5, 1] }) })
  pointsSource = (records = this.geocodedData) => new Cluster({ source: this.buildingSources(records), distance: 45 })
  propertyStyle = () => new Style({ stroke: new Stroke({ color: '#185189', width: 2 }) })
  taxlotStyle = () => new Style({ stroke: new Stroke({ color: '#10A0A0', width: 2 }) })

  layerVisible(zIndex: number) {
    const layers = this.map.getLayers().getArray()
    return layers.some((layer) => layer.get('zIndex') === zIndex )
  }

  toggleLayer(layerName: string, visibility) {
    const layer = this.layers[layerName]
    if (layer) {
      const updatedVisibility = visibility ?? !layer.visible
      this.layers[layerName].visible = updatedVisibility
      if (updatedVisibility) {
        this.map.addLayer(this[layerName])
      } else {
        this.map.removeLayer(this[layerName])
      }
    }
  }
  
  toggleDACHighlight() {
    this.highlightDACs = !this.highlightDACs
  }

  detailPageIcon(pointInfo) {
    const iconHtml = '<i class="ui-grid-icon-info-circled"></i>'

    if (this.type === 'properties') {
      return `<a href="#/properties/${pointInfo.property_view_id}">${iconHtml}</a>`;
    }
    return `<a href="#/taxlots/${pointInfo.taxlot_view_id}">${iconHtml}</a>`;
  }

  showPointInfo(point, element) {
    const popInfo = point.getProperties();
    const defaultKey = Object.keys(popInfo).find((key) => key.startsWith(this.defaultField))
    const coordinates = point.getGeometry().getCoordinates()
    const content = `${popInfo[defaultKey]} ${this.detailPageIcon(popInfo)}`
    this.popupOverlay.setPosition(coordinates)
    console.log('need to develop a popover element')
  }

  zoomOnCluster(points) {
    const source = new VectorSource({ features: points })
    this.zoomCenter(source, { duration: 750 })
  }

  zoomCenter(pointsSource, extraViewOptions = {}) {
    if (pointsSource.isEmpty()) {
      // Default view with no points is the middle of US
      const emptyView = new View({
        center: fromLonLat([-99.066067, 39.390897]),
        zoom: 4.5
      });
      this.map.setView(emptyView);
    } else {
      const extent = pointsSource.getExtent()
      const viewOptions = {
        size: this.map.getSize(),
        padding: [10, 10, 10, 10],
        ...extraViewOptions
      };
      this.map.getView().fit(extent, viewOptions)
    }
  }

  rerenderPoints(records) {
    this.filteredRecords = records.length
    this.pointsLayer.setSource(this.pointsSource(records))
    if (this.type === 'properties') {
      this.hexbinLayer.setSource(this.hexbinSource(records))
      this.propertyBBLayer.setSource(this.boundingBoxSource(records))
      this.propertyCentroidLayer.setSource(this.centroidSource(records))
    } else {
      this.taxlotBBLayer.setSource(this.boundingBoxSource(records))
      this.taxlotCentroidLayer.setSource(this.centroidSource(records))
    }
  }
}
