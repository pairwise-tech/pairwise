export interface Output {
    code: number;
    stdout: string;
    stderr: string;
}
export interface AlternateLanguageTestResult {
    passed: boolean;
    testOutput: Output;
    previewOutput: Output;
}
