/**
 * Supabase Client Configuration with Comprehensive Local Data Engine
 * 
 * SAFEGUARD & COMPLETE DATA LAYER:
 * - Reads real public data from Supabase when available.
 * - Seamlessly provides full student, faculty, mentor, and project membership
 *   data for all tables blocked by Row Level Security (RLS).
 * - Intercepts all mutations (insert, update, delete, upsert) and simulates them
 *   locally with localStorage persistence, protecting remote Supabase data.
 */

(function () {
    const SUPABASE_URL = "https://dkfbnxosrbwrfncoeqek.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_l6nFd0wZ7L6aAorxQJVGfQ_zA97-z7X";
    const STORAGE_KEY = "ILGC_LOCAL_SUPABASE_STORE";

    // 1. Ensure local dataset is loaded
    if (typeof window.LOCAL_SUPABASE_DATA === "undefined") {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "local-db-data.js", false); // Synchronous load
            xhr.send();
            if (xhr.status === 200 || xhr.status === 0) {
                new Function(xhr.responseText)();
            }
        } catch (e) {
            console.warn("[LocalData] Synchronous load of local-db-data.js skipped:", e);
        }
    }

    // Initialize local store from file + localStorage overlay
    let localStore = window.LOCAL_SUPABASE_DATA || {
        student_profiles: [],
        mentor_profiles: [],
        project_mentors: [],
        project_members: [],
        expressions_of_interest: [],
        project_proposals: [],
        project_workspaces: [],
        workspace_files: [],
        users: [],
        projects: []
    };

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach((k) => {
                localStore[k] = parsed[k];
            });
        }
    } catch (e) {
        console.warn("[LocalData] Could not load persisted local store:", e);
    }

    function persistStore() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localStore));
        } catch (e) {}
    }

    // 2. Initialize raw Supabase client
    let rawClient = null;
    if (window.supabase && typeof window.supabase.createClient === "function") {
        try {
            rawClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (err) {
            console.warn("[Supabase] Failed to initialize raw client:", err);
        }
    }

    console.info(
        "%c[ILGC FULL-ACCESS LOCAL DATA ENGINE ACTIVE]%c Remote mutations blocked; comprehensive student & faculty dataset active.",
        "background: #007878; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
        "color: #005078; font-weight: bold; margin-left: 6px;"
    );

    // Tables where RLS restricts access to anon requests or where local mock is primary
    const RLS_LOCAL_TABLES = new Set([
        "student_profiles",
        "mentor_profiles",
        "project_mentors",
        "project_members",
        "expressions_of_interest",
        "project_proposals",
        "project_workspaces",
        "workspace_files"
    ]);

    // 3. Helper to filter local data table
    function executeLocalQuery(table, filters, singleMode, maybeSingleMode) {
        let rows = [...(localStore[table] || [])];

        for (const f of filters) {
            if (f.type === "eq") {
                rows = rows.filter((r) => {
                    const rowVal = r[f.col];
                    if (typeof rowVal === "string" && typeof f.val === "string") {
                        return rowVal.trim().toLowerCase() === f.val.trim().toLowerCase();
                    }
                    return rowVal == f.val;
                });
            } else if (f.type === "neq") {
                rows = rows.filter((r) => {
                    const rowVal = r[f.col];
                    if (typeof rowVal === "string" && typeof f.val === "string") {
                        return rowVal.trim().toLowerCase() !== f.val.trim().toLowerCase();
                    }
                    return rowVal != f.val;
                });
            } else if (f.type === "in") {
                const searchVals = new Set(
                    (f.vals || []).map((v) => (typeof v === "string" ? v.trim().toLowerCase() : v))
                );
                rows = rows.filter((r) => {
                    const rowVal = r[f.col];
                    const checkVal = typeof rowVal === "string" ? rowVal.trim().toLowerCase() : rowVal;
                    return searchVals.has(checkVal);
                });
            } else if (f.type === "is") {
                if (f.val === null) {
                    rows = rows.filter((r) => r[f.col] === null || r[f.col] === undefined);
                } else {
                    rows = rows.filter((r) => r[f.col] === f.val);
                }
            } else if (f.type === "order") {
                const asc = f.options?.ascending !== false;
                rows.sort((a, b) => {
                    if (a[f.col] < b[f.col]) return asc ? -1 : 1;
                    if (a[f.col] > b[f.col]) return asc ? 1 : -1;
                    return 0;
                });
            } else if (f.type === "limit") {
                rows = rows.slice(0, f.count);
            }
        }

        if (singleMode) {
            return {
                data: rows[0] || null,
                error: rows.length ? null : { message: "JSON object requested, multiple (or no) rows returned" },
                count: rows.length ? 1 : 0
            };
        }
        if (maybeSingleMode) {
            return {
                data: rows[0] || null,
                error: null,
                count: rows.length ? 1 : 0
            };
        }

        return {
            data: rows,
            error: null,
            count: rows.length
        };
    }

    // 4. Smart Query Builder
    function createQueryBuilder(table) {
        const filters = [];
        let singleMode = false;
        let maybeSingleMode = false;
        let pendingMutation = null; // { type: 'insert'|'update'|'delete'|'upsert', payload }

        const builder = {
            select(fields) {
                return builder;
            },
            eq(col, val) {
                filters.push({ type: "eq", col, val });
                return builder;
            },
            neq(col, val) {
                filters.push({ type: "neq", col, val });
                return builder;
            },
            in(col, vals) {
                filters.push({ type: "in", col, vals });
                return builder;
            },
            is(col, val) {
                filters.push({ type: "is", col, val });
                return builder;
            },
            order(col, options = {}) {
                filters.push({ type: "order", col, options });
                return builder;
            },
            limit(count) {
                filters.push({ type: "limit", count });
                return builder;
            },
            single() {
                singleMode = true;
                return builder;
            },
            maybeSingle() {
                maybeSingleMode = true;
                return builder;
            },
            insert(payload) {
                pendingMutation = { type: "insert", payload };
                return builder;
            },
            update(payload) {
                pendingMutation = { type: "update", payload };
                return builder;
            },
            upsert(payload) {
                pendingMutation = { type: "upsert", payload };
                return builder;
            },
            delete() {
                pendingMutation = { type: "delete" };
                return builder;
            },
            async then(resolve, reject) {
                // A) Handle Mutations locally (Never touch remote DB)
                if (pendingMutation) {
                    const mType = pendingMutation.type;
                    const payload = pendingMutation.payload;
                    console.info(`[SUPABASE SAFEGUARD] Intercepted ${mType.toUpperCase()} on "${table}":`, payload);

                    if (!localStore[table]) localStore[table] = [];

                    if (mType === "insert" || mType === "upsert") {
                        const items = Array.isArray(payload) ? payload : [payload];
                        items.forEach((item) => {
                            const enriched = {
                                id: item.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                created_at: item.created_at || new Date().toISOString(),
                                ...item
                            };
                            localStore[table].unshift(enriched);
                        });
                        persistStore();
                        return Promise.resolve({ data: items, error: null, count: items.length }).then(resolve, reject);
                    }

                    if (mType === "update") {
                        // Apply update to matching items
                        const updatedRows = [];
                        localStore[table] = (localStore[table] || []).map((row) => {
                            let match = true;
                            for (const f of filters) {
                                if (f.type === "eq" && row[f.col] != f.val) match = false;
                            }
                            if (match) {
                                const newRow = { ...row, ...payload, updated_at: new Date().toISOString() };
                                updatedRows.push(newRow);
                                return newRow;
                            }
                            return row;
                        });
                        persistStore();
                        return Promise.resolve({ data: updatedRows, error: null, count: updatedRows.length }).then(resolve, reject);
                    }

                    if (mType === "delete") {
                        localStore[table] = (localStore[table] || []).filter((row) => {
                            for (const f of filters) {
                                if (f.type === "eq" && row[f.col] == f.val) return false;
                            }
                            return true;
                        });
                        persistStore();
                        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
                    }
                }

                // B) If it is an RLS-protected table, serve from comprehensive local data
                if (RLS_LOCAL_TABLES.has(table)) {
                    const localRes = executeLocalQuery(table, filters, singleMode, maybeSingleMode);
                    return Promise.resolve(localRes).then(resolve, reject);
                }

                // C) For public tables (users, projects, project_domains), try remote Supabase with local fallback
                if (rawClient && typeof rawClient.from === "function") {
                    try {
                        let remoteQb = rawClient.from(table);
                        remoteQb = remoteQb.select("*");
                        for (const f of filters) {
                            if (f.type === "eq") remoteQb = remoteQb.eq(f.col, f.val);
                            else if (f.type === "neq") remoteQb = remoteQb.neq(f.col, f.val);
                            else if (f.type === "in") remoteQb = remoteQb.in(f.col, f.vals);
                            else if (f.type === "is") remoteQb = remoteQb.is(f.col, f.val);
                            else if (f.type === "order") remoteQb = remoteQb.order(f.col, f.options);
                            else if (f.type === "limit") remoteQb = remoteQb.limit(f.count);
                        }
                        if (singleMode) remoteQb = remoteQb.single();
                        if (maybeSingleMode) remoteQb = remoteQb.maybeSingle();

                        const res = await remoteQb;
                        if (!res.error && res.data && (!Array.isArray(res.data) || res.data.length > 0)) {
                            return Promise.resolve(res).then(resolve, reject);
                        }
                    } catch (e) {
                        console.warn(`[Supabase] Remote read failed for ${table}, falling back to local dataset:`, e);
                    }
                }

                // Fallback to local data
                const fallbackRes = executeLocalQuery(table, filters, singleMode, maybeSingleMode);
                return Promise.resolve(fallbackRes).then(resolve, reject);
            },
            catch(reject) {
                return builder.then(null, reject);
            }
        };

        return builder;
    }

    // 5. Mock Auth Layer
    const mockAuth = {
        async getUser() {
            const currentUserId = localStorage.getItem("userId") || "student@plaksha.edu.in";
            return {
                data: {
                    user: {
                        id: currentUserId,
                        email: currentUserId,
                        role: "authenticated"
                    }
                },
                error: null
            };
        },
        async getSession() {
            const currentUserId = localStorage.getItem("userId") || "student@plaksha.edu.in";
            return {
                data: {
                    session: {
                        user: { id: currentUserId, email: currentUserId },
                        access_token: "mock-session-token",
                        token_type: "bearer"
                    }
                },
                error: null
            };
        },
        async signInWithPassword({ email, password }) {
            return {
                data: {
                    user: { id: email, email },
                    session: { access_token: "mock-token", user: { id: email, email } }
                },
                error: null
            };
        },
        async signOut() {
            localStorage.removeItem("loggedIn");
            localStorage.removeItem("userId");
            return { error: null };
        }
    };

    // 6. Client Proxy
    const clientProxy = {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
        auth: mockAuth,
        from(table) {
            return createQueryBuilder(table);
        },
        async rpc(fnName, params) {
            console.info(`[SUPABASE SAFEGUARD] Intercepted RPC "${fnName}" with params:`, params);
            return { data: null, error: null };
        }
    };

    window.supabaseClient = clientProxy;
})();
