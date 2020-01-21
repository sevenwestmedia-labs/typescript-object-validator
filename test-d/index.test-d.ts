import { expectType } from 'tsd'

import { validateObjectShape, arrayOf, optional } from '../src'

interface SimpleResultType {
    one: string
    two: number
    three: boolean
    four: string[]
    five: boolean[]
    six: number[]
    seven: unknown
    eight: string | undefined
}
const simpleResult = validateObjectShape(
    'Test obj',
    {
        one: 'string value',
        two: 2,
        three: true,
        four: ['1', '2'],
        five: [true, false],
        six: [1, 2],
        seven: 'whatever'
    },
    {
        one: 'string',
        two: 'number',
        three: 'boolean',
        four: arrayOf('string'),
        five: arrayOf('boolean'),
        six: arrayOf('number'),
        seven: 'unknown',
        eight: optional('string')
    }
)

if (simpleResult.valid) {
    expectType<SimpleResultType>(simpleResult.result)
}

interface NestedResultType {
    nested: {
        one: string
        two: number
        three: boolean
        four: string[]
        five: boolean[]
        six: number[]
        seven: unknown
    }
}
const nestedResult = validateObjectShape(
    'Test obj',
    {
        nested: {
            one: 'string value',
            two: 2,
            three: true,
            four: ['1', '2'],
            five: [true, false],
            six: [1, 2],
            seven: 'whatever'
        }
    },
    {
        nested: {
            one: 'string',
            two: 'number',
            three: 'boolean',
            four: arrayOf('string'),
            five: arrayOf('boolean'),
            six: arrayOf('number'),
            seven: 'unknown'
        }
    }
)

if (nestedResult.valid) {
    expectType<NestedResultType>(nestedResult.result)
}
