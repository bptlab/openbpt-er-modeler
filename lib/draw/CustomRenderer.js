import { query as domQuery } from "min-dom";
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';
import {
  assign,
  isObject
} from 'min-dash';
import { componentsToPath } from 'diagram-js/lib/util/RenderUtil';
import Ids from "ids";

import { DEFAULT_TEXT_SIZE } from "./TextRenderer";
import { getLabel } from "../modeling/LabelUtil";
import { MODELER_PREFIX } from "../util/constants";
import { is } from "../util/Util";

const RENDERER_IDS = new Ids();

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, styles, canvas, textRenderer) {
    super(eventBus, 2000);

    this._styles = styles;
    this._canvas = canvas;
    this._textRenderer = textRenderer;
    this._markers = {};
    this._rendererId = RENDERER_IDS.next();
    this._defaultLineStyle = {
      strokeLinejoin: 'round',
      strokeWidth: 2,
      stroke: 'black'
    };
  }

  canRender(element) {
    return true;
  }

  // CustomModelerTodo: Implement the rendering of the different shapes.
  drawShape(parentGfx, element) {
    if (element.type === `${MODELER_PREFIX}:Entity`) {
      return this.drawEntity(parentGfx, element);
    } else if (element.type === `${MODELER_PREFIX}:Relationship`) {
      return this.drawRelationship(parentGfx, element);
    } else if (element.type === `${MODELER_PREFIX}:Attribute`) {
      return this.drawAttribute(parentGfx, element);
    } else if (element.type === `${MODELER_PREFIX}:Line`) {
      return this.drawLine(parentGfx, element);
    } else if (element.type === 'label') {
      return this.renderExternalLabel(parentGfx, element);
    }
  }

  drawConnection(parentGfx, element) {
    return this.drawShape(parentGfx, element);
  }

  drawEntity = function (parentGfx, element) {
    const shape = svgCreate('path');
    svgAttr(shape, {
      d: getEntityPath(0, 0, element.width, element.height),
      fill: 'white',
      fillOpacity: 0.95,
      stroke: 'black',
      strokeWidth: 2
    });
    svgAppend(parentGfx, shape);

    this.renderEmbeddedLabel(parentGfx, element, 'center-middle');
    return parentGfx;
  }

  drawRelationship = function (parentGfx, element) {
    const shape = svgCreate('path');
    svgAttr(shape, {
      d: getRelationshipPath(0, 0, element.width, element.height),
      fill: 'white',
      fillOpacity: 0.95,
      stroke: 'black',
      strokeWidth: 2
    });
    svgAppend(parentGfx, shape);

    this.renderEmbeddedLabel(parentGfx, element, 'center-middle');
    return parentGfx;
  }

  drawAttribute = function (parentGfx, element) {
    const shape = svgCreate('path');
    svgAttr(shape, {
      d: getAttributePath(0, 0, element.width, element.height),
      fill: 'white',
      fillOpacity: 0.95,
      stroke: 'black',
      strokeWidth: 2
    });
    svgAppend(parentGfx, shape);

    const style = element.businessObject.isPrimaryKey ? { textDecoration: 'underline' } : {};

    this.renderEmbeddedLabel(parentGfx, element, 'center-middle', style);
    return parentGfx;
  }

  drawLine = function (parentGfx, element) {
    const pathData = this.getPathDataFromConnection(element);
    const color = 'black';
    let attrs;

    if (is(element.source, `${MODELER_PREFIX}:Relationship`) && element.businessObject.isGeneralization) {
      attrs = this._styles.computeStyle({
        markerEnd: this.marker('defaultarc-end', color, color)
      }, ['no-fill'], this._defaultLineStyle);
    } else if (is(element.target, `${MODELER_PREFIX}:Relationship`) && element.businessObject.isGeneralization) {
      attrs = this._styles.computeStyle({
        markerStart: this.marker('defaultarc-start', color, color)
      }, ['no-fill'], this._defaultLineStyle);
    } else {
      attrs = this._styles.computeStyle({}, ['no-fill'], this._defaultLineStyle);
    }

    const line = svgCreate('path');
    svgAttr(line, { d: pathData });
    svgAttr(line, attrs);

    svgAppend(parentGfx, line);

    return line;
  }

  getPathDataFromConnection(connection) {
    const waypoints = connection.waypoints;
    let pathData = 'm  ' + waypoints[0].x + ',' + waypoints[0].y;

    for (let i = 1; i < waypoints.length; i++) {
      pathData += 'L' + waypoints[i].x + ',' + waypoints[i].y + ' ';
    }
    return pathData;
  }

  marker(type, fill, stroke) {
    const id = type + '-' + colorEscape(fill) + '-' + colorEscape(stroke) + '-' + this._rendererId;

    if (!this._markers[id]) {
      this.createMarker(id, type, fill, stroke);
    }

    return 'url(#' + id + ')';
  }

  createMarker(id, type, fill, stroke) {
    if (type === 'defaultarc-end') {
      const defaultarcEnd = svgCreate('path', {
        d: 'M 1 5 L 11 10 L 1 15 Z',
        fill,
        stroke,
        strokeLinecap: 'round',
      });

      this.addMarker(id, {
        element: defaultarcEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
      });
    } else if (type === 'defaultarc-start') {
      const defaultarcStart = svgCreate('path', {
        d: 'M 11 5 L 1 10 L 11 15 Z',
        fill,
        stroke,
        strokeLinecap: 'round',
      });

      this.addMarker(id, {
        element: defaultarcStart,
        ref: { x: 1, y: 10 },
        scale: 0.5,
      });
    }
  }

  addMarker(id, options) {
    const {
      ref = { x: 0, y: 0 },
      scale = 1,
      element
    } = options;

    const marker = svgCreate('marker', {
      id,
      viewBox: '0 0 20 20',
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: 'auto'
    });
    svgAppend(marker, element);

    let defs = domQuery('defs', this._canvas._svg);

    if (!defs) {
      defs = svgCreate('defs');
      svgAppend(this._canvas._svg, defs);
    }

    svgAppend(defs, marker);

    this._markers[id] = marker;
  }

  renderLabel(parentGfx, label, attrs = {}) {
    // Why?
    attrs = assign({
      size: {
        width: 100
      }
    }, attrs);

    const text = this._textRenderer.createText(label, attrs);

    svgClasses(text).add('djs-label');

    svgAppend(parentGfx, text);

    return text;
  }

  renderEmbeddedLabel(parentGfx, element, align, style = {}) {
    return this.renderLabel(parentGfx, getLabel(element), {
      box: element,
      align: align,
      padding: 5,
      style: assign({
        fill: element.color === 'black' ? 'white' : 'black'
      }, style),
    });
  }

  renderExternalLabel = function (parentGfx, element, attrs = {}) {
    const box = {
      width: 90,
      height: 30,
      x: element.width / 2 + element.x,
      y: element.height / 2 + element.y
    };

    return this.renderLabel(parentGfx, getLabel(element), {
      box: box,
      fitBox: true,
      style: assign(
        {},
        this._textRenderer.getExternalStyle(),
        {
          fill: 'black'
        }
      )
    });
  }

  getShapePath(element) {
    if (element.type === `${MODELER_PREFIX}:Relationship`) {
      return getRelationshipPath(element.x, element.y, element.width, element.height);
    } else if (element.type === `${MODELER_PREFIX}:Entity`) {
      return getEntityPath(element.x, element.y, element.width, element.height);
    } else if (element.type === `${MODELER_PREFIX}:Attribute`) {
      return getAttributePath(element.x, element.y, element.width, element.height);
    }
  }    
}

