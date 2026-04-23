import React from 'react';
import { Card } from '../../components/Card';

const ExcelFormatterTool: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-grey-900 mb-4">Excel Auto-formatter</h1>
      <Card>
        <p className="text-grey-500">
          This tool is pending implementation. Check back later.
        </p>
        <p className="text-sm text-grey-400 mt-2">
          Drop implementation into /client/src/tools/excel-formatter/ and /server/src/tools/excel-formatter/
        </p>
      </Card>
    </div>
  );
};

export default ExcelFormatterTool;
