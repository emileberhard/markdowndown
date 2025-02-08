Directory Structure:

└── ./
    ├── src
    │   ├── __tests__
    │   │   └── main.test.ts
    │   ├── index.ts
    │   └── util.ts
    └── README.md



---
File: /src/__tests__/main.test.ts
---

// src/__tests__/main.test.ts
import { SchemaType } from '../util'
import { toGeminiSchema, toZodSchema } from '../index';
import { z } from 'zod';

describe('toGeminiSchema', () => {
    test('converts ZodObject to Gemini schema', () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
        isStudent: z.boolean(),
        optional: z.string().optional(),
      });
  
      const geminiSchema = toGeminiSchema(zodSchema);
  
      expect(geminiSchema).toEqual({
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, nullable: false },
          age: { type: SchemaType.NUMBER, nullable: false },
          isStudent: { type: SchemaType.BOOLEAN, nullable: false },
          optional: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name', 'age', 'isStudent'],
      });
    });
  
    test('converts ZodArray to Gemini schema', () => {
      const zodSchema = z.array(z.string());
  
      const geminiSchema = toGeminiSchema(zodSchema);
  
      expect(geminiSchema).toEqual({
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, nullable: false },
      });
    });
  
    test('converts nested ZodObject to Gemini schema', () => {
      const zodSchema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
        scores: z.array(z.number()),
      });
  
      const geminiSchema = toGeminiSchema(zodSchema);
  
      expect(geminiSchema).toEqual({
        type: SchemaType.OBJECT,
        properties: {
          user: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, nullable: false },
              age: { type: SchemaType.NUMBER, nullable: false },
            },
            required: ['name', 'age'],
          },
          scores: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER, nullable: false },
          },
        },
        required: ['user', 'scores'],
      });
    });
});

describe('toZodSchema', () => {
  test('converts Gemini object schema to ZodObject', () => {
    const geminiSchema = {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        age: { type: SchemaType.NUMBER },
        isStudent: { type: SchemaType.BOOLEAN },
        optional: { type: SchemaType.STRING, nullable: true },
      },
      required: ['name', 'age', 'isStudent'],
    };

    const zodSchema = toZodSchema(geminiSchema);

    expect(zodSchema).toBeInstanceOf(z.ZodObject);
    const castedZodSchema = zodSchema as z.ZodObject<any, any, any>;
    expect(castedZodSchema.shape.name).toBeInstanceOf(z.ZodString);
    expect(castedZodSchema.shape.age).toBeInstanceOf(z.ZodNumber);
    expect(castedZodSchema.shape.isStudent).toBeInstanceOf(z.ZodBoolean);
    expect(castedZodSchema.shape.optional).toBeInstanceOf(z.ZodOptional);
  });

  test('converts Gemini array schema to ZodArray', () => {
    const geminiSchema = {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    };

    const zodSchema = toZodSchema(geminiSchema);

    expect(zodSchema).toBeInstanceOf(z.ZodArray);
    const castedZodSchema = zodSchema as z.ZodArray<any>;
    expect(castedZodSchema.element).toBeInstanceOf(z.ZodString);
  });

  test('converts nested Gemini schema to nested Zod schema', () => {
    const geminiSchema = {
      type: SchemaType.OBJECT,
      properties: {
        user: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            age: { type: SchemaType.NUMBER },
          },
          required: ['name', 'age'],
        },
        scores: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.NUMBER },
        },
      },
      required: ['user', 'scores'],
    };

    const zodSchema = toZodSchema(geminiSchema);

    expect(zodSchema).toBeInstanceOf(z.ZodObject);
    const castedZodSchema = zodSchema as z.ZodObject<any, any, any>;
    expect(castedZodSchema.shape.user).toBeInstanceOf(z.ZodObject);
    expect(castedZodSchema.shape.scores).toBeInstanceOf(z.ZodArray);
    expect((castedZodSchema.shape.user as z.ZodObject<any>).shape.name).toBeInstanceOf(z.ZodString);
    expect((castedZodSchema.shape.user as z.ZodObject<any>).shape.age).toBeInstanceOf(z.ZodNumber);
    expect((castedZodSchema.shape.scores as z.ZodArray<any>).element).toBeInstanceOf(z.ZodNumber);
  });
});



---
File: /src/index.ts
---

import { getZodType, SchemaType } from './util';

export function toGeminiSchema(zodSchema: any): any {
    const zodType = getZodType(zodSchema);
  
    switch (zodType) {
      case 'ZodArray':
        return {
          type: SchemaType.ARRAY,
          items: toGeminiSchema(zodSchema.element),
        };
      case 'ZodObject':
        const properties: Record<string, any> = {};
        const required: string[] = [];
  
        Object.entries(zodSchema.shape).forEach(([key, value]: [string, any]) => {
          properties[key] = toGeminiSchema(value);
          if (getZodType(value) !== 'ZodOptional') {
            required.push(key);
          }
        });
  
        return {
          type: SchemaType.OBJECT,
          properties,
          required: required.length > 0 ? required : undefined,
        };
      case 'ZodString':
        return {
          type: SchemaType.STRING,
          nullable: zodSchema.isOptional(),
        };
      case 'ZodNumber':
        return {
          type: SchemaType.NUMBER,
          nullable: zodSchema.isOptional(),
        };
      case 'ZodBoolean':
        return {
          type: SchemaType.BOOLEAN,
          nullable: zodSchema.isOptional(),
        };
      case 'ZodEnum':
        return {
          type: SchemaType.STRING,
          enum: zodSchema._def.values,
          nullable: zodSchema.isOptional(),
        };
      case 'ZodOptional':
        const innerSchema = toGeminiSchema(zodSchema._def.innerType);
        return { ...innerSchema, nullable: true };
      default:
        return {
          type: SchemaType.OBJECT,
          nullable: true,
        };
    }
}
  
export function toZodSchema(geminiSchema: any): any {
    const z = require('zod'); // Dynamically import zod to avoid bundling it
  
    switch (geminiSchema.type) {
      case SchemaType.ARRAY:
        return z.array(toZodSchema(geminiSchema.items));
  
      case SchemaType.OBJECT:
        const shape: Record<string, any> = {};
        Object.entries(geminiSchema.properties).forEach(([key, value]: [string, any]) => {
          let fieldSchema = toZodSchema(value);
          if (!geminiSchema.required || !geminiSchema.required.includes(key)) {
            fieldSchema = fieldSchema.optional();
          }
          shape[key] = fieldSchema;
        });
        return z.object(shape);
  
      case SchemaType.STRING:
        return geminiSchema.nullable ? z.string().nullable() : z.string();
  
      case SchemaType.NUMBER:
      case SchemaType.INTEGER:
        return geminiSchema.nullable ? z.number().nullable() : z.number();
  
      case SchemaType.BOOLEAN:
        return geminiSchema.nullable ? z.boolean().nullable() : z.boolean();
  
      default:
        return geminiSchema.nullable ? z.any().nullable() : z.any();
    }
}  


---
File: /src/util.ts
---

export enum SchemaType {
    /** String type. */
    STRING = "string",
    /** Number type. */
    NUMBER = "number",
    /** Integer type. */
    INTEGER = "integer",
    /** Boolean type. */
    BOOLEAN = "boolean",
    /** Array type. */
    ARRAY = "array",
    /** Object type. */
    OBJECT = "object"
}
  
    // Helper function to check the type of Zod schema
export function getZodType(schema: any): string {
    return schema._def.typeName;
}


---
File: /README.md
---

# gemini-zod

Gemini AI Schema to Zod Adapter

[![npm version](https://badge.fury.io/js/gemini-zod.svg)](https://badge.fury.io/js/gemini-zod)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`gemini-zod` is a lightweight library that provides seamless conversion between Gemini AI schemas and Zod schemas. This adapter allows you to easily integrate Gemini AI's schema definitions with Zod's powerful runtime type checking and validation capabilities.

## Features

- Convert Gemini AI schemas to Zod schemas
- Convert Zod schemas to Gemini AI schemas
- Support for common data types (string, number, boolean, array, object)
- Handling of optional fields and nullable types

## Installation

```bash
npm install gemini-zod
```

## Usage

### Converting Zod Schema to Gemini AI Schema

```typescript
import { toGeminiSchema } from 'gemini-zod';
import { z } from 'zod';

const zodSchema = z.object({
  name: z.string(),
  age: z.number(),
  isStudent: z.boolean().optional(),
});

const geminiSchema = toGeminiSchema(zodSchema);

// Equivalent Gemini AI schema:
// {
//   type: 'object',
//   properties: {
//     name: { type: 'string' },
//     age: { type: 'number' },
//     isStudent: { type: 'boolean', nullable: true },
//   },
//   required: ['name', 'age'],
// }
```

### Converting Gemini AI Schema to Zod Schema

```typescript
import { toZodSchema } from 'gemini-zod';
import { z } from 'zod';

const geminiSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    isStudent: { type: 'boolean', nullable: true },
  },
  required: ['name', 'age'],
};

const zodSchema = toZodSchema(geminiSchema);

// Equivalent Zod schema:
// z.object({
//   name: z.string(),
//   age: z.number(),
//   isStudent: z.boolean().optional(),
// })
```
