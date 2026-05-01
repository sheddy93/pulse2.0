/**
 * validateInput.js
 * Input validation helper for backend functions
 * Prevents malicious payloads + type errors
 */

Deno.serve(async (req) => {
  try {
    const { data, schema } = await req.json();

    if (!data || !schema) {
      return Response.json({ error: 'Missing data or schema' }, { status: 400 });
    }

    // Import and validate
    const { validatePayload } = await import('../lib/validation-schemas.js');
    
    // Get the schema
    const schemaMap = {
      'CreateEmployeeSchema': await import('../lib/validation-schemas.js').then(m => m.CreateEmployeeSchema),
      'CreateLeaveRequestSchema': await import('../lib/validation-schemas.js').then(m => m.CreateLeaveRequestSchema),
      'CreateDocumentSchema': await import('../lib/validation-schemas.js').then(m => m.CreateDocumentSchema),
      'CreateExpenseSchema': await import('../lib/validation-schemas.js').then(m => m.CreateExpenseSchema),
    };

    const selectedSchema = schemaMap[schema];
    if (!selectedSchema) {
      return Response.json({ error: `Unknown schema: ${schema}` }, { status: 400 });
    }

    const result = validatePayload(data, selectedSchema);
    
    return Response.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});