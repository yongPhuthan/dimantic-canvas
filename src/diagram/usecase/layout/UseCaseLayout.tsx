import { Layout } from '../../../layout/Layout'

export const useCaseLayoutBalanced = (
  <Layout
    container
    columns={12}
    gap={18}
    rowHeight={190}
    breakpoints={{
      xs: { columns: 4, colWidth: 150, rowHeight: 160, gap: 10 },
      md: { columns: 8, colWidth: 170, rowHeight: 180, gap: 14 },
      lg: { columns: 12, colWidth: 180, rowHeight: 190, gap: 18 },
    }}
  >
    <Layout item nodeId="actor:customer" xs={3} md={2} align="start" />
    <Layout item nodeId="actor:admin" xs={3} md={2} align="start" />
    <Layout item nodeId="boundary:ops" xs={12} md={8} rowSpan={2} />
  </Layout>
)

export const useCaseLayoutWide = (
  <Layout
    container
    columns={14}
    gap={24}
    rowHeight={200}
    breakpoints={{
      xs: { columns: 4, colWidth: 170, rowHeight: 170, gap: 12 },
      md: { columns: 8, colWidth: 190, rowHeight: 190, gap: 18 },
      lg: { columns: 14, colWidth: 220, rowHeight: 200, gap: 24 },
    }}
  >
    <Layout item nodeId="actor:customer" xs={3} md={2} align="start" />
    <Layout item nodeId="actor:admin" xs={3} md={2} align="start" />
    <Layout item nodeId="boundary:ops" xs={12} md={10} rowSpan={2} />
  </Layout>
)

export const useCaseLayoutStacked = (
  <Layout
    container
    columns={10}
    gap={20}
    rowHeight={230}
    breakpoints={{
      xs: { columns: 4, colWidth: 170, rowHeight: 180, gap: 12 },
      md: { columns: 8, colWidth: 190, rowHeight: 200, gap: 16 },
      lg: { columns: 10, colWidth: 200, rowHeight: 230, gap: 20 },
    }}
  >
    <Layout item nodeId="actor:customer" xs={4} md={3} align="start" />
    <Layout item nodeId="actor:admin" xs={4} md={3} align="start" />
    <Layout item nodeId="boundary:ops" xs={10} md={9} rowSpan={3} />
  </Layout>
)
