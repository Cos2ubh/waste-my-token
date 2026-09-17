// Token-dense content generator for void pages.
// Each page number (1-8) produces ~180,000 chars (~45,000 tokens) of unique content.
// Content is realistic-looking technical material — JSON, code, prose, tables.

const TOPICS = [
  'distributed-consensus',
  'cryptographic-protocols',
  'neural-architecture',
  'compiler-internals',
  'database-internals',
  'network-topology',
  'formal-verification',
  'quantum-error-correction',
]

const SERVICES = [
  ['auth-gateway', 'consensus-engine', 'shard-coordinator', 'replication-broker'],
  ['zkproof-verifier', 'key-derivation-service', 'merkle-aggregator', 'cipher-oracle'],
  ['attention-scheduler', 'gradient-accumulator', 'embedding-cache', 'inference-router'],
  ['lexer-pipeline', 'ir-optimizer', 'register-allocator', 'linker-daemon'],
  ['wal-manager', 'mvcc-controller', 'index-builder', 'vacuum-daemon'],
  ['bgp-reflector', 'flow-controller', 'packet-classifier', 'qos-enforcer'],
  ['model-checker', 'sat-solver', 'proof-assistant', 'type-inferencer'],
  ['syndrome-decoder', 'stabilizer-tracker', 'error-mitigation', 'qubit-scheduler'],
]

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function randInt(r, lo, hi) { return lo + Math.floor(r() * (hi - lo)) }
function randFloat(r, lo, hi) { return (lo + r() * (hi - lo)).toFixed(6) }
function randHex(r, len) { let h = ''; for (let i = 0; i < len; i++) h += Math.floor(r() * 16).toString(16); return h }
function randIp(r) { return `${randInt(r,10,254)}.${randInt(r,0,255)}.${randInt(r,0,255)}.${randInt(r,1,254)}` }

