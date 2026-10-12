export const branchPattern: string;
export interface PrMetadata {
  headRef: string;
  title: string;
}
export function validatePrConventions(metadata: PrMetadata): string[];
