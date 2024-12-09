export const GET_ADDRESS_POAPS_QUERY = `
  query PaginatedPOAPsForCollector($order_by: [poaps_order_by!], $limit: Int!, $offset: Int!, $where: poaps_bool_exp!) {
    poaps(limit: $limit, offset: $offset, order_by: $order_by, where: $where) {
      id
      chain
      transfers(limit: 1, order_by: { timestamp: asc }) {
        timestamp
      }
      minting_stats {
        mint_order
      }
      drop {
        id
        created_date
        end_date
        start_date
        image_url
        country
        city
        expiry_date
        name
        stats_by_chain_aggregate {
          aggregate {
            sum {
              poap_count
            }
          }
        }
      }
    }
  }
`;