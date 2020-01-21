export type ValidatedType<
    T extends ValidationKeyType<T> | OptionalShape<T>
> = T extends OptionalShape<infer O>
    ? O extends 'unknown'
        ? unknown | undefined
        : O extends 'number'
        ? number | undefined
        : O extends 'string'
        ? string | undefined
        : O extends 'boolean'
        ? boolean | undefined
        : O extends Array<'string'>
        ? string[] | undefined
        : O extends Array<'number'>
        ? number[] | undefined
        : O extends Array<'boolean'>
        ? boolean[] | undefined
        : O extends ObjectShape<O>
        ? MapObjectShape<O> | undefined
        : O extends Array<infer U>
        ? U extends ObjectShape<U>
            ? Array<MapObjectShape<U>> | undefined
            : unknown
        : unknown
    : T extends 'unknown'
    ? unknown
    : T extends 'number'
    ? number
    : T extends 'string'
    ? string
    : T extends 'boolean'
    ? boolean
    : T extends Array<'string'>
    ? string[]
    : T extends Array<'number'>
    ? number[]
    : T extends Array<'boolean'>
    ? boolean[]
    : T extends ObjectShape<T>
    ? MapObjectShape<T>
    : T extends Array<infer U>
    ? U extends ObjectShape<U>
        ? Array<MapObjectShape<U>>
        : unknown
    : unknown

type MapObjectShape<T extends ObjectShape<T>> = {
    [key in keyof T]: ValidatedType<T[key]>
}

export interface ValidationOptions {
    /**
     * When the type should be an array, if a value is found, but would
     * be valid if inside an array, it will automatically be wrapped
     */
    coerceValidObjectIntoArray?: boolean
}

export interface OptionalShape<T> {
    __validationOptionalProp: true
    keyType: ValidationKeyType<T>
}

export type ValidationKeyType<T = object> =
    | 'unknown'
    | 'number'
    | 'string'
    | 'boolean'
    | Array<'string'>
    | Array<'number'>
    | Array<'boolean'>
    | ObjectShape<T>
    | Array<ObjectShape<T>>

// While not required, when using string literals (ie 'string'),
// once the shape gets complicated enough, TypeScript starts treating the
// values as string types, rather than string literals.
// This is quite confusing as you extend a shape, and suddenly it doesn't compile
// for seemingly no reason.
/** Available primitive types to validate */
export const validationTypes = {
    unknown: 'unknown' as 'unknown',
    string: 'string' as 'string',
    number: 'number' as 'number',
    boolean: 'boolean' as 'boolean',
    stringArray: ['string'] as Array<'string'>,
    booleanArray: ['boolean'] as Array<'boolean'>,
    numberArray: ['number'] as Array<'number'>
}

// We need this generic type so we can merge ObjectShapes and not lose info
export type ObjectShape<T extends {}> = {
    [key in keyof T]: ValidationKeyType<T[key]> | OptionalShape<T[key]>
}

export type ValidationResult<
    T extends ValidationKeyType<T> | OptionalShape<T>
> =
    | { valid: true; result: ValidatedType<T> }
    | { valid: false; errors: string[]; errorMessage: string }

export function shapeOf<T extends ObjectShape<T>>(shape: T): T {
    return shape
}

export function arrayOf<T extends ValidationKeyType<T>>(keyType: T): T[] {
    return [keyType]
}

export function optional<T extends ValidationKeyType<T>>(
    keyType: T
): OptionalShape<T> {
    return {
        __validationOptionalProp: true,
        keyType
    }
}

export function validateObjectShape<T extends ObjectShape<T>>(
    objectDescription: string,
    validationItem: unknown,
    expectedObjectShape: T,
    validationOptions: ValidationOptions = {}
): ValidationResult<T> {
    // We rebuild the object as a deep clone
    // this will contain the result if there are no validation checks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let validValue: any
    const errors: string[] = []
    try {
        if (!isObject(validationItem)) {
            const errorMessage = `${objectDescription} was expected to be an object, but was ${typeof validationItem}`
            return {
                valid: false,
                errors: [errorMessage],
                errorMessage
            }
        }
        validValue = { ...validationItem }
        const actualKeys = Object.keys(validationItem)

        Object.keys(expectedObjectShape).forEach(expectedKey => {
            try {
                const actualValue = validationItem[expectedKey]
                const expectedType = (expectedObjectShape as any)[expectedKey]

                if (isOptional(expectedType)) {
                    if (actualValue === undefined) {
                        return
                    }

                    // At this point, we know it has a value, so use normal validation (and we need to cast)
                    const optionalKeyValidationResult = validateValue(
                        `${objectDescription}.${expectedKey}`,
                        actualValue,
                        expectedType.keyType,
                        validationOptions
                    )

                    if (!optionalKeyValidationResult.valid) {
                        errors.push(...optionalKeyValidationResult.errors)
                    } else {
                        validValue[expectedKey] =
                            optionalKeyValidationResult.result
                    }

                    return
                }

                if (actualKeys.indexOf(expectedKey) === -1) {
                    const error = `${objectDescription}: Missing expected Key: ${expectedKey}`
                    errors.push(error)
                    return
                }

                const keyValidationResult = validateValue(
                    `${objectDescription}.${expectedKey}`,
                    actualValue,
                    expectedType,
                    validationOptions
                )

                if (!keyValidationResult.valid) {
                    errors.push(...keyValidationResult.errors)
                    return
                }

                validValue[expectedKey] = keyValidationResult.result
            } catch (err) {
                errors.push(
                    `Unexpected error when validating ${objectDescription}.${expectedKey}`
                )
            }
        })
    } catch (err) {
        errors.push(`Unexpected error when validating ${objectDescription}`)
    }

    if (errors.length) {
        return { valid: false, errors, errorMessage: errors.join('    \n') }
    }

    return { valid: true, result: validValue }
}

function isOptional<T>(
    wat: ValidationKeyType<T> | OptionalShape<T>
): wat is OptionalShape<T> {
    return typeof wat === 'object' && '__validationOptionalProp' in wat
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(wat: any): wat is { [key: string]: any } {
    return typeof wat === 'object'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateValue<T extends ValidationKeyType<any>>(
    valueDescription: string,
    value: unknown,
    valueType: T,
    options: ValidationOptions = {}
): ValidationResult<ValidationKeyType<T>> {
    if (valueType === 'string') {
        if (typeof value === 'number') {
            return { valid: true, result: value.toString() }
        }

        if (typeof value !== 'string') {
            const errorMessage = `Expected ${valueDescription} to be type: string, was ${typeof value}`
            return {
                valid: false,
                errors: [errorMessage],
                errorMessage
            }
        }

        return { valid: true, result: value }
    }

    if (valueType === 'boolean') {
        if (typeof value !== 'boolean') {
            const errorMessage = `Expected ${valueDescription} to be type: boolean, was ${typeof value}`
            return {
                valid: false,
                errors: [errorMessage],
                errorMessage
            }
        }

        return { valid: true, result: value }
    }

    if (valueType === 'number') {
        if (typeof value !== 'number') {
            const errorMessage = `Expected ${valueDescription} to be type: number, was ${typeof value}`
            return {
                valid: false,
                errors: [errorMessage],
                errorMessage
            }
        }

        return { valid: true, result: value }
    }

    if (valueType instanceof Array) {
        const itemType = valueType[0]
        if (value instanceof Array) {
            const errors: string[] = []
            const validatedValues = value.map((item, itemIndex) => {
                const nestedErrors = validateValue(
                    `${valueDescription}[${itemIndex}]`,
                    item,
                    itemType,
                    options
                )
                if (!nestedErrors.valid) {
                    errors.push(nestedErrors.errorMessage)
                    return undefined
                }

                return nestedErrors.result
            })

            if (errors.length > 0) {
                return {
                    valid: false,
                    errors,
                    errorMessage: `${valueDescription} contained invalid items:\n${errors.join(
                        '    \n'
                    )}`
                }
            }
            return { valid: true, result: validatedValues }
        }

        if (options.coerceValidObjectIntoArray) {
            const itemValidation = validateValue(
                `${valueDescription}[${0}]`,
                value,
                itemType,
                options
            )

            if (itemValidation.valid) {
                return { valid: true, result: [itemValidation.result] }
            }

            return itemValidation
        }

        const errorMessage = `Expected ${valueDescription} to be type: Array`
        return {
            valid: false,
            errors: [errorMessage],
            errorMessage
        }
    }

    if (valueType !== 'unknown' && valueType instanceof Object) {
        return validateObjectShape(
            valueDescription,
            value,
            valueType as ObjectShape<T>,
            options
        )
    }

    if (valueType === 'unknown') {
        return { valid: true, result: value }
    }

    const errorMessage = `${valueDescription} could not be validated`
    return { valid: false, errors: [errorMessage], errorMessage }
}
