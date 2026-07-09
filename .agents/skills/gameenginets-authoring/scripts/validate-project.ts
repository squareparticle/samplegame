#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

type Diagnostic = { severity: "error" | "warning"; file: string; message: string; };

async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await walk(fullPath));
        else files.push(fullPath);
    }
    return files;
}

function validateEntity(file: string, value: any): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    if (!Array.isArray(value?.components)) return diagnostics;
    const ids = new Set<string>();
    for (const component of value.components) {
        const id = component?.base?.id;
        if (!id) continue;
        if (ids.has(id)) diagnostics.push({ severity: "error", file, message: `Duplicate component ID "${id}".` });
        ids.add(id);
    }
    for (const [aliasName, alias] of Object.entries<any>(value.alias ?? {})) {
        for (const componentID of Object.keys(alias?.enable ?? {})) {
            if (!ids.has(componentID)) diagnostics.push({ severity: "error", file, message: `Alias "${aliasName}" references missing component "${componentID}".` });
        }
    }
    return diagnostics;
}

async function main(): Promise<void> {
    const root = path.resolve(process.argv[2] ?? ".");
    const jsonFiles = (await walk(root)).filter(file => file.endsWith(".json"));
    const diagnostics: Diagnostic[] = [];
    for (const file of jsonFiles) {
        try {
            const value = JSON.parse(await fs.readFile(file, "utf8"));
            diagnostics.push(...validateEntity(file, value));
        } catch (error) {
            diagnostics.push({ severity: "error", file, message: error instanceof Error ? error.message : String(error) });
        }
    }
    diagnostics.forEach(item => console.log(`${item.severity.toUpperCase()} ${item.file}: ${item.message}`));
    const errors = diagnostics.filter(item => item.severity === "error").length;
    console.log(`Validated ${jsonFiles.length} JSON files with ${errors} error(s).`);
    if (errors) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
