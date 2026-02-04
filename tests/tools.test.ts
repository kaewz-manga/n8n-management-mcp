import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/tools';

describe('MCP Tools', () => {
  it('should have 27 tools defined', () => {
    expect(TOOLS.length).toBe(27);
  });

  it('should have unique tool names', () => {
    const names = TOOLS.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(TOOLS.length);
  });

  it('should have all tools prefixed with n8n_', () => {
    TOOLS.forEach((tool) => {
      expect(tool.name).toMatch(/^n8n_/);
    });
  });

  it('should have description for each tool', () => {
    TOOLS.forEach((tool) => {
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(10);
    });
  });

  it('should have valid inputSchema for each tool', () => {
    TOOLS.forEach((tool) => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    });
  });

  describe('Workflow Tools', () => {
    const workflowTools = [
      'n8n_list_workflows',
      'n8n_get_workflow',
      'n8n_create_workflow',
      'n8n_update_workflow',
      'n8n_delete_workflow',
      'n8n_activate_workflow',
      'n8n_deactivate_workflow',
      'n8n_execute_workflow',
      'n8n_get_workflow_tags',
      'n8n_update_workflow_tags',
    ];

    it('should have all workflow tools', () => {
      const toolNames = TOOLS.map((t) => t.name);
      workflowTools.forEach((name) => {
        expect(toolNames).toContain(name);
      });
    });
  });

  describe('Execution Tools', () => {
    const executionTools = [
      'n8n_list_executions',
      'n8n_get_execution',
      'n8n_delete_execution',
      'n8n_retry_execution',
    ];

    it('should have all execution tools', () => {
      const toolNames = TOOLS.map((t) => t.name);
      executionTools.forEach((name) => {
        expect(toolNames).toContain(name);
      });
    });
  });

  describe('Credential Tools', () => {
    const credentialTools = [
      'n8n_create_credential',
      'n8n_update_credential',
      'n8n_delete_credential',
      'n8n_get_credential_schema',
    ];

    it('should have all credential tools', () => {
      const toolNames = TOOLS.map((t) => t.name);
      credentialTools.forEach((name) => {
        expect(toolNames).toContain(name);
      });
    });
  });

  describe('Required Parameters', () => {
    it('n8n_get_workflow should require id', () => {
      const tool = TOOLS.find((t) => t.name === 'n8n_get_workflow');
      expect(tool?.inputSchema.required).toContain('id');
    });

    it('n8n_execute_workflow should require id', () => {
      const tool = TOOLS.find((t) => t.name === 'n8n_execute_workflow');
      expect(tool?.inputSchema.required).toContain('id');
    });

    it('n8n_create_tag should require name', () => {
      const tool = TOOLS.find((t) => t.name === 'n8n_create_tag');
      expect(tool?.inputSchema.required).toContain('name');
    });
  });
});
