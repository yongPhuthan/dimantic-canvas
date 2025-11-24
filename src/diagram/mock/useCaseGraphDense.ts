import {
  USE_CASE_EDGE_TYPE,
  USE_CASE_NODE_TYPE,
  type RawUseCaseGraph,
} from '../types/graph'

// Dense mock graph to stress-test edge handle spreading (>4 connections on a side).
export const mockDenseConnectionsGraph: RawUseCaseGraph = {
  nodes: [
    { id: 'actor:customer', label: 'Customer', type: USE_CASE_NODE_TYPE.ACTOR },
    { id: 'actor:admin', label: 'Admin', type: USE_CASE_NODE_TYPE.ACTOR },
    {
      id: 'boundary:ops',
      label: 'Operations Hub',
      type: USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY,
    },
    // Core use cases
    { id: 'usecase:search', label: 'Search Flights', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:book', label: 'Book Ticket', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:pay', label: 'Pay with Card', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:notify', label: 'Notify Passenger', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:itinerary', label: 'View Itinerary', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:refund', label: 'Request Refund', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:seat', label: 'Change Seat', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
    { id: 'usecase:upgrade', label: 'Upgrade Cabin', type: USE_CASE_NODE_TYPE.USE_CASE, parentId: 'boundary:ops' },
  ],
  edges: [
    // Customer fans out to many use cases (>4) to test left-to-right spreading.
    { id: 'e1', source: 'actor:customer', target: 'usecase:search', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e2', source: 'actor:customer', target: 'usecase:book', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e3', source: 'actor:customer', target: 'usecase:pay', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e4', source: 'actor:customer', target: 'usecase:itinerary', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e5', source: 'actor:customer', target: 'usecase:refund', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e6', source: 'actor:customer', target: 'usecase:seat', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e7', source: 'actor:customer', target: 'usecase:upgrade', type: USE_CASE_EDGE_TYPE.ASSOCIATION },

    // Admin also has multiple outgoing to exercise another dense side.
    { id: 'e8', source: 'actor:admin', target: 'usecase:book', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e9', source: 'actor:admin', target: 'usecase:notify', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e10', source: 'actor:admin', target: 'usecase:refund', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e11', source: 'actor:admin', target: 'usecase:seat', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e12', source: 'actor:admin', target: 'usecase:upgrade', type: USE_CASE_EDGE_TYPE.ASSOCIATION },

    // Cross-use-case relationships to keep the layout interesting.
    { id: 'e13', source: 'usecase:search', target: 'usecase:book', type: USE_CASE_EDGE_TYPE.INCLUDE },
    { id: 'e14', source: 'usecase:book', target: 'usecase:pay', type: USE_CASE_EDGE_TYPE.INCLUDE },
    { id: 'e15', source: 'usecase:pay', target: 'usecase:notify', type: USE_CASE_EDGE_TYPE.EXTEND },
    { id: 'e16', source: 'usecase:book', target: 'usecase:itinerary', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e17', source: 'usecase:book', target: 'usecase:seat', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e18', source: 'usecase:book', target: 'usecase:upgrade', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
    { id: 'e19', source: 'usecase:refund', target: 'usecase:notify', type: USE_CASE_EDGE_TYPE.ASSOCIATION },
  ],
}
