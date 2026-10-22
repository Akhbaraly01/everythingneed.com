import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const base = process.cwd();
const jsRoot = join(base, 'resources/js');
const routesJson = join(base, 'tmp-routes-audit.json');

const walk = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...walk(full));
        else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
    }
    return out;
};

// The route list may be written with a BOM (PowerShell) or UTF-16 (shell
// redirection) - normalise before parsing.
const readJson = (path) => {
    const raw = readFileSync(path, 'utf8');
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

    return JSON.parse(text.replace(/^[\s\uFEFF]+/, ''));
};

const routes = readJson(routesJson).map((r) => r.uri.replace(/^\//, ''));

const toRegex = (uri) =>
    new RegExp('^' + uri.split('/').map((seg) => (seg.startsWith('{') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/') + '$');

const routeMatchers = routes.map((uri) => ({ uri, re: toRegex(uri) }));

const isDynamic = (seg) =>
    /^[0-9]+$/.test(seg) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
    /^[0-9a-f]{32}$/i.test(seg) ||
    /^[A-Za-z0-9_-]{20,}$/.test(seg);

/** A path segment that can only be a runtime id (uuid, hash, slug id). */
const hasDynamicSegment = (path) =>
    path
        .split('/')
        .filter(Boolean)
        .some((segment) => isDynamic(segment));

const matchRoute = (path) => {
    const clean = path.split('?')[0].replace(/^\//, '').replace(/\/$/, '');
    return routeMatchers.find((r) => r.re.test(clean));
};

/**
 * Prefix match for template calls whose last segment is a runtime verb
 * (`.../${action}`): the route exists as `<prefix>/{anything}`.
 */
const matchRoutePrefix = (path) => {
    const clean = path.split('?')[0].replace(/^\//, '').replace(/\/$/, '');
    const segments = clean.split('/');

    if (segments.length < 2) {
        return false;
    }

    const prefix = segments.slice(0, -1).join('/');

    return routeMatchers.some((r) => {
        const routeSegments = r.uri.split('/').filter(Boolean);

        if (routeSegments.length < prefix.split('/').length) {
            return false;
        }

        return prefix
            .split('/')
            .every((segment, index) => {
                const routeSegment = routeSegments[index];

                if (routeSegment.startsWith('{')) {
                    return true;
                }

                return routeSegment === segment;
            });
    });
};

const files = walk(jsRoot);
const report = { brokenLinks: [], brokenApi: [], missingPages: [], checkedFiles: files.length };

for (const file of files) {
    const code = readFileSync(file, 'utf8');
    const rel = relative(base, file).replace(/\\/g, '/');

    const linkRe = /(?:href=|router\.visit\(\s*|to=)["'`](\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)["'`]/g;
    let m;
    while ((m = linkRe.exec(code)) !== null) {
        const target = m[1];
        if (target.startsWith('/api/') || target.startsWith('/storage/') || target.includes('{')) continue;
        // Runtime ids (uuid/slug) are not routes by themselves.
        if (hasDynamicSegment(target)) continue;
        if (!matchRoute(target)) report.brokenLinks.push({ file: rel, target });
    }

    const apiRe = /api\.(get|post|put|patch|del|delete)\(\s*[`"']([^`"']+)[`"']/g;
    while ((m = apiRe.exec(code)) !== null) {
        const target = m[2];
        if (!target.startsWith('/api/') && !target.startsWith('api/')) continue;
        if (target.includes('${')) {
            const concrete = target.replace(/\$\{[^}]+\}/g, 'x');
            if (!matchRoute(concrete) && !matchRoutePrefix(concrete)) {
                report.brokenApi.push({ file: rel, target, kind: 'template' });
            }
            continue;
        }
        if (!matchRoute(target)) report.brokenApi.push({ file: rel, target, kind: 'static' });
    }
}

const phpFiles = [];
const walkPhp = (dir) => {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) walkPhp(full);
        else if (entry.endsWith('.php')) phpFiles.push(full);
    }
};
for (const dir of ['routes', 'Modules', 'app']) walkPhp(join(base, dir));

for (const file of phpFiles) {
    const code = readFileSync(file, 'utf8');
    const rel = relative(base, file).replace(/\\/g, '/');
    const inertiaRe = /inertia\(\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = inertiaRe.exec(code)) !== null) {
        const name = m[1];
        const candidates = [
            join(jsRoot, 'pages', `${name}.tsx`),
            join(jsRoot, `${name}.tsx`),
            join(jsRoot, 'pages', name, 'Index.tsx'),
        ];
        if (!candidates.some((c) => {
            try { statSync(c); return true; } catch { return false; }
        })) {
            report.missingPages.push({ file: rel, page: name });
        }
    }
}

const dedupe = (arr, key) => {
    const seen = new Set();
    return arr.filter((item) => {
        const k = key(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

report.brokenLinks = dedupe(report.brokenLinks, (x) => `${x.file}|${x.target}`);
report.brokenApi = dedupe(report.brokenApi, (x) => `${x.file}|${x.target}`);
report.missingPages = dedupe(report.missingPages, (x) => `${x.file}|${x.page}`);

writeFileSync(join(base, 'tmp-frontend-audit.json'), JSON.stringify(report, null, 2));
console.log(`files scanned: ${report.checkedFiles}`);
console.log(`broken links: ${report.brokenLinks.length}`);
console.log(`broken api calls: ${report.brokenApi.length}`);
console.log(`missing inertia pages: ${report.missingPages.length}`);
