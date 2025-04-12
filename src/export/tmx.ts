import type { tBINAnimatedTile, tBINStaticTile } from "../parsers/tiles";
import { tBIN } from "../index";
import { tBINExporter } from "./exporter"

export class ExportTMX extends tBINExporter{
    constructor(public tbin: tBIN) {
        super(tbin)
    }

    export() {
        // note: https://stackoverflow.com/a/34047092
        var xml = document.implementation.createDocument(null, "map");

        const mapElement = xml.documentElement
        mapElement.setAttribute('orientation', 'orthogonal')
        mapElement.setAttribute('renderorder', 'right-down')
        mapElement.setAttribute('width', this.tbin.tiles!.layers[0].widthTiles.toString())
        mapElement.setAttribute('height', this.tbin.tiles!.layers[0].heightTiles.toString())
        mapElement.setAttribute('tilewidth', this.tbin.tiles!.layers[0].tileWidthPixels.toString())
        mapElement.setAttribute('tileheight', this.tbin.tiles!.layers[0].tileHeightPixels.toString())
        mapElement.setAttribute('infinite', '')
        mapElement.setAttribute('nextlayerid', ((this.tbin.tiles!.layers.length * 2) + 1).toString()) // * 2 bc tiledatalayers, +1 bc it starts with 1 not 0

        const propertiesElement = xml.createElement('properties')
        for (const prop_key of this.tbin.properties!.all())  {
            const prop_val = this.tbin.properties!.get(prop_key)
            
            const prop_element = xml.createElement('property')
            prop_element.setAttribute('name', prop_key)
            prop_element.setAttribute('value', prop_val)

            propertiesElement.appendChild(prop_element)
        }
        mapElement.appendChild(propertiesElement)

        let gidCounter = 1;
        let startGids: {[key: string]: number} = {}

        for (const tilesheet of this.tbin.tilesheets!.all()) {
            const tilesetElement = xml.createElement('tileset')

            const imageElement = xml.createElement('image')
            imageElement.setAttribute('source', tilesheet.filename)
            imageElement.setAttribute('width', tilesheet.sheetPixelWidth.toString())
            imageElement.setAttribute('height', tilesheet.sheetPixelHeight.toString())
            tilesetElement.appendChild(imageElement)

            const imgWidthTiles = tilesheet.sheetPixelWidth / tilesheet.tileWidth
            const imgHeightTiles = tilesheet.sheetPixelHeight / tilesheet.tileHeight
            const tileCount = (imgWidthTiles * imgHeightTiles)

            tilesetElement.setAttribute('tilewidth', tilesheet.tileWidth.toString())
            tilesetElement.setAttribute('tileheight', tilesheet.tileHeight.toString())
            tilesetElement.setAttribute('columns', (imgWidthTiles).toString())
            tilesetElement.setAttribute('tilecount', tileCount.toString())
            tilesetElement.setAttribute('name', tilesheet.displayName)
            tilesetElement.setAttribute('firstgid', gidCounter.toString())
            startGids[tilesheet.displayName] = gidCounter

            const propsDictionary: {[key: string]: [string,string][]} = {}

            for (const property of tilesheet.tileProperties) {
                const index_s = property.tileIndex.toString()
                if (!propsDictionary[index_s]) propsDictionary[index_s] = []
                propsDictionary[index_s].push([property.key, property.value.toString()])
            }

            for (const index of Object.keys(propsDictionary)) {
                const tileElement = document.createElement('tile')
                tileElement.setAttribute('id', index.toString())
                const inner_propertiesElement = document.createElement('properties')
                for (const [name, value] of propsDictionary[index]) {
                    const inner_propertyElement = document.createElement('property')
                    inner_propertyElement.setAttribute('name', name)
                    inner_propertyElement.setAttribute('value', value)
                    inner_propertiesElement.appendChild(inner_propertyElement)
                }
                tileElement.appendChild(inner_propertiesElement)
                tilesetElement.appendChild(tileElement)
            }

            mapElement.appendChild(tilesetElement)
            gidCounter += tileCount
            // debugger;
        }

        let objectCounter = 0;

        for (let i = 0; i < this.tbin.tiles!.layers.length; i++) {
            const layer = this.tbin.tiles!.layers[i]
            const layerElement = document.createElement('layer')
            const objectGroupElement = document.createElement('objectgroup') // tiledata

            layerElement.setAttribute('id', (i + 1).toString())
            layerElement.setAttribute('width', layer.widthTiles.toString())
            layerElement.setAttribute('height', layer.heightTiles.toString())
            layerElement.setAttribute('name', layer.name)

            objectGroupElement.setAttribute('id', (i + 2).toString())
            objectGroupElement.setAttribute('name', layer.name)

            const dataElement = document.createElement('data')
            dataElement.setAttribute('encoding', 'csv')

            let indexArray: number[][] = []

            yLoop: for (let yI = 0; yI < layer.tiles.length; yI++) {
                indexArray[yI] = [];
                
                layer.tiles[yI].forEach((_tile, xI) => {
                    // const _tile = layer.tiles[yI][xI]
                    if (_tile == null) {
                        indexArray[yI][xI] = 0
                    } else if (_tile.type == 'animated') {
                        const tile = _tile as unknown as tBINAnimatedTile
                        // AAAAAAAAAAAAAAAAAAAAAAAA, todo
                        indexArray[yI][xI] = 0
                    } else if (_tile.type == 'static') {
                        const tile = _tile as unknown as tBINStaticTile
                        const gid = startGids[tile.tilesheetName] + tile.indexOnSheet
                        
                        if (tile.properties.size > 0) {
                            const objectElement = xml.createElement('object')
                            objectElement.setAttribute('id', (++objectCounter).toString())
                            objectElement.setAttribute('name', 'TileData')
                            objectElement.setAttribute('x', (xI * layer.tileWidthPixels).toString())
                            objectElement.setAttribute('y', (yI * layer.tileHeightPixels).toString())
                            objectElement.setAttribute('height', layer.tileHeightPixels.toString())
                            objectElement.setAttribute('width', layer.tileWidthPixels.toString())

                            const o_propertiesElement = xml.createElement('properties')
                            tile.properties.forEach((value: any, key: any) => { // value comes first in Map.prototype.forEach
                                const o_propertyElement = xml.createElement('property')
                                o_propertyElement.setAttribute('name', key)
                                o_propertyElement.setAttribute('value', value)
                                o_propertiesElement.append(o_propertyElement)
                            })
                            objectElement.appendChild(o_propertiesElement)
                            objectGroupElement.appendChild(objectElement)
                        }
                        
                        indexArray[yI][xI] = gid
                    }
                })
                
            }

            let csv = ''
            for (const y of indexArray) {
                for (const x of y) {
                    csv += x + ','
                }
                csv += '\n'
            }
            if (csv.trim().endsWith(',')) csv = csv.trim().slice(0, -1) + '\n' // remove trailing comma, otherwise will error in tiled

            dataElement.innerHTML = csv
            layerElement.appendChild(dataElement)
            mapElement.appendChild(layerElement)
            mapElement.appendChild(objectGroupElement)
        }

        return new XMLSerializer().serializeToString(xml)
    }
}