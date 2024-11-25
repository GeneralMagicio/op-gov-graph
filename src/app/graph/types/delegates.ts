export type DelegateMetadata = {
  has_next: boolean;
  total_returned: number;
  next_offset: number;
};

export interface DelegateDataAgora {
  address: string;
  votingPower: {
    total: string;
    direct: string;
    advanced: string;
  };
  citizen: boolean;
  statement: {
    signature: string;
    payload: {
      email?: string;
      daoSlug?: string;
      discord?: string;
      twitter?: string;
      warpcast?: string;
      topIssues?: Array<{
        type: string;
        value: string;
      }>;
      topStakeholders?: any[];
      agreeCodeConduct?: boolean;
      delegateStatement?: string;
      mostValuableProposals?: any[];
      leastValuableProposals?: any[];
      openToSponsoringProposals?: string;
      for?: string;
    };
    twitter?: string;
    discord?: string;
    created_at?: string;
    updated_at?: string;
    warpcast?: string;
    endorsed?: boolean;
  } | null;
}

export interface ApiResponse {
  meta: DelegateMetadata;
  data: DelegateDataAgora[];
}
