import {
  USE_CASE_EDGE_TYPE,
  USE_CASE_NODE_TYPE,
  type RawUseCaseGraph,
} from '../types/graph'

// Mock graph for local testing (no backend wiring yet).
export const mockUseCaseGraph: RawUseCaseGraph = {
  nodes: [
    {
      id: 'actor:customer',
      label: 'Customer',
      type: USE_CASE_NODE_TYPE.ACTOR,
    },
    {
      id: 'actor:admin',
      label: 'Admin',
      type: USE_CASE_NODE_TYPE.ACTOR,
    },
    {
      id: 'boundary:ticketing',
      label: 'Ticketing System',
      type: USE_CASE_NODE_TYPE.SYSTEM_BOUNDARY,
    },
    {
      id: 'usecase:search',
      label: 'Search Flights',
      type: USE_CASE_NODE_TYPE.USE_CASE,
      parentId: 'boundary:ticketing',
    },
    {
      id: 'usecase:book',
      label: 'Book Ticket',
      type: USE_CASE_NODE_TYPE.USE_CASE,
      parentId: 'boundary:ticketing',
    },
    {
      id: 'usecase:pay',
      label: 'Pay with Card',
      type: USE_CASE_NODE_TYPE.USE_CASE,
      parentId: 'boundary:ticketing',
    },
    {
      id: 'usecase:notify',
      label: 'Notify Passenger',
      type: USE_CASE_NODE_TYPE.USE_CASE,
      parentId: 'boundary:ticketing',
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'actor:customer',
      target: 'usecase:search',
      type: USE_CASE_EDGE_TYPE.ASSOCIATION,
    },
    {
      id: 'e2',
      source: 'actor:customer',
      target: 'usecase:book',
      type: USE_CASE_EDGE_TYPE.ASSOCIATION,
    },
    {
      id: 'e3',
      source: 'actor:admin',
      target: 'usecase:notify',
      type: USE_CASE_EDGE_TYPE.ASSOCIATION,
    },
    {
      id: 'e4',
      source: 'usecase:book',
      target: 'usecase:pay',
      type: USE_CASE_EDGE_TYPE.INCLUDE,
    },
    {
      id: 'e5',
      source: 'usecase:pay',
      target: 'usecase:notify',
      type: USE_CASE_EDGE_TYPE.EXTEND,
    },
  ],
}
