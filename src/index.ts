import ts from 'typescript'
import fs from 'fs'
import prettier from 'prettier'
import glob from 'fast-glob'

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

interface Param {
  /** The name of the param */
  name: string
  /** A description of the param */
  description?: string
  /** The type of the param */
  type: string
}

interface Member {
  name: string
  required: boolean
  type: string
  default: string
  description: string
}

interface TypeScriptDocument {
  filename: string
  /** The title of the exported thing */
  title: string
  /** The description of the exported thing */
  description?: string
  /** Example of usage */
  examples?: string[]
  /** Params if applicable */
  params?: Param[]
  /** Properties if applicable */
  properties?: string[]
  /** Interface members if applicable */
  members?: Member[]
  /** The type of the exported member */
  type?: string | { members: string[] }
  /** If a function the type of the return */
  returnType?: string
}

/** Return the jsDoc comment if there is one */
function getJsDocComment(statement: ts.Node) {
  return (statement as any).jsDoc && (statement as any).jsDoc[0]
    ? (statement as any).jsDoc[0].comment
    : ''
}

/** Determine if a constant is a function decl */
function isArrowConst(statement: ts.Node): statement is ts.VariableStatement {
  return Boolean(
    ts.isVariableStatement(statement) &&
    statement.declarationList.declarations[0].initializer &&
    ts.isArrowFunction(statement.declarationList.declarations[0].initializer)
  )
}

/** Get the type of a statement */
function getType(statement: ts.Node) {
  if (isArrowConst(statement) || ts.isFunctionLike(statement)) {
    return 'function'
  }

  if (ts.isTypeAliasDeclaration(statement)) {
    return 'type'
  }

  if (ts.isClassDeclaration(statement)) {
    return 'class'
  }

  if (ts.isInterfaceDeclaration(statement)) {
    return 'interface'
  }

  if (ts.isVariableStatement(statement)) {
    if (statement.declarationList.declarations[0].type) {
      return `variable: ${printer.printNode(
        ts.EmitHint.Unspecified,
        statement.declarationList.declarations[0].type,
        statement.getSourceFile()
      )}`
    }

    return 'variable'
  }
}

/** Get the type of a param */
function print(param: ts.Node): string {
  return printer.printNode(
    ts.EmitHint.Unspecified,
    param,
    param.getSourceFile()
  )
}

/**
 * Generate the markdown docs a doc returned from `getAllDocs`
 *
 * @param doc - The TypeScript document to generate types for
 */