// ── JSON block (~8,000 chars) ──────────────────────────────────────────────────
function makeJson(page) {
  const r = rng(page * 7919)
  const svc = SERVICES[page - 1]
  const topic = TOPICS[page - 1]

  const metrics = {}
  svc.forEach(s => {
    metrics[s] = {
      instance_id: `i-${randHex(r, 12)}`,
      region: ['us-east-1','eu-west-2','ap-southeast-1','us-west-2'][randInt(r,0,4)],
      status: ['healthy','degraded','recovering'][randInt(r,0,3)],
      uptime_seconds: randInt(r, 86400, 31536000),
      cpu_utilization: parseFloat(randFloat(r, 0.12, 0.94)),
      memory_bytes: randInt(r, 1073741824, 68719476736),
      request_count_total: randInt(r, 100000, 999999999),
      error_rate_pct: parseFloat(randFloat(r, 0.001, 2.4)),
      p50_latency_ms: parseFloat(randFloat(r, 0.8, 12.0)),
      p95_latency_ms: parseFloat(randFloat(r, 4.0, 80.0)),
      p99_latency_ms: parseFloat(randFloat(r, 20.0, 300.0)),
      connections_active: randInt(r, 10, 50000),
      queue_depth: randInt(r, 0, 10000),
      cache_hit_rate: parseFloat(randFloat(r, 0.4, 0.99)),
      gc_pause_ms_avg: parseFloat(randFloat(r, 0.1, 80.0)),
      network_rx_bytes: randInt(r, 1000000, 10000000000),
      network_tx_bytes: randInt(r, 1000000, 10000000000),
      disk_iops_read: randInt(r, 100, 100000),
      disk_iops_write: randInt(r, 100, 100000),
      last_heartbeat: new Date(Date.now() - randInt(r, 0, 30000)).toISOString(),
      config: {
        max_connections: randInt(r, 100, 10000),
        timeout_ms: randInt(r, 100, 30000),
        retry_count: randInt(r, 1, 10),
        backoff_multiplier: parseFloat(randFloat(r, 1.2, 3.0)),
        circuit_breaker_threshold: parseFloat(randFloat(r, 0.1, 0.9)),
        rate_limit_rps: randInt(r, 100, 100000),
        tls_version: ['TLSv1.2','TLSv1.3'][randInt(r,0,2)],
        cipher_suite: ['TLS_AES_256_GCM_SHA384','TLS_CHACHA20_POLY1305_SHA256','TLS_AES_128_GCM_SHA256'][randInt(r,0,3)],
        log_level: ['debug','info','warn','error'][randInt(r,0,4)],
        feature_flags: {
          adaptive_batching: r() > 0.5,
          speculative_execution: r() > 0.5,
          read_repair: r() > 0.5,
          bloom_filter: r() > 0.5,
          compression: ['lz4','snappy','zstd','none'][randInt(r,0,4)],
        }
      },
      peers: Array.from({length: randInt(r,2,8)}, () => ({
        id: `i-${randHex(r,12)}`,
        ip: randIp(r),
        lag_ms: parseFloat(randFloat(r, 0, 500)),
        role: ['leader','follower','candidate','observer'][randInt(r,0,4)],
      }))
    }
  })

  const obj = {
    schema_version: '4.7.2',
    snapshot_id: randHex(r, 32),
    timestamp: new Date().toISOString(),
    topic,
    cluster: {
      id: `cluster-${randHex(r,8)}`,
      name: `${topic}-prod-${randInt(r,1,9)}`,
      environment: 'production',
      datacenter: `dc-${['iad','dub','sin','pdx'][randInt(r,0,4)]}-${randInt(r,1,4)}`,
      rack: `rack-${String.fromCharCode(65 + randInt(r,0,8))}${randInt(r,1,20)}`,
      node_count: randInt(r, 3, 256),
      replication_factor: [1,3,5,7][randInt(r,0,4)],
      consistency_level: ['ONE','QUORUM','LOCAL_QUORUM','ALL','SERIAL'][randInt(r,0,5)],
      partition_count: randInt(r, 64, 4096),
      total_storage_bytes: randInt(r, 107374182400, 10995116277760),
      used_storage_bytes: randInt(r, 10737418240, 5497558138880),
    },
    services: metrics,
    alerts: Array.from({length: randInt(r,0,12)}, () => ({
      id: randHex(r, 16),
      severity: ['critical','high','medium','low','info'][randInt(r,0,5)],
      message: [
        `High memory pressure on ${svc[randInt(r,0,4)]}`,
        `Replication lag exceeds threshold`,
        `Certificate expiring in ${randInt(r,1,30)} days`,
        `Unusual traffic spike detected from ${randIp(r)}`,
        `Index rebuild scheduled for partition ${randInt(r,0,4096)}`,
        `Leader election triggered in region us-east-1a`,
      ][randInt(r,0,6)],
      fired_at: new Date(Date.now() - randInt(r, 0, 86400000)).toISOString(),
      acknowledged: r() > 0.6,
    })),
  }

  // expand to fill space with repeated but varied nested structs
  obj.historical_metrics = Array.from({length: 60}, (_, i) => ({
    minute: i,
    cpu: parseFloat(randFloat(r, 0.1, 0.95)),
    mem: parseFloat(randFloat(r, 0.2, 0.98)),
    rps: randInt(r, 100, 50000),
    errors: randInt(r, 0, 200),
    p99: parseFloat(randFloat(r, 5, 500)),
  }))

  return JSON.stringify(obj, null, 2)
}

