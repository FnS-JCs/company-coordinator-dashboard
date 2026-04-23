import React from 'react';
import { Card } from '../../components/Card';

const ToolFour: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-grey-900 mb-4">Tool 4</h1>
      <Card>
        <p className="text-grey-500">
          This tool is pending implementation. Check back later.
        </p>
        <p className="text-sm text-grey-400 mt-2">
          Drop implementation into /client/src/tools/tool-four/ and /server/src/tools/tool-four/
        </p>
      </Card>
    </div>
  );
};

export default ToolFour;
