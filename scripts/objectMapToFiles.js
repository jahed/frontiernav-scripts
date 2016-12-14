const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const objects = {
    "name": {
        "title": "Name",
        "type": "string"
    },
    "rarity": {
        "title": "Rarity",
        "type": "integer"
    },
    "type": {
        "type": "integer"
    },
    "locationTypeId": {
        "type": "string"
    },
    "q": {
        "type": "integer"
    },
    "r": {
        "type": "integer"
    },
    "s": {
        "type": "integer"
    },
    "latLng": {
        "type": "object",
        "properties": {
            "lat": {
                "type": "number"
            },
            "lng": {
                "type": "number"
            }
        },
        "required": ["lat", "lng"]
    },
    "latLngs": {
        "type": "array",
        "minItems": 3,
        "items": {
            "$ref": "#/definitions/latLng"
        }
    },
    "center": {
        "type": "object",
        "properties": {
            "lat": {
                "type": "number"
            },
            "lng": {
                "type": "number"
            }
        },
        "required": ["lat", "lng"]
    },
    "thumbnail": {
        "type": "string"
    },
    "radius": {
        "title": "Radius",
        "type": "number"
    },
    "segmentDimensions": {
        "type": "object",
        "required": ["height"],
        "properties": {
            "height": {
                "type": "number"
            }
        }
    },
    "segmentInset": {
        "type": "object",
        "required": ["x", "y"],
        "properties": {
            "x": { "type": "integer" },
            "y": { "type": "integer" }
        }
    },
    "topLeft": {
        "type": "object",
        "required": ["x", "y"],
        "properties": {
            "x": { "type": "integer" },
            "y": { "type": "integer" }
        }
    },
    "dimensions": {
        "type": "object",
        "required": ["x", "y"],
        "properties": {
            "x": { "type": "integer" },
            "y": { "type": "integer" }
        }
    },
    "number": {
        "type": "integer"
    },
    "revenue": {
        "type": "string",
        "enum": ["S", "A", "B", "C", "D", "E", "F"]
    },
    "production": {
        "type": "string",
        "enum": ["S", "A", "B", "C", "D", "E", "F"]
    },
    "combat_support": {
        "type": "string",
        "enum": ["S", "A", "B", "C", "D", "E", "F"]
    },
    "sightseeing_spots": {
        "type": "integer"
    },
    "attributes": {
        "type": "object",
        "properties": {
            "production_multiplier": {
                "type": "number"
            },
            "revenue_multiplier": {
                "type": "number"
            },
            "neighbour_primary_multiplier": {
                "type": "number"
            }
        }
    },
    "level": {
        "type": "integer",
        "minimum": 1,
        "maximum": 99
    },
    "time": {
        "type": "string"
    },
    "notes": {
        "type": "string"
    },
    "category": {
        "type": "string"
    },
    "subcategory": {
        "type": "string"
    },
    "object": {
        "type": "string"
    },
    "className": {
        "type": "string"
    },
    "description": {
        "type": "string"
    },
    "requirements": {
        "type": "object",
        "properties": {
            "field_skill": {
                "type": "string"
            },
            "field_skill_level": {
                "type": "number",
                "minimum": 1,
                "maximum": 5,
            }
        }
    },
    "defaultMapId": {
        "type": "string"
    },
    "defaultZoom": {
        "type": "integer"
    },
    "maxNativeZoom": {
        "type": "integer"
    },
    "tileLayers": {
        "type": "object",
        "required": ["normal"],
        "properties": {
            "normal": {
                "$ref": "#/definitions/tileLayer"
            }
        }
    },
    "tileLayer": {
        "type": "object",
        "required": ["folder", "extension"],
        "properties": {
            "folder": {
                "type": "string"
            },
            "extension": {
                "type": "string",
                "enum": ["png", "jpg"]
            },
            "background": {
                "$ref": "#/definitions/mapBackground"
            }
        }
    },
    "mapBackground": {
        "type": "object",
        "properties": {
            "image": {
                "$ref": "#/definitions/image"
            },
            "color": {
                "$ref": "#/definitions/color"
            },
            "repeat": {
                "type": "boolean"
            }
        }
    },
    "color": {
        "type": "string"
    },
    "gender": {
        "type": "string"
    },
    "class": {
        "type": "string"
    },
    "age": {
        "type": "integer"
    },
    "species": {
        "type": "string"
    },
    "image": {
        "type": "string"
    },
    "markerStyle": {
        "type": "string"
    },
    "hidden": {
        "type": "boolean"
    },
    "externalLinks": {
        "type": "array",
        "items": {
            "type": "object",
            "required": ["name", "url"],
            "properties": {
                "name": {
                    "type": "string"
                },
                "url": {
                    "type": "string",
                    "format": "uri"
                }
            }
        }
    }
}
const destination = path.resolve('./graph/properties')

const valuesToWrite = _.map(objects, (object, key) => {
    if(typeof object.key !== 'undefined' && object.key !== key) {
        throw new Error(`ID and key don't match for objects[${key}] = { id: ${object.key}, ... }`)
    }

    return Object.assign({ id: key }, object);
})

_.forEach(valuesToWrite, object => {
    fs.writeFileSync(path.resolve(destination, `${object.id}.json`), JSON.stringify(object, null, 2) + '\n')
})