CustomRenderer.$inject = [
  'eventBus',
  'styles',
  'canvas',
  'textRenderer'
];

// helpers
function colorEscape(colorString) {
  // only allow characters and numbers
  return colorString.replace(/[^0-9a-zA-z]+/g, '_');
}

// The following functions return the svg path for the respective shapes.
// For further details, see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
function getEntityPath(x, y, width, height) {
  return componentsToPath([
    ['M', x, y],
    ['h', width],
    ['v', height],
    ['h', -width],
    ['z']
  ]);
}

function getRelationshipPath(x, y, width, height) {
  const top    = [x + width / 2, y];
  const right  = [x + width, y + height / 2];
  const bottom = [x + width / 2, y + height];
  const left   = [x, y + height / 2];

  return componentsToPath([
    ['M', ...top],
    ['L', ...right],
    ['L', ...bottom],
    ['L', ...left],
    ['Z']
  ]);
}

function getAttributePath(x, y, width, height) {
  const rx = width / 2;
  const ry = height / 2;

  // Get center coordinates of the ellipse
  const cx = x + rx;
  const cy = y + ry;

  return componentsToPath([
    ['M', cx, cy - ry],
    ['a', rx, ry, 0, 1, 1, 0, 2 * ry],
    ['a', rx, ry, 0, 1, 1, 0, -2 * ry]
  ]);
}