export function generateMarkdown(doc: TypeScriptDocument) {
  let result = ''

  result += doc.filename ? `### ${doc.filename} \n\n` : ''
  result += `#### ${doc.title} (${doc.type})\n\n`
  result += doc.description ? `> ${doc.description}\n\n` : ''

  if (doc.properties && doc.properties.length > 0) {
    result += '**属性：**\n\n'

    doc.properties.forEach((property) => result += `- ${property}\n`)
    result += '\n'
  }

  if (doc.members && doc.members.length > 0) {
    result += '**属性：**\n\n'

    result += '| 属性               | 类型                | 必填              | 默认值           | 说明             |\n'
    result += '|-------------------| ------------------- | ---------------- | --------------- | --------------- \n'

    doc.members.forEach((member) => {
      result += `| ${member.name} | ${(member.type || '').replace('|', '\\|')} | ${member.required ? '✅' : '❎'} | ${member.default} | ${member.description} |\n`
    })

    result += '\n'
  } else if (doc.params && doc.params.length > 0) {
    result += '**属性：**\n\n'

    doc.params.forEach((param) => {
      result += `- ${param.name} ${param.type ? `(\`${param.type}\`) ` : ''}${param.description ? `- ${param.description}` : ''
        }\n`
    })

    result += '\n'
  }

  result += doc.returnType ? `**返回：** ${doc.returnType}\n\n` : ''

  if (doc.examples && doc.examples.length > 0) {
    result += '**实例：**\n'
    doc.examples.forEach((example) => {
      result += `${example.includes('```') ? example : `\`\`\`tsx\n${example}\n\`\`\`\n`}\n`
    })

    result += '\n'
  }

  return result
}

/** Get the docs for all functions and interfaces exported from the file */
function getDocs(filenames: string[], types: string): TypeScriptDocument[] {
  const program = ts.createProgram({ rootNames: filenames, options: {} })
  const checker = program.getTypeChecker()

  /** Match jsdoc name to function type decl */
  function getParamType(doc: ts.JSDocParameterTag, statement: ts.Node) {
    const name = print(doc.name)
    const fn = isArrowConst(statement)
      ? statement.declarationList.declarations[0].initializer
      : statement

    if (!fn || !ts.isFunctionLike(fn)) {
      return ''
    }

    const paramType = fn.parameters.find((param) => print(param.name) === name)

    return paramType
      ? checker.typeToString(checker.getTypeAtLocation(paramType))
      : ''
  }

  const docs = program
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile)
    .map((file) => {
      return file.statements
        .filter((s): s is
          | ts.VariableStatement
          | ts.FunctionDeclaration
          | ts.TypeAliasDeclaration
          | ts.ClassDeclaration
          | ts.InterfaceDeclaration =>
          Boolean(
            s.modifiers &&
            // This determines if it is exported
            s.modifiers.find((e) => e.kind === ts.SyntaxKind.ExportKeyword) &&
            (
              types.includes('variable') && ts.isVariableStatement(s) ||
              types.includes('function') && ts.isFunctionLike(s) ||
              types.includes('type') && ts.isTypeAliasDeclaration(s) ||
              types.includes('class') && ts.isClassDeclaration(s) ||
              types.includes('interface') && ts.isInterfaceDeclaration(s))
          )
        )
        .map((statement, index) => {
          const title = ts.isVariableStatement(statement)
            ? print(statement.declarationList.declarations[0].name)
            : (statement.name && print(statement.name)) || ''

          const description = getJsDocComment(statement)
          const jsDocs = ts.getJSDocTags(statement)

          let returnType: string | undefined


          const params: Param[] = jsDocs
            .filter(ts.isJSDocParameterTag)
            .map((doc: any) => {
              return {
                name: print(doc.name),
                description: doc.comment ? doc.comment.replace(/^- /, '') : '',
                type: getParamType(doc, statement)
              }
            })

          if (ts.isFunctionLike(statement)) {
            statement.parameters.forEach((param) => {
              const paramName = print(param.name)

              if (params.find((p) => p.name === paramName)) {
                return
              }

              params.push({
                name: paramName,
                type: checker.typeToString(checker.getTypeAtLocation(param))
              })
            })

            const type = checker.getTypeAtLocation(statement)
              ;[returnType] = type
                .getCallSignatures()
                .map((sig) =>
                  checker.typeToString(checker.getReturnTypeOfSignature(sig))
                )
          }

          let members: any[] = []

          if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
            // @ts-ignore
            const membersArr = ts.isInterfaceDeclaration(statement) ? statement.members : statement.type.members;

            members = (membersArr || []).map((member: any) => {
              const name = `${print(member.name!).replace(
                /\/\*\*.*\*\/\s+(\S+)/,
                '$1'
              )}`;
              const param = params.find(param => param.name === name);
              return {
                name,
                required: !!member.questionToken ? false : true,
                type: checker.typeToString(
                  checker.getTypeAtLocation(member)
                ),
                description: param?.description || '-'
              };
            })
          }

          const examples = jsDocs
            .filter((doc) => doc.tagName.escapedText === 'example')
            .map((doc) => doc.comment)
            .filter((doc): doc is string => Boolean(doc))

          const defaultValue: any = jsDocs
            .filter((doc) => doc.tagName.escapedText === 'default')
            .map((doc) => doc.comment)
            // @ts-ignore
            .reduce((prev: any, next: string) => {
              const keyValue = next.split('=').map(keyValueOrigin => keyValueOrigin.trim());
              prev[`${keyValue[0]}`] = keyValue[1]
              return prev
            }, {});

          members.forEach((member: Member) => {
            member.default = defaultValue[member.name] || ''
          });

          const properties = jsDocs
            .filter((doc) => doc.tagName.escapedText === 'property')
            .map((doc) => doc.comment)
            .filter((doc): doc is string => Boolean(doc))

          return {
            filename: index === 0 ? file.fileName : '',
            title,
            description,
            examples,
            params,
            properties,
            returnType,
            members,
            type: getType(statement)
          }
        })
    }
    )

  return docs.reduce((acc, item) => [...acc, ...item], [])
}

/**
 * Get the docs for all some files in the project.
 *
 * @param pattern - A glob pattern or patterns to match files from
 */
export async function getAllDocs(pattern: string | string[], types: string) {
  const files = await glob(pattern)
  return getDocs(files, types)
}

/**
 * Create a markdown comment matcher. This matches the section where
 * we will insert docs. Use this to create a custom section.
 *
 * @param name - The name to use in the markdown comment
 */
export function createMatcher(name: string) {
  return new RegExp(`(<!-- ${name} START -->\\s*)([\\S\\s]*)(\\s*<!-- ${name} END -->)`)
}

export interface GenerateOptions {
  /** A regex to match the part of the readme  */
  matcher?: RegExp
  /** A glob pattern or patterns to match files from */
  pattern?: string | string[]
  /** The type to generate docs for */
  types?: string
  /** The file to generate docs for */
  filePath?: string
}

/**
 * Generate all the docs and put it in the README.
 *
 * @param options - Options for generating the docs
 *
 * @example
 * import generate, { createMatcher } from 'ts-readme';
 *
 * generate({ matcher: createMatcher('TS-README-GENERATED') })
 */
export default async function generate(options: GenerateOptions) {
  const {
    matcher = createMatcher('INSERT GENERATED DOCS'),
    pattern = ['./src/**/*.(ts|tsx)'],
    types = 'variable,function,type,class,interface',
    filePath = './README.md'
  } = options
  const docs = await getAllDocs(pattern, types)
  const markdown = docs.map((doc) => generateMarkdown(doc))
  let readme = fs.readFileSync(filePath, 'utf8')

  if (readme.match(matcher)) {
    readme = readme.replace(matcher, `$1${markdown.join('\n')}$3`)

    fs.writeFileSync(filePath, prettier.format(readme, { parser: 'markdown', singleQuote: true }))
  }
}
