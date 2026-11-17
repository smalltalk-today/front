export interface DesignDiagnostic {
  code: string;
  file: string;
  line: number;
  message: string;
}

export function checkDesign(
  root: string,
  options?: { includeLegacy?: boolean },
): Promise<DesignDiagnostic[]>;

export function printDiagnostics(diagnostics: DesignDiagnostic[]): void;
