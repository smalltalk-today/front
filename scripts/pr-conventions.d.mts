export const branchPattern: string;
export interface PrBranchMetadata {
  baseRef?: string;
  headRef?: string;
  headRepository?: string;
  repository?: string;
}
export interface PrMetadata extends PrBranchMetadata {
  title?: string;
}
export function validatePrBranchFlow(metadata: PrBranchMetadata): string[];
export function validatePrConventions(metadata: PrMetadata): string[];
