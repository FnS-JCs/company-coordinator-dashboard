import { cvSorterTool } from './cv-sorter/index.js';
import { vcfGeneratorTool } from './vcf-generator/index.js';
import { excelFormatterTool } from './excel-formatter/index.js';
import { toolFour } from './tool-four/index.js';

export const tools = {
  'cv-sorter': cvSorterTool,
  'vcf-generator': vcfGeneratorTool,
  'excel-formatter': excelFormatterTool,
  'tool-four': toolFour,
};

export function getTool(name) {
  return tools[name] || null;
}
