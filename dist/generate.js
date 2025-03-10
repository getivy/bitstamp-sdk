"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsdom_1 = require("jsdom");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function generateTypes() {
    // Get the current directory
    const currentDir = process.cwd();
    // get openapi.json
    const baseUrl = "https://docs.bitstamp.net/";
    // Fetch HTML content
    const response = await fetch(baseUrl);
    const html = await response.text();
    // Parse HTML
    const dom = new jsdom_1.JSDOM(html);
    const links = Array.from(dom.window.document.querySelectorAll("a"));
    // Extract OpenAPI IDs
    const openApis = links
        .map((link) => {
        const href = link.getAttribute("href");
        return {
            id: href?.split("/").pop(),
            name: link.textContent
                ?.toLowerCase()
                .replace(/[()-]/g, "") // Remove parentheses and hyphens
                .replace(/\s+/g, "_") // Replace spaces with underscores
                .replace(/\.+/g, "_") // Replace dots with underscores
                .replace(/_+/g, "_"), // Replace multiple underscores with single
        };
    })
        .filter(Boolean);
    // Create types directory if it doesn't exist
    const typesDir = path.join(__dirname, "types");
    if (!fs.existsSync(typesDir)) {
        fs.mkdirSync(typesDir);
    }
    // Generate types for each OpenAPI spec
    for (const { id, name } of openApis) {
        try {
            const url = `${baseUrl}${id}`;
            await execAsync(`npx openapi-typescript ${url} -o ./types/${name}.ts`);
            console.log(`Generated types for OpenAPI spec ${id} - ${name}`);
        }
        catch (error) {
            console.error(`Error generating types for ${id} - ${name}:`, error);
        }
    }
    // Generate index file instead of combining
    const indexContent = openApis
        .map(({ name }) => `export * as ${name} from './types/${name}';`)
        .join("\n");
    fs.writeFileSync(path.join(__dirname, "index.ts"), indexContent);
    console.log("Successfully generated types and index file");
}
generateTypes().catch(console.error);
