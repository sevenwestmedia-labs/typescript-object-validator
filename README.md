# Node query executor

[![Build Status](https://travis-ci.com/sevenwestmedia-labs/node-knex-query-executor.svg?branch=master)](https://travis-ci.com/sevenwestmedia-labs/node-knex-query-executor) ![](https://img.shields.io/npm/v/node-knex-query-executor.svg)

A simple library which enables encapsulation of knex queries inside functions. It enables inversion of control for database queries, making it easy to mock the database layer entirely while making database queries themselves easy to test.

## Why

Using knex directly in code means often it is hard to create re-usable database queries, to avoid this the queries are put into functions and the `knex` instance passed into those function. This approach is hard to test and often results in many queries being written inline in places query code should not be written directly.

By forcing all queries to be encapsulated it encourages reuse of queries and building a collection of well tested queries.

## Usage

This library extends this concept to introduce a `QueryExecutor` which can be instructed to execute queries. There are 3 variations, the `ReadQueryExecutor` which is the entry point, when the `unitOfWork` function is called a `UnitOfWorkQueryExecutor` is passed in the callback, everything inside this callback will be executed inside a transaction. If the promise rejects the transaction will be rolled back.

### Constructor

The query executor is a class, to start using it you need to create an instance of the `ReadQueryExecutor`.

```ts
const queryExecutor = new ReadQueryExecutor(
    // The knex instance
    knex,
    // The services object is available to all queries, ie a logger
    {
        logger
    },
    // Table names is an object with the tables you would like to access,
    // mapping from the JS name to the database table name
    {
        tableOne: 'table-one'
    },
    // Optional, you can wrap every query before execution, allowing you to hook in logs or
    // some other manipulation
    query => query
)
```

#### Query Executor types

There are 3 query executor classes, you should only need to construct the `ReadQueryExecutor` as above.

-   `ReadQueryExecutor`: Entry point, represents a query executor not in a transaction
-   `UnitOfWorkQueryExecutor`: Type used when function wants to execute a query inside a transaction
-   `QueryExecutor`: Type when code does not care if the query is executed inside or outside a transaction

### Executing a query

```ts
// If using TypeScript it is advised to use the create query helper
// which can infer all the types from usage
interface QueryArgs {
    someArg: string
}

interface QueryResult {
    col1: string
}

// NOTE: Name your functions here if possible, it makes the error messages when using
// the mock query executor better
const exampleQuery = queryExecutor.createQuery(async function exampleQuery<
    QueryArgs,
    QueryResult
>({ args, tables, tableNames, query }) {
    // You can access the query arguments through `args`
    const { someArg } = args

    // Use tables to get Knex.QueryBuilder's for each table
    const result = await tables.tableOne().where(...).select('col1')

    // Use tableNames if you need to access a table name directly (for joins etc)
    // Use query() to access knex directly (it is a callback for wrapping purposes)
    const result = await query(knex => knex(tableNames.tableOne).select('col1'))

    // It is the queries responsibility to ensure the type is correct
    return result
})

// Then execute the query
const queryResult = await queryExecutor.execute(exampleQuery).withArgs({})
```

### Wrapping database queries

Sometimes you may want to instrument knex queries (for benchmarking, debugging etc), the query executor makes this really easy.

```ts
const queryExecutor = new ReadQueryExecutor(knex, {}, tables, {
    queryBuilderWrapper: (query: Knex.QueryBuilder) => {
        // Do what you want here

        return query
    },
    rawQueryWrapper: (query: Knex.Raw) => {
        // Do what you want here

        return query
    }
})
```

### Testing

```ts
import { NoMatch, MockQueryExecutor } from 'node-query-executor'

const queryExecutor = new MockQueryExecutor()

const exampleQuery = queryExecutor.createQuery<{}, number>(async ({}) => {
    // real query here
})
const exampleQuery2 = queryExecutor.createQuery<{ input: number }, number>(
    async ({}) => {
        // real query here
    }
)

// Setup the mock in the query executor, returning the same value no matter the args
queryExecutor.mock(exampleQuery).match(() => {
    return 1
})

// You can also chain matches, inspecting the query arguments
queryExecutor
    .mock(exampleQuery2)
    .match(({ input }) => {
        // Return 1 if even
        if (input % 2 === 0) {
            return 1
        }

        // Use the NoMatch symbol otherwise
        return NoMatch
    })
    .match(({ input }) => {
        // Return 0 if odd
        if (input % 2 === 1) {
            return 0
        }

        return NoMatch
    })
```

## Simplifying types

Because the QueryExecutor types are generic, it often is verbose writing `QueryExecutor<typeof keyof tableNames, YourQueryServices>`, it is suggested you export your own closed generic types to make them easy to pass around.

```ts
import * as KnexQueryExecutor from 'node-knex-query-executor'

interface YourQueryServices {
    log: Logger
}

export type Query<QueryArguments, QueryResult> = KnexQueryExecutor.Query<
    QueryArguments,
    QueryResult,
    keyof typeof tableNames,
    YourQueryServices
>
export type QueryExecutor = KnexQueryExecutor.QueryExecutor<
    keyof typeof tableNames,
    YourQueryServices
>
export type ReadQueryExecutor = KnexQueryExecutor.ReadQueryExecutor<
    keyof typeof tableNames,
    YourQueryServices
>
export type UnitOfWorkQueryExecutor = KnexQueryExecutor.UnitOfWorkQueryExecutor<
    keyof typeof tableNames,
    YourQueryServices
>
export type TableNames = KnexQueryExecutor.TableNames<keyof typeof tableNames>
export type Tables = KnexQueryExecutor.Tables<keyof typeof tableNames>
```

## Further reading

This library is inspired by a few object oriented patterns, and a want to move away from repositories.

https://en.wikipedia.org/wiki/Specification_pattern  
https://martinfowler.com/eaaCatalog/queryObject.html  
https://lostechies.com/chadmyers/2008/08/02/query-objects-with-the-repository-pattern/  
https://codeopinion.com/query-objects-instead-of-repositories/
