import '@xyflow/react/dist/style.css'

import { DiagramCanvas, DiagramEdge, DiagramLayout, DiagramNode } from '../..'
import { mockUseCaseGraph } from '../../mock/useCaseGraph'

export function UseCaseDiagramCanvas() {
  const boundaryId = 'boundary:ticketing'

  return (
    <DiagramCanvas>
      <DiagramLayout algorithm="elk" direction="RIGHT" grid spacing={2} padding={506}>
        <DiagramNode id="actor:customer" kind="ACTOR" label="Customer" xs={3} width={180} height={140} />
        <DiagramNode id="actor:admin" kind="ACTOR" label="Admin" xs={3} width={180} height={140} />

        <DiagramNode id={boundaryId} kind="SYSTEM_BOUNDARY" label="Ticketing System" xs={9} width={760} height={460}>
          <DiagramNode id="usecase:search" kind="USE_CASE" label="Search Flights" xs={6} width={200} height={150} />
          <DiagramNode id="usecase:book" kind="USE_CASE" label="Book Ticket" xs={6} width={150} height={150} />
          <DiagramNode id="usecase:pay" kind="USE_CASE" label="Pay with Card" xs={6} width={220} height={150} />
          <DiagramNode id="usecase:notify" kind="USE_CASE" label="Notify Passenger" xs={6} width={220} height={150} />
        </DiagramNode>

        {mockUseCaseGraph.edges.map((edge) => (
          <DiagramEdge key={edge.id} id={edge.id} from={edge.source} to={edge.target} kind={edge.type} label={edge.label} />
        ))}
      </DiagramLayout>
    </DiagramCanvas>
  )
}
