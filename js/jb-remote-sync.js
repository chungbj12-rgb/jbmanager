/**
 * Supabase ↔ localStorage 동기화 (app_kv), 셔틀 공개 스냅샷
 */
(function (global) {
  var pushTimer = null;
  var pendingKeys = {};
  var subscribed = false;

  function enabled() {
    var c = global.JBAuthConfig || {};
    return c.storageMode === "supabase" && !!c.supabaseUrl && !!c.supabaseAnonKey;
  }

  function getClient() {
    return global.JBSupabase && global.JBSupabase.getClient();
  }

  async function pullAll() {
    if (!enabled()) return;
    var client = getClient();
    if (!client) return;
    var res = await client.from("app_kv").select("key,value");
    if (res.error) {
      console.error("[JBRemoteSync] pull", res.error);
      return;
    }
    var rows = res.data || [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      try {
        global.localStorage.setItem(row.key, JSON.stringify(row.value));
      } catch (e) {}
    }
    global.dispatchEvent(new Event("jb-remote-pulled"));
  }

  function queuePush(key, val) {
    if (!enabled()) return;
    pendingKeys[key] = val;
    if (pushTimer) global.clearTimeout(pushTimer);
    pushTimer = global.setTimeout(function () {
      flushPush();
    }, 450);
  }

  async function flushPush() {
    var keys = Object.keys(pendingKeys);
    if (!keys.length) return;
    var client = getClient();
    if (!client) return;
    var batch = keys.map(function (k) {
      return { key: k, value: pendingKeys[k], updated_at: new Date().toISOString() };
    });
    pendingKeys = {};
    var res = await client.from("app_kv").upsert(batch, { onConflict: "key" });
    if (res.error) console.error("[JBRemoteSync] push", res.error);
  }

  function subscribeKv() {
    if (!enabled() || subscribed) return;
    var client = getClient();
    if (!client) return;
    subscribed = true;
    client
      .channel("jb_app_kv")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_kv" },
        function (payload) {
          var n = payload.new;
          if (n && n.key != null) {
            try {
              global.localStorage.setItem(n.key, JSON.stringify(n.value));
            } catch (e) {}
            global.dispatchEvent(new CustomEvent("jb-remote-update", { detail: { key: n.key } }));
          }
        }
      )
      .subscribe();
  }

  async function publishShuttleSnapshot(bundle) {
    if (!enabled()) return;
    var client = getClient();
    if (!client) return;
    var res = await client.from("shuttle_public_snapshot").upsert(
      {
        id: 1,
        payload: bundle,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (res.error) console.error("[JBRemoteSync] shuttle publish", res.error);
  }

  async function fetchShuttlePublicAnon() {
    if (!enabled()) return null;
    var client = getClient();
    if (!client) return null;
    var res = await client.from("shuttle_public_snapshot").select("payload").eq("id", 1).maybeSingle();
    if (res.error || !res.data) return null;
    return res.data.payload;
  }

  global.JBRemoteSync = {
    enabled: enabled,
    pullAll: pullAll,
    queuePush: queuePush,
    flushPush: flushPush,
    subscribeKv: subscribeKv,
    publishShuttleSnapshot: publishShuttleSnapshot,
    fetchShuttlePublicAnon: fetchShuttlePublicAnon,
  };
})(window);
