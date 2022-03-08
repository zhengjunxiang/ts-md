import { app, Command } from 'command-line-application'
import generate, { createMatcher } from '.'

const tsReadme: Command = {
  name: 'ts-md',
  description: 'Generate docs from typescript + jsdoc and put it in a README',
  examples: [
    {
      example: 'ts-md',
      desc: 'Generate docs for everything in "src/"'
    },
    {
      example: 'ts-md "components/**/*.(ts|tsx)"',
      desc: 'Target specific files'
    }
  ],
  options: [
    {
      name: 'pattern',
      type: String,
      defaultOption: true,
      multiple: true,
      description: 'The files to generate docs for'
    },
    {
      name: 'type',
      type: String,
      description: 'The type to generate docs for'
    },
    {
      name: 'filePath',
      type: String,
      description: 'The file to generate docs for'
    },
    {
      name: 'matcher',
      type: String,
      description:
        'A string for creating and matching the markdown section to insert docs into'
    }
  ]
}

const args = app(tsReadme)

if (args) {
  const matcher = args.matcher ? createMatcher(args.matcher) : undefined
  generate({ pattern: args.pattern, matcher, types: args.type, filePath: args.filePath })
}
