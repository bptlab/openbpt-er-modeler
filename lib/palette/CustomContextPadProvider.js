import { assign } from "min-dash";
import { is } from "../util/Util";
import { MODELER_PREFIX } from "../util/constants";

// In the context pad provider, the actions available in the context menu when selecting an element are defined.
export default class CustomContextPadProvider {
  constructor(connect, contextPad, modeling, elementFactory, create, autoPlace) {
    this._connect = connect;
    this._modeling = modeling;
    this._elementFactory = elementFactory;
    this._create = create;
    this._autoPlace = autoPlace;

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const connect = this._connect;
    const modeling = this._modeling;
    const elementFactory = this._elementFactory;
    const create = this._create;
    const autoPlace = this._autoPlace;

    function removeElement() {
      modeling.removeElements([element]);
    }

    // CustomModelerTodo: Define functions for all entries in the context pad of an element.
    // For example, creating and appending new model elements.
    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }

    function appendEntity(event, element) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Entity` });

      autoPlace.append(element, shape, { connection: { type: `${MODELER_PREFIX}:Line` } });
    }

    function appendEntityStart(event) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Entity` });

      create.start(event, shape, { source: element });
    }

    function appendRelationship(event, element) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Relationship` });

      autoPlace.append(element, shape, { connection: { type: `${MODELER_PREFIX}:Line` } });
    }

    function appendRelationshipStart(event) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Relationship` });

      create.start(event, shape, { source: element });
    }
    

    function appendAttribute(event, element) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Attribute` });

      autoPlace.append(element, shape, { connection: { type: `${MODELER_PREFIX}:Line` } });
    }

    function appendAttributeStart(event) {
      const shape = elementFactory.createShape({ type: `${MODELER_PREFIX}:Attribute` });

      create.start(event, shape, { source: element });
    }

    function canBeGeneralization(element) {
      const source = element.source;
      const target = element.target;
      // A generalization can only be created if exactly one of source or target is an entity and the other is a relationship.
      if (!((is(source, `${MODELER_PREFIX}:Entity`) && is(target, `${MODELER_PREFIX}:Relationship`)) ||
            (is(source, `${MODELER_PREFIX}:Relationship`) && is(target, `${MODELER_PREFIX}:Entity`)))) {
        return false;
      }

      const connectedRelationship = is(source, `${MODELER_PREFIX}:Relationship`) ? source : target;
      let connectedLines = [...connectedRelationship.incoming, ...connectedRelationship.outgoing];
      connectedLines = connectedLines.filter(line => line.id !== element.id);
      // A generalization can only be created for binary relationships and if the connected relationship does not already have a generalization.
      if (connectedLines.length > 1 || connectedLines.some(line => line.businessObject.isGeneralization)) {
        return false;
      }
      return true;
    }

    function updateIsGeneralization(event) {
      const isGeneralization = element.businessObject.isGeneralization;
      modeling.updateProperty(element, "isGeneralization", !isGeneralization, { rerender: true });
      const connectedRelationship = is(element.source, `${MODELER_PREFIX}:Relationship`) ? element.source : element.target;
      modeling.updateProperty(connectedRelationship, "name", isGeneralization ? "" : "is_a", { rerender: true });
    }

    const actions = {};

    // CustomModelerTodo: Define the context menu entries for each element type.
    // "group" is the row in which the action will be displayed. Within a row, elements are in the same order as they are assigned to the actions object.
    // "className" is the icon to be displayed.
    // "title" is the tooltip to be displayed.

    // Entity actions
    if (is(element, `${MODELER_PREFIX}:Entity`)) {
      assign(actions, {
        "append-relationship": {
          group: "row_1",
          className: "er-icon-relationship",
          title: "Append relationship",
          action: {
            click: appendRelationship,
            dragstart: appendRelationshipStart,
          },
        },
      });
      assign(actions, {
        "append-attribute": {
          group: "row_2",
          className: "er-icon-attribute",
          title: "Append attribute",
          action: {
            click: appendAttribute,
            dragstart: appendAttributeStart,
          },
        },
      });
      assign(actions, {
        connect: {
          group: "row_3",
          className: "bpmn-icon-connection",
          title: "Connect",
          action: {
            click: startConnect,
            dragstart: startConnect,
          },
        },
      });
    }

    // Relationship actions
    if (is(element, `${MODELER_PREFIX}:Relationship`)) {
      assign(actions, {
        "append-entity": {
          group: "row_1",
          className: "er-icon-entity",
          title: "Append entity",
          action: {
            click: appendEntity,
            dragstart: appendEntityStart,
          },
        },
      });
      assign(actions, {
        "append-attribute": {
          group: "row_2",
          className: "er-icon-attribute",
          title: "Append attribute",
          action: {
            click: appendAttribute,
            dragstart: appendAttributeStart,
          },
        },
      });
      assign(actions, {
        connect: {
          group: "row_3",
          className: "bpmn-icon-connection",
          title: "Connect",
          action: {
            click: startConnect,
            dragstart: startConnect,
          },
        },
      });
    }

    // Attribute actions
    if (is(element, `${MODELER_PREFIX}:Attribute`)) {
      assign(actions, {
        "toggle-primary-key": {
          group: "row_1",
          className: "er-icon-primary-key",
          title: element.businessObject.isPrimaryKey ? "Remove primary key" : "Set as primary key",
          action: {
            click: () => {
              modeling.updateProperty(element, "isPrimaryKey", !element.businessObject.isPrimaryKey, { rerender: true });
            },
          },
        }
      });

      assign(actions, {
        connect: {
          group: "row_2",
          className: "bpmn-icon-connection",
          title: "Connect",
          action: {
            click: startConnect,
            dragstart: startConnect,
          },
        },
      });
    }

    // Connection actions
    if (is(element, `${MODELER_PREFIX}:Line`) && canBeGeneralization(element)) {
      assign(actions, {
        "toggle-generalization": {
          group: "row_0",
          className: "er-icon-generalization",
          title: element.businessObject.isGeneralization ? "Remove generalization" : "Set as generalization",
          action: {
            click: updateIsGeneralization,
          },
        },
      });
    }

    // Common actions
    assign(actions, {
      delete: {
        group: "row_1",
        className: "bpmn-icon-trash",
        title: "Remove",
        action: {
          click: removeElement,
          dragstart: removeElement,
        },
      },
    });
    return actions;
  }
}

CustomContextPadProvider.$inject = [
  "connect",
  "contextPad",
  "modeling",
  "elementFactory",
  "create",
  "autoPlace",
];
