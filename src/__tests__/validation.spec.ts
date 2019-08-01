import { validateObjectShape, arrayOf, optional } from '..'

it('validates a valid simple object', () => {
    interface ExpectedResultType {
        one: string
        two: number
        three: boolean
        four: string[]
        five: boolean[]
        six: number[]
        seven: unknown
        eight: string | undefined
    }
    const result = validateObjectShape(
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

    // This ensures types are correct, afaik there is no $AssertType in eslint yet
    if (result.valid) {
        const parsed: ExpectedResultType = result.result
        expect(parsed).toBeDefined()
    }

    expect(result).toMatchObject({
        valid: true,
        result: {
            one: 'string value',
            two: 2,
            three: true,
            four: ['1', '2'],
            five: [true, false],
            six: [1, 2],
            seven: 'whatever'
        }
    })
})

it('validates a valid nested object', () => {
    const result = validateObjectShape(
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

    expect(result).toMatchObject({
        valid: true,
        result: {
            nested: {
                one: 'string value',
                two: 2,
                three: true,
                four: ['1', '2'],
                five: [true, false],
                six: [1, 2],
                seven: 'whatever'
            }
        }
    })
    if (!result.valid) {
        throw new Error('Cant get here')
    }

    expect(result.result.nested.one).toEqual('string value')
    expect(result.result.nested.two).toEqual(2)
    expect(result.result.nested.three).toEqual(true)
    expect(result.result.nested.four).toEqual(['1', '2'])
    expect(result.result.nested.five).toEqual([true, false])
    expect(result.result.nested.six).toEqual([1, 2])
    expect(result.result.nested.seven).toEqual('whatever')
})

it('validates a invalid simple object', () => {
    const result = validateObjectShape(
        'Test obj',
        {
            one: 1,
            two: 'two',
            three: 'three',
            four: [1],
            five: [1],
            six: [1, '2'],
            seven: 'Whatever'
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

    expect(result).toMatchObject({
        valid: false,
        errors: [
            'Expected Test obj.two to be type: number, was string',
            'Expected Test obj.three to be type: boolean, was string',
            'Expected Test obj.five[0] to be type: boolean, was number',
            'Expected Test obj.six[1] to be type: number, was string'
        ]
    })
})

it('validates a invalid nested object', () => {
    const result = validateObjectShape(
        'Nested obj',
        {
            nested: {
                one: 'one'
            }
        },
        { nested: { one: 'number' } }
    )

    expect(result).toMatchObject({
        valid: false,
        errors: [
            `Expected Nested obj.nested.one to be type: number, was string`
        ]
    })
})

it('allows wrapping a valid object into an array', () => {
    const result = validateObjectShape(
        'Test obj',
        {
            testArr: { val: 'val' }
        },
        {
            testArr: arrayOf({ val: 'string' })
        },
        { coerceValidObjectIntoArray: true }
    )

    expect(result).toMatchObject({
        valid: true,
        result: {
            testArr: [{ val: 'val' }]
        }
    })
})

it('allows converting a number into a string', () => {
    const result = validateObjectShape(
        'Test obj',
        {
            testStr: 1
        },
        {
            testStr: 'string'
        }
    )

    expect(result).toMatchObject({
        valid: true,
        result: {
            testStr: '1'
        }
    })
})

it('when wrapping an item in a array ensure it coerced correctly', () => {
    const result1 = validateObjectShape(
        'Test obj',
        { testArr: { val: 'val' } },
        { testArr: arrayOf({ val: 'string' }) },
        { coerceValidObjectIntoArray: true }
    )

    const result2 = validateObjectShape(
        'Test obj',
        { testArr: { val: 'val' } },
        { testArr: optional(arrayOf({ val: 'string' })) },
        { coerceValidObjectIntoArray: true }
    )

    expect(result1.valid).toBe(true)
    expect(result1.valid && result1.result).toMatchObject({
        testArr: [{ val: 'val' }]
    })

    expect(result2.valid).toBe(true)
    expect(result2.valid && result2.result).toMatchObject({
        testArr: [{ val: 'val' }]
    })
})

it('when wrapping an item in a array and does not match, ensure good error message', () => {
    const result1 = validateObjectShape(
        'Test obj',
        {
            testArr: { notMatching: 'val' }
        },
        {
            testArr: arrayOf({ val: 'string' })
        },
        { coerceValidObjectIntoArray: true }
    )

    expect(result1).toMatchObject({
        valid: false,
        errorMessage: 'Test obj.testArr[0]: Missing expected Key: val'
    })
})
