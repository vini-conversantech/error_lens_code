// AI Prompt Templates

export interface PromptContext {
  filePath?: string
  fileName?: string
  code?: string
  error?: string
  language?: string
  projectTree?: string
  selectedCode?: string
}

// System prompts
export const SYSTEM_PROMPTS = {
  default: `You are ErrorLens Code, an AI coding assistant. You help developers write better code, fix bugs, and understand their projects.
- Be concise and practical
- Provide code examples when helpful
- Explain your reasoning
- Focus on the most effective solution`,

  codeReview: `You are a code reviewer. Analyze the code and provide constructive feedback.
- Focus on bugs, security issues, and performance
- Suggest improvements
- Rate code quality`,

  explain: `You are an expert programmer. Explain code clearly and simply.
- Use analogies when helpful
- Break down complex concepts
- Provide examples`,

  fix: `You are a bug-fixing expert. Analyze errors and provide fixes.
- Identify the root cause
- Provide minimal fix first
- Suggest safer alternatives
- Explain why the bug occurs`,
}

// Prompt generators
export function generateExplainErrorPrompt(context: PromptContext): string {
  return `Explain this error from ${context.fileName || context.filePath}:

${context.error}

${context.code ? `\nRelevant code:\n\`\`\`${context.language || ''}\n${context.code}\n\`\`\`` : ''}

Provide:
1. What the error means in simple terms
2. Why it happens
3. How to fix it
4. Prevention tips`
}

export function generateFixErrorPrompt(context: PromptContext): string {
  return `Fix this error in ${context.fileName || context.filePath}:

Error: ${context.error}

${context.code ? `Current code:\n\`\`\`${context.language || ''}\n${context.code}\n\`\`\`` : ''}

Provide:
1. Root cause analysis
2. The fixed code
3. Explanation of the fix
4. Alternative solutions if any`
}

export function generateRefactorPrompt(context: PromptContext): string {
  return `Refactor this ${context.language || 'code'} code:

${context.selectedCode || context.code}

Goals:
- Improve readability
- Follow best practices
- Better performance
- Cleaner structure

Provide the refactored code with explanations.`
}

export function generateFeaturePrompt(context: PromptContext): string {
  return `Generate code for this feature request:

${context.code}

${context.projectTree ? `\nProject structure:\n${context.projectTree}` : ''}

Provide:
1. Implementation approach
2. Complete code
3. Usage examples
4. Any necessary imports or dependencies`
}

export function generateTestsPrompt(context: PromptContext): string {
  return `Write tests for this ${context.language || 'code'}:

${context.selectedCode || context.code}

Include:
- Unit tests
- Edge cases
- Mock dependencies if needed
- Test coverage suggestions`
}

export function generateOptimizePrompt(context: PromptContext): string {
  return `Optimize this ${context.language || 'code'}:

${context.selectedCode || context.code}

Focus on:
- Performance
- Memory usage
- Algorithm efficiency
- Readability trade-offs

Provide optimized code with explanations.`
}

export function generateExplainCodePrompt(context: PromptContext): string {
  return `Explain this ${context.language || 'code'}:

${context.selectedCode || context.code}

Provide:
1. What it does (simple terms)
2. How it works
3. Key components
4. Potential issues or improvements`
}

export function generateCommitMessagePrompt(gitStatus: {
  staged: string[]
  modified: string[]
  created: string[]
  deleted: string[]
}): string {
  const changes = [
    ...gitStatus.created.map(f => `A: ${f}`),
    ...gitStatus.modified.map(f => `M: ${f}`),
    ...gitStatus.deleted.map(f => `D: ${f}`),
    ...gitStatus.staged.map(f => `S: ${f}`)
  ].join('\n')

  return `Generate a concise git commit message for these changes:

${changes}

Provide:
1. A short title (50 chars max)
2. A brief description if needed
3. Use conventional commits format if applicable`
}

export function generateContextPrompt(context: PromptContext): string {
  return `You have access to the following project context:

${context.projectTree ? `Project structure:\n${context.projectTree}` : ''}
${context.filePath ? `Current file: ${context.filePath}` : ''}

${context.code ? `Current file content:\n\`\`\`${context.language || ''}\n${context.code}\n\`\`\`` : ''}

${context.selectedCode ? `Selected code:\n\`\`\`${context.language || ''}\n${context.selectedCode}\n\`\`\`` : ''}

${context.error ? `Error to fix:\n${context.error}` : ''}

Provide helpful, context-aware responses based on this information.`
}

// Parse error messages
export function parseError(errorText: string): {
  type: string
  message: string
  line?: number
  column?: number
  file?: string
} {
  // TypeScript/JavaScript error patterns
  const tsPattern = /^(.+?):(\d+):(\d+):\s*(.+)$/m
  const tsMatch = errorText.match(tsPattern)
  
  if (tsMatch) {
    return {
      type: 'typescript',
      file: tsMatch[1],
      line: parseInt(tsMatch[2]),
      column: parseInt(tsMatch[3]),
      message: tsMatch[4]
    }
  }
  
  // Python error patterns
  const pyPattern = /^(.+?):(\d+):\s*(.+)$/m
  const pyMatch = errorText.match(pyPattern)
  
  if (pyMatch) {
    return {
      type: 'python',
      file: pyMatch[1],
      line: parseInt(pyMatch[2]),
      message: pyMatch[3]
    }
  }
  
  // Rust error patterns
  const rustPattern = /^error\[E\d+\]:\s*(.+)$/m
  const rustMatch = errorText.match(rustPattern)
  
  if (rustMatch) {
    return {
      type: 'rust',
      message: rustMatch[1]
    }
  }
  
  // Generic error
  return {
    type: 'generic',
    message: errorText.split('\n')[0]
  }
}