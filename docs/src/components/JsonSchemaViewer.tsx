import React from 'react';
import { JsonSchemaViewer } from '@stoplight/json-schema-viewer';

interface Props {
  name: string;
  schemaUrl: string;
  expanded?: boolean;
  hideTopBar?: boolean;
}

export default function JsonSchemaViewerComponent({ name, schemaUrl, expanded = true, hideTopBar = false }: Props) {
  const [schema, setSchema] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSchema() {
      try {
        const response = await fetch(schemaUrl);
        if (!response.ok) {
          throw new Error(`Failed to load schema: ${response.statusText}`);
        }
        const schemaData = await response.json();
        setSchema(schemaData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadSchema();
  }, [schemaUrl]);

  if (loading) {
    return (
      <div className="schema-viewer-loading" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading schema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schema-viewer-error" style={{ padding: '20px', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px' }}>
        <strong>Error loading schema:</strong> {error}
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="schema-viewer-empty" style={{ padding: '20px', color: '#666' }}>
        No schema found
      </div>
    );
  }

  return (
    <div className="schema-viewer-container" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      <JsonSchemaViewer
        name={name}
        schema={schema}
        expanded={expanded}
        hideTopBar={hideTopBar}
        emptyText="No schema defined"
        defaultExpandedDepth={2}
      />
    </div>
  );
}