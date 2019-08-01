# Typescript Object Validator

[![Build Status](https://travis-ci.com/sevenwestmedia-labs/typescript-object-validator.svg?branch=master)](https://travis-ci.com/sevenwestmedia-labs/typescript-object-validator)

A simple library for typescript projects to validating object shapes. You can use this package to declare the shape you'd like an object to align to. This is handy when you have a complex object (for example, an API response) and want to validate the object, AND have typescript recognize the shape.

## Basic Usage

```typescript
import { validateObjectShape } from 'typescript-object-validator'

const elephantValidation = validateObjectShape(
    'Elephant API response' // https://elephant-api.herokuapp.com/elephants/random
    randomElephantResponse,
    {
        _id: 'string',
        index: 'number',
        name: 'string',
        affiliation: 'string',
        species: 'string',
        sex: 'string',
        fictional: 'boolean',
        dob: 'string',
        dod: 'string',
        wikilink: 'string',
        image: 'string',
        note: 'string',
    }
)

if (elephantValidation.valid === true) {

    /*
        At this point, elephantValidation.result will have the type of:
        {
            _id: 'string',
            index: 'number',
            name: 'string',
            affiliation: 'string',
            species: 'string',
            sex: 'string',
            fictional: 'boolean',
            dob: 'string',
            dod: 'string',
            wikilink: 'string',
            image: 'string',
            note: 'string',
        }
    */

    console.log(elephantValidation.result.name)
    // -> "Packy"
}

```

## API

`validateObjectShape` Can be used to validate an object:

```typescript
import { validateObjectShape } from 'typescript-object-validator'

validateObjectShape(
    objectDescription,
    validationItem,
    expectedObjectShape,
    validationOptions
)
```

-   **objectDescription** (required - string): A description which is used in error messages when the object does not validate
-   **validationItem** (required - object): An object you want to validate
-   **expectedObjectShape** (required - object): A definition of what shape the object should match
-   **validationOptions** (required - object): A set of options to change the validation behaviour, [see more](#Options)

The result of the validation is an object with a `valid` property which flags if the validation succeeded or failed, a `result` object which is the validated and typed object, or an `errors` array with error results.

```typescript
const validationResult = validateObjectShape(
    objectDescription,
    validationItem,
    expectedObjectShape,
    validationOptions
)

// If the validation is successful
{
    valid: true,
    result: { ...validatedItem }  // (the object you passed in, but typed!)
}

// If the validation fails
{
    valid: false,
    errors: [
        'Expected Test obj.two to be type: number, was string',
    ]
}
```

`validateObjectShape` will coerce values for you if it's able to. For example if you say the property `age` is a number, but it's passed in as a string, `validateObjectShape` will try convert it to a number for you in the `result` object:

```typescript
const validationResult = validateObjectShape(
    'Coercion Example',
    { age: '30' },
    { age: number }
)

if (validationResult.valid === true) {
    // validationResult.result.age -> 30
    typeof validationResult.result.age === 'number'
}
```

The library also alows you to test nested objects and arrays, for example:

```typescript
const validationResult = validateObjectShape(
    'Nested Example',
    {
        age: '30',
        meta: { group: 'Staff' }
        names: [
            { fname: 'Jeff', lname: 'Thompson' },
            { fname: 'Jeff', lname: 'Thompson' }
        ]
    },
    {
        age: number,
        meta: { group: 'string' }
        names: arrayOf({ fname: 'string', lname: 'string' })
    }
)
```

### Validation Types

There are a number of basic validation types available to use, and some helpers which allow you build more complex types:

Basic types

-   **string**: Matches a string
-   **number**: Matches a number
-   **boolean**: Matches a boolean
-   **unknown**: Matches an unknown type (will skip validation on that property)

This package also understands more complex types such as arrays and optional types. You can import helper functions to assist you in building these.

Complex Types:

-   **arrayOf** ('string'): Array of some basic type
-   **optional** ('string'): Makes the property your testing optional. The test will only run if the property exists

```typescript
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
        eight: optional('boolean')
    }
)
```

### Options

-   **coerceValidObjectIntoArray** (boolean): If you are validating an array with `arrayOf`, setting this to `true` will convert those properties to arrays for you, rather than returning an error. This is useful for example when converting from xml to json.

```typescript
const validationResult = validateObjectShape(
    'Coercion Example',
    { names: { fname: 'Jeff', lname: 'Thompson' } },
    { names: arrayOf({ fname: 'string', lname: 'string' }) },
    { coerceValidObjectIntoArray: true }
)

/*
    Converts names into an array. validationResult.result:
    { names: [{ fname: 'Jeff', lname: 'Thompson' }] }
*/
```
