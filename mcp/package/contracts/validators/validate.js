import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize AJV with formats support
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Schema type to filename mapping
const schemaFiles = {
  'module': 'module.schema.json',
  'feature': 'feature.schema.json',
  'user-story': 'user-story.schema.json',
  'bug': 'bug.schema.json',
  'tech-debt': 'tech-debt.schema.json',
  'spike': 'spike.schema.json'
};

/**
 * Load a JSON schema from file
 * @param {string} schemaType - Type of schema to load
 * @returns {object} Parsed JSON schema
 */
function loadSchema(schemaType) {
  const schemaFile = schemaFiles[schemaType];
  if (!schemaFile) {
    throw new Error(`Unknown schema type: ${schemaType}`);
  }

  const schemaPath = join(__dirname, '../schemas', schemaFile);
  const schemaContent = readFileSync(schemaPath, 'utf-8');
  return JSON.parse(schemaContent);
}

/**
 * Validate a contract against its schema
 * @param {string} schemaType - Type of schema (module, feature, user-story, bug, tech-debt, spike)
 * @param {object} data - Data to validate
 * @returns {object} Validation result with success flag and errors if any
 */
export function validateContract(schemaType, data) {
  try {
    const schema = loadSchema(schemaType);
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      return {
        success: false,
        errors: validate.errors.map(err => ({
          path: err.instancePath,
          message: err.message,
          params: err.params,
          keyword: err.keyword
        }))
      };
    }

    return {
      success: true,
      message: `${schemaType} contract is valid`
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: '',
        message: error.message
      }]
    };
  }
}

/**
 * Validate a contract from a JSON file
 * @param {string} schemaType - Type of schema
 * @param {string} filePath - Path to JSON file to validate
 * @returns {object} Validation result
 */
export function validateContractFile(schemaType, filePath) {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return validateContract(schemaType, data);
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: '',
        message: `Error reading file: ${error.message}`
      }]
    };
  }
}

/**
 * Format validation errors for display
 * @param {array} errors - Array of validation errors
 * @returns {string} Formatted error message
 */
function formatErrors(errors) {
  return errors.map(err => {
    const path = err.path || 'root';
    return `  - ${path}: ${err.message}`;
  }).join('\n');
}

// CLI interface
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate.js <schema-type> [file-path]');
    console.error('Schema types: module, feature, user-story, bug, tech-debt, spike');
    console.error('If no file path is provided, reads from stdin');
    process.exit(1);
  }

  const schemaType = args[0];
  const filePath = args[1];

  if (!schemaFiles[schemaType]) {
    console.error(`Unknown schema type: ${schemaType}`);
    console.error('Valid types: module, feature, user-story, bug, tech-debt, spike');
    process.exit(1);
  }

  if (filePath) {
    // Validate from file
    const result = validateContractFile(schemaType, filePath);

    if (result.success) {
      console.log(`✓ ${result.message}`);
      process.exit(0);
    } else {
      console.error(`✗ Validation failed for ${schemaType}:`);
      console.error(formatErrors(result.errors));
      process.exit(1);
    }
  } else {
    // Read from stdin
    let inputData = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', chunk => {
      inputData += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(inputData);
        const result = validateContract(schemaType, data);

        if (result.success) {
          console.log(`✓ ${result.message}`);
          process.exit(0);
        } else {
          console.error(`✗ Validation failed for ${schemaType}:`);
          console.error(formatErrors(result.errors));
          process.exit(1);
        }
      } catch (error) {
        console.error(`✗ Error parsing JSON: ${error.message}`);
        process.exit(1);
      }
    });
  }
}
