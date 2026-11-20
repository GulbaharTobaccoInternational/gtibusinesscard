import { DEMO_EMPLOYEES } from './demo';
import { EMPTY_EMPLOYEE, validateEmployee, type Employee, type Issue } from './employee';
import type { CompanyId } from './company';
import type { PreviewResult } from './renderer';

type PreviewInput = { companyId: CompanyId; employee: Employee };
export type EditorPreview = {
  input: PreviewInput;
  rendered: { employee: Employee; preview: PreviewResult };
  blank: PreviewResult;
  sample?: PreviewResult;
  error: string;
};

export function initialEditorPreview(companyId: CompanyId, employee: Employee, blank: PreviewResult): EditorPreview {
  return { input: { companyId, employee }, rendered: { employee: EMPTY_EMPLOYEE, preview: blank }, blank, error: '' };
}

type Action =
  | { type: 'change'; employee: Employee }
  | { type: 'success'; input: PreviewInput; preview: PreviewResult }
  | { type: 'failure'; input: PreviewInput; message: string };

export function editorPreviewReducer(state: EditorPreview, action: Action): EditorPreview {
  const { companyId } = state.input;
  if (action.type === 'change') {
    const employee = action.employee;
    const cached = employee === EMPTY_EMPLOYEE ? state.blank : employee === DEMO_EMPLOYEES[companyId] ? state.sample : undefined;
    return { ...state, input: { companyId, employee }, rendered: cached ? { employee, preview: cached } : state.rendered, error: '' };
  }
  // Each edit creates a request identity, even when returning to a previous value.
  if (action.input !== state.input) return state;
  if (action.type === 'failure') return { ...state, error: action.message };
  if (action.preview.companyId !== companyId) return { ...state, error: 'The preview company did not match the selected company. Please try again.' };
  const { employee } = action.input;
  return {
    ...state, rendered: { employee, preview: action.preview }, error: '',
    sample: employee === DEMO_EMPLOYEES[companyId] ? action.preview : state.sample,
  };
}

export function currentPreview(state: EditorPreview): PreviewResult | undefined {
  if (!state.error && state.rendered.employee === state.input.employee && state.rendered.preview.companyId === state.input.companyId) {
    return state.rendered.preview;
  }
}

export function editorIssues(employee: Employee, companyId: CompanyId, confirmed?: PreviewResult): Issue[] {
  const issues = validateEmployee(employee, companyId).filter(issue => issue.field !== 'primaryMobile');
  if (!employee.mobile.trim()) issues.push({ field: 'mobile', message: 'Employee mobile is required.', severity: 'error', code: 'required-mobile' });
  for (const issue of confirmed?.issues ?? []) {
    if (issue.field === 'primaryMobile' || issues.some(local => local.code === issue.code && local.message === issue.message)) continue;
    issues.push(issue.code === 'overflow-mobile'
      ? { ...issue, message: 'The printed phone line is too long. Remove unnecessary spaces or punctuation from Employee mobile.' }
      : issue);
  }
  return issues;
}