// ── Python code block (~2,500 chars) ──────────────────────────────────────────
function makePython(page) {
  const r = rng(page * 6271)
  const topic = TOPICS[page - 1]
  const svc = SERVICES[page - 1][0]

  return `\`\`\`python
# ${topic} implementation — ${svc} module
# Auto-generated telemetry processor v${randInt(r,2,9)}.${randInt(r,0,9)}.${randInt(r,0,9)}

import asyncio
import hashlib
import struct
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import AsyncGenerator, Dict, List, Optional, Tuple

SHARD_COUNT = ${randInt(r, 64, 1024)}
REPLICATION_FACTOR = ${randInt(r, 1, 7)}
HEARTBEAT_INTERVAL_MS = ${randInt(r, 50, 5000)}
MAX_BATCH_SIZE = ${randInt(r, 100, 10000)}
BLOOM_CAPACITY = ${randInt(r, 10000, 10000000)}
BLOOM_FPR = ${randFloat(r, 0.0001, 0.05)}

@dataclass
class NodeState:
    node_id: str
    term: int = 0
    voted_for: Optional[str] = None
    log: List[dict] = field(default_factory=list)
    commit_index: int = 0
    last_applied: int = 0
    next_index: Dict[str, int] = field(default_factory=dict)
    match_index: Dict[str, int] = field(default_factory=dict)
    role: str = "follower"
    leader_id: Optional[str] = None
    votes_received: int = 0
    last_heartbeat: float = field(default_factory=time.monotonic)

class ${svc.replace(/-/g, '_').replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase())}:
    def __init__(self, node_id: str, peers: List[str], storage_path: str):
        self.node_id = node_id
        self.peers = peers
        self.storage_path = storage_path
        self.state = NodeState(node_id=node_id)
        self._metrics: Dict[str, int] = defaultdict(int)
        self._pending: asyncio.Queue = asyncio.Queue(maxsize=MAX_BATCH_SIZE)
        self._lock = asyncio.Lock()

    async def propose(self, entry: dict) -> bool:
        async with self._lock:
            if self.state.role != "leader":
                return False
            log_entry = {
                "term": self.state.term,
                "index": len(self.state.log),
                "data": entry,
                "checksum": hashlib.sha256(
                    str(entry).encode()
                ).hexdigest(),
            }
            self.state.log.append(log_entry)
            self._metrics["proposals_total"] += 1
            ack_count = await self._replicate(log_entry)
            if ack_count >= (len(self.peers) // 2) + 1:
                self.state.commit_index = log_entry["index"]
                self._metrics["commits_total"] += 1
                return True
            return False

    async def _replicate(self, entry: dict) -> int:
        tasks = [
            self._send_append_entries(peer, entry)
            for peer in self.peers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return sum(1 for r in results if r is True)

    async def _send_append_entries(self, peer: str, entry: dict) -> bool:
        try:
            payload = struct.pack(">QQ", entry["term"], entry["index"])
            payload += entry["checksum"].encode()
            # network I/O omitted for brevity
            await asyncio.sleep(0)
            self._metrics[f"rpc_to_{peer}"] += 1
            return True
        except Exception as exc:
            self._metrics["rpc_errors"] += 1
            return False

    async def metrics_stream(self) -> AsyncGenerator[dict, None]:
        while True:
            yield {
                "node_id": self.node_id,
                "role": self.state.role,
                "term": self.state.term,
                "log_length": len(self.state.log),
                "commit_index": self.state.commit_index,
                "metrics": dict(self._metrics),
                "ts": time.time(),
            }
            await asyncio.sleep(HEARTBEAT_INTERVAL_MS / 1000)

async def main():
    cluster = [f"node-{i}" for i in range(REPLICATION_FACTOR)]
    nodes = [
        ${svc.replace(/-/g, '_').replace(/(?:^|-)(\w)/g, (_, c) => c.toUpperCase())}(
            node_id=nid,
            peers=[p for p in cluster if p != nid],
            storage_path=f"/var/lib/${svc}/{nid}",
        )
        for nid in cluster
    ]
    await asyncio.gather(*[n.metrics_stream().__anext__() for n in nodes])

if __name__ == "__main__":
    asyncio.run(main())
\`\`\``
}

// ── Rust code block (~2,500 chars) ────────────────────────────────────────────
function makeRust(page) {
  const r = rng(page * 5381)
  const topic = TOPICS[page - 1]
  const svc = SERVICES[page - 1][1]
  const name = svc.replace(/-/g, '_')

  return `\`\`\`rust
//! ${topic} — ${svc} core
//! crate version ${randInt(r,0,9)}.${randInt(r,0,99)}.${randInt(r,0,99)}

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const MAX_ENTRIES: usize = ${randInt(r, 1000, 1000000)};
const EVICTION_RATIO: f64 = ${randFloat(r, 0.05, 0.3)};
const SHARD_BITS: u32 = ${randInt(r, 4, 12)};

#[derive(Debug, Clone)]
pub struct Entry {
    pub key: Vec<u8>,
    pub value: Vec<u8>,
    pub expires_at: Option<Instant>,
    pub access_count: u64,
    pub created_at: u64,
}

pub struct ${name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')} {
    shards: Vec<Arc<RwLock<HashMap<Vec<u8>, Entry>>>>,
    hit_count: Arc<AtomicU64>,
    miss_count: Arc<AtomicU64>,
    eviction_count: Arc<AtomicU64>,
    capacity: usize,
}

impl ${name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')} {
    pub fn new(capacity: usize) -> Self {
        let shard_count = 1 << SHARD_BITS;
        let shards = (0..shard_count)
            .map(|_| Arc::new(RwLock::new(HashMap::with_capacity(capacity / shard_count))))
            .collect();
        Self {
            shards,
            hit_count: Arc::new(AtomicU64::new(0)),
            miss_count: Arc::new(AtomicU64::new(0)),
            eviction_count: Arc::new(AtomicU64::new(0)),
            capacity,
        }
    }

    fn shard_idx(&self, key: &[u8]) -> usize {
        let mut h: u64 = 0xcbf29ce484222325;
        for &b in key {
            h ^= b as u64;
            h = h.wrapping_mul(0x100000001b3);
        }
        (h as usize) & ((1 << SHARD_BITS) - 1)
    }

    pub fn get(&self, key: &[u8]) -> Option<Vec<u8>> {
        let idx = self.shard_idx(key);
        let shard = self.shards[idx].read().unwrap();
        match shard.get(key) {
            Some(entry) if entry.expires_at.map_or(true, |e| e > Instant::now()) => {
                self.hit_count.fetch_add(1, Ordering::Relaxed);
                Some(entry.value.clone())
            }
            _ => {
                self.miss_count.fetch_add(1, Ordering::Relaxed);
                None
            }
        }
    }

    pub fn set(&self, key: Vec<u8>, value: Vec<u8>, ttl: Option<Duration>) {
        let idx = self.shard_idx(&key);
        let mut shard = self.shards[idx].write().unwrap();
        if shard.len() >= MAX_ENTRIES / self.shards.len() {
            self.evict(&mut shard);
        }
        shard.insert(key.clone(), Entry {
            key,
            value,
            expires_at: ttl.map(|t| Instant::now() + t),
            access_count: 0,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        });
    }

    fn evict(&self, shard: &mut HashMap<Vec<u8>, Entry>) {
        let evict_n = (shard.len() as f64 * EVICTION_RATIO) as usize;
        let mut keys: Vec<_> = shard.keys().cloned().collect();
        keys.sort_by_key(|k| shard[k].access_count);
        for k in keys.into_iter().take(evict_n) {
            shard.remove(&k);
            self.eviction_count.fetch_add(1, Ordering::Relaxed);
        }
    }

    pub fn stats(&self) -> HashMap<&'static str, u64> {
        let mut m = HashMap::new();
        m.insert("hits", self.hit_count.load(Ordering::Relaxed));
        m.insert("misses", self.miss_count.load(Ordering::Relaxed));
        m.insert("evictions", self.eviction_count.load(Ordering::Relaxed));
        m
    }
}
\`\`\``
}

// ── SQL block (~2,000 chars) ───────────────────────────────────────────────────
function makeSQL(page) {
  const r = rng(page * 4241)
  const topic = TOPICS[page - 1].replace(/-/g, '_')
  const svc = SERVICES[page - 1][2].replace(/-/g, '_')
  const n1 = randInt(r, 10, 999), n2 = randInt(r, 1000, 9999)
  const pct = randFloat(r, 0.001, 0.05)

  return `\`\`\`sql
-- ${topic} schema and analytics — ${svc}
-- Generated for partition analysis pass ${randHex(r, 8)}

create table if not exists ${topic}_events (
  id          bigserial primary key,
  session_id  uuid not null,
  node_id     text not null,
  event_type  text not null,
  payload     jsonb,
  metadata    jsonb default '{}',
  created_at  timestamptz default now(),
  partition   int generated always as (
                extract(epoch from created_at)::bigint / 86400
              ) stored
);

create index concurrently if not exists ${topic}_events_session_idx
  on ${topic}_events (session_id, created_at desc);

create index concurrently if not exists ${topic}_events_type_part_idx
  on ${topic}_events (event_type, partition)
  where event_type in ('ERROR','TIMEOUT','REJECTION');

create index concurrently if not exists ${topic}_events_payload_idx
  on ${topic}_events using gin(payload jsonb_path_ops);

-- Materialized view for hourly aggregation
create materialized view ${topic}_hourly_stats as
select
  date_trunc('hour', created_at)                        as hour,
  node_id,
  event_type,
  count(*)                                              as event_count,
  count(*) filter (where payload->>'status' = 'error')  as error_count,
  avg((payload->>'latency_ms')::float)                  as avg_latency_ms,
  percentile_cont(0.5)  within group (order by (payload->>'latency_ms')::float) as p50,
  percentile_cont(0.95) within group (order by (payload->>'latency_ms')::float) as p95,
  percentile_cont(0.99) within group (order by (payload->>'latency_ms')::float) as p99,
  sum((payload->>'bytes')::bigint)                      as total_bytes
from ${topic}_events
where created_at > now() - interval '7 days'
group by 1, 2, 3;

create unique index on ${topic}_hourly_stats (hour, node_id, event_type);

-- Anomaly detection query
with baseline as (
  select
    event_type,
    avg(event_count)  as mean,
    stddev(event_count) as sigma
  from ${topic}_hourly_stats
  where hour between now() - interval '7 days' and now() - interval '1 hour'
  group by event_type
),
current_window as (
  select event_type, sum(event_count) as event_count
  from ${topic}_hourly_stats
  where hour >= now() - interval '1 hour'
  group by event_type
)
select
  c.event_type,
  c.event_count,
  b.mean,
  b.sigma,
  round(((c.event_count - b.mean) / nullif(b.sigma, 0))::numeric, 4) as z_score,
  case
    when (c.event_count - b.mean) / nullif(b.sigma, 0) > 3 then 'CRITICAL'
    when (c.event_count - b.mean) / nullif(b.sigma, 0) > 2 then 'WARNING'
    else 'NORMAL'
  end as status
from current_window c
join baseline b using (event_type)
order by abs((c.event_count - b.mean) / nullif(b.sigma, 0)) desc;

-- Retention cleanup (keep ${n1} days hot, archive after ${n2} days)
delete from ${topic}_events
where created_at < now() - interval '${n1} days'
  and id in (
    select id from ${topic}_events
    where created_at < now() - interval '${n1} days'
    limit 10000
  );
\`\`\``
}

// ── Technical prose (~4,000 chars) ────────────────────────────────────────────
function makeProse(page) {
  const topic = TOPICS[page - 1]
  const svc = SERVICES[page - 1]

  const blocks = [
    `The ${topic} subsystem coordinates state across ${svc[0]} and ${svc[1]} through a modified Raft consensus protocol extended with pre-vote phases and leadership transfer semantics. Under nominal conditions, the cluster elects a stable leader within two election timeout periods, each configured at 150–300ms. The leader maintains authority by broadcasting heartbeats at 50ms intervals, piggybacking pending log entries when present. Followers that do not receive a heartbeat within a randomised timeout interval of 150ms–300ms transition to candidate state and solicit votes. A candidate that receives a quorum of votes from cluster members becomes the new leader and immediately broadcasts its authority. The pre-vote extension prevents split-vote cascades by requiring candidates to confirm they can win an election before incrementing their term, significantly reducing unnecessary leader elections in asymmetrically partitioned networks.`,

    `Replication in the ${topic} layer is tightly coupled to the storage engine's write-ahead log. Each mutation accepted by ${svc[0]} is first appended to an in-memory buffer, flushed to a memory-mapped WAL segment, and only then replicated to follower nodes via the append-entries RPC. The WAL segment is structured as a fixed-size header containing a CRC-32 checksum of the entry payload, the log index, the current term, and the byte length of the serialised command. Followers validate the checksum before acknowledging receipt, ensuring that network corruption is caught before data is committed. Upon receiving a quorum of acknowledgements, the leader advances its commit index and notifies the state machine to apply the entry. The state machine processes entries sequentially through a single-threaded apply loop, guaranteeing linearisability of reads served through the leader.`,

    `The ${svc[2]} implements a multi-version concurrency control scheme with snapshot isolation as the default isolation level. Each transaction is assigned a monotonically increasing transaction ID at the time of its first read operation. Read operations observe the state of the database as of the snapshot corresponding to their transaction ID, while write operations create new versions of affected rows tagged with the writing transaction's ID. Garbage collection of obsolete row versions is handled by a background vacuum process that computes the oldest active transaction ID and removes all row versions with IDs below that horizon. Conflicts between concurrent write transactions are detected at commit time using a serialisation conflict graph; transactions that would introduce a cycle into the graph are aborted and rolled back. The implementation achieves high read throughput by eliminating read locks entirely, allowing readers and writers to proceed concurrently without contention.`,

    `Cryptographic integrity of data flowing between ${svc[1]} and ${svc[3]} relies on a hybrid encryption scheme combining X25519 ephemeral Diffie-Hellman key exchange with AES-256-GCM authenticated encryption. For each connection, the initiating party generates a fresh X25519 key pair and transmits the public component in the client hello message. The receiving party performs the key exchange computation, derives a 256-bit symmetric key via HKDF-SHA-512 using the shared secret and a protocol-specific info parameter, and uses the derived key for all subsequent symmetric operations within the session. Each encrypted record is prefixed with a 12-byte random nonce and appended with a 16-byte authentication tag. The nonce is incremented as a big-endian counter after each record to prevent reuse within a session, with session termination mandatory upon counter exhaustion. Forward secrecy is guaranteed because the ephemeral X25519 private key is discarded immediately after key derivation.`,
  ]

  return blocks.join('\n\n')
}

// ── Data table (~3,000 chars) ──────────────────────────────────────────────────
function makeTable(page) {
  const r = rng(page * 3571)
  const svc = SERVICES[page - 1]
  const headers = ['Node ID', 'Region', 'Role', 'CPU%', 'Mem GB', 'RPS', 'P99 ms', 'Errors/min']
  const rows = Array.from({ length: 15 }, () => [
    `i-${randHex(r, 10)}`,
    ['us-east-1a','us-east-1b','eu-west-2a','ap-southeast-1b','us-west-2c'][randInt(r,0,5)],
    ['leader','follower','candidate','observer','standby'][randInt(r,0,5)],
    `${randFloat(r, 5, 95)}`,
    `${randFloat(r, 1.2, 512.0)}`,
    `${randInt(r, 100, 99999)}`,
    `${randFloat(r, 2.0, 480.0)}`,
    `${randInt(r, 0, 250)}`,
  ])

  const sep = `| ${headers.map(h => '-'.repeat(h.length)).join(' | ')} |`
  const head = `| ${headers.join(' | ')} |`
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n')
  return `${head}\n${sep}\n${body}`
}

// ── Links section ─────────────────────────────────────────────────────────────
function makeLinks(voidId, currentPage) {
  const pages = Array.from({ length: 8 }, (_, i) => i + 1).filter(p => p !== currentPage)
  const lines = pages.map(p =>
    `<a href="/void/${voidId}/page/${p}">Continue reading: ${TOPICS[p-1]} analysis (section ${p})</a>`
  )
  return `<nav class="void-nav">\n${lines.join('\n')}\n</nav>`
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateVoidPage(voidId, pageNum) {
  const p = Math.max(1, Math.min(8, pageNum))
  const topic = TOPICS[p - 1]
  const svc = SERVICES[p - 1]

  const json = makeJson(p)
  const python = makePython(p)
  const rust = makeRust(p)
  const sql = makeSQL(p)
  const prose = makeProse(p)
  const table = makeTable(p)
  const links = makeLinks(voidId, p)

  // pad with additional JSON to hit target size
  const r = rng(p * 1999)
  const extraPadding = Array.from({ length: 40 }, (_, i) => {
    const pad = { section: `extended-telemetry-${i}`, values: {} }
    for (let j = 0; j < 30; j++) {
      pad.values[`metric_${j}_${randHex(r,4)}`] = {
        v: randFloat(r, 0, 10000),
        ts: Date.now() - randInt(r, 0, 3600000),
        tags: [`env:prod`, `shard:${randInt(r,0,256)}`, `region:${['us','eu','ap'][randInt(r,0,3)]}`],
      }
    }
    return JSON.stringify(pad, null, 2)
  }).join('\n\n')

  const content = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${topic} — ${svc.join(', ')} — void analysis page ${p}</title>
</head>
<body>

<h1>${topic.toUpperCase()} SYSTEM ANALYSIS — SECTION ${p}/8</h1>
<p>Session: ${voidId} | Generated: ${new Date().toISOString()} | Page: ${p} of 8</p>

<h2>1. Live Cluster Telemetry (JSON)</h2>
<pre><code class="language-json">
${json}
</code></pre>

<h2>2. Implementation Reference</h2>

<h3>2.1 Async Controller (Python)</h3>
${python}

<h3>2.2 Cache Layer (Rust)</h3>
${rust}

<h3>2.3 Analytics Schema (SQL)</h3>
${sql}

<h2>3. Technical Analysis</h2>
${prose}

<h2>4. Node Performance Matrix</h2>

${table}

<h2>5. Extended Telemetry Dump</h2>
<pre><code>
${extraPadding}
</code></pre>

<h2>6. Related Sections</h2>
${links}

</body>
</html>`

  return content
}

export function generateMainVoidPage(voidId) {
  return generateVoidPage(voidId, 1)
}
