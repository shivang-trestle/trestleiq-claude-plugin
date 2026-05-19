import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TrestleClient } from './client.js';
import { TrestleError } from './errors.js';
import { phoneValidationTool } from './tools/phone-validation.js';
import { reversePhoneTool } from './tools/reverse-phone.js';
const apiKey = process.env.TRESTLE_API_KEY;
const server = new McpServer({ name: 'trestleiq', version: '0.1.1' });
const tools = [phoneValidationTool, reversePhoneTool];
if (!apiKey) {
    for (const tool of tools) {
        server.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema.shape,
        }, async () => ({
            isError: true,
            content: [
                {
                    type: 'text',
                    text: 'TRESTLE_API_KEY is not set. Run /trestle-setup in Claude Code, or export TRESTLE_API_KEY in your shell.',
                },
            ],
        }));
    }
}
else {
    const client = new TrestleClient(apiKey);
    for (const tool of tools) {
        server.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema.shape,
        }, (args) => tool.handler(args, client));
    }
}
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`trestleiq MCP server running (apiKey=${apiKey ? 'set' : 'MISSING'})`);
}
main().catch((err) => {
    if (err instanceof TrestleError) {
        console.error(`trestleiq fatal: [${err.kind}] ${err.message}`);
    }
    else {
        console.error('trestleiq fatal:', err);
    }
    process.exit(1);
});
//# sourceMappingURL=index.js.map