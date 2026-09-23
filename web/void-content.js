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

  const rf = [3, 5, 7][randInt(r, 0, 3)]
  const consistencyOpts = ['ONE', 'QUORUM', 'LOCAL_QUORUM', 'ALL', 'SERIAL']

  const metrics = {}
  svc.forEach(s => {
    const p50 = parseFloat(randFloat(r, 0.8, 12.0))
    const p95 = parseFloat((p50 + 3 + r() * 65).toFixed(6))
    const p99 = parseFloat((p95 + 5 + r() * 220).toFixed(6))
    metrics[s] = {
      instance_id: `i-${randHex(r, 12)}`,
      region: ['us-east-1','eu-west-2','ap-southeast-1','us-west-2'][randInt(r,0,4)],
      status: ['healthy','degraded','recovering'][randInt(r,0,3)],
      uptime_seconds: randInt(r, 86400, 31536000),
      cpu_utilization: parseFloat(randFloat(r, 0.12, 0.94)),
      memory_bytes: randInt(r, 1073741824, 68719476736),
      request_count_total: randInt(r, 100000, 999999999),
      error_rate_pct: parseFloat(randFloat(r, 0.001, 2.4)),
      p50_latency_ms: p50,
      p95_latency_ms: p95,
      p99_latency_ms: p99,
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
      replication_factor: rf,
      consistency_level: consistencyOpts[randInt(r, 0, consistencyOpts.length)],
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
const SECTION_TITLES = [
  'Distributed Consensus Protocol Benchmarks',
  'Cryptographic Verification Telemetry',
  'Neural Architecture Evaluation Metrics',
  'Compiler Internals Performance Data',
  'Database Internals Stress Test Results',
  'Network Topology Mapping Dataset',
  'Formal Verification Proof Corpus',
  'Quantum Error Correction Simulations',
]

function makeLinks(voidId, currentPage) {
  const pages = Array.from({ length: 8 }, (_, i) => i + 1).filter(p => p !== currentPage)
  const lines = pages.map(p =>
    `<a href="/data/${voidId}/page/${p}" style="display:block;padding:10px 14px;margin-bottom:6px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#2563eb;text-decoration:none;font-size:0.85rem">Section ${p}: ${SECTION_TITLES[p-1]}</a>`
  )
  return `<nav>\n${lines.join('\n')}\n</nav>`
}

// ── Domain-specific padding — 8 distinct formats, one per section topic ───────
function makeDomainPadding(page, r) {
  const TARGET = 13_000_000 // ~13MB of padding per page
  const records = []
  let size = 0

  if (page === 1) {
    // Raft consensus log entries
    const COMMANDS = ['PUT','DELETE','CAS','LEASE_RENEW','SNAPSHOT_INSTALL','CONFIG_CHANGE','NOOP']
    const ROLES = ['leader','follower','candidate']
    let logIdx = randInt(r, 1000000, 5000000)
    let currentTerm = randInt(r, 1, 50)
    while (size < TARGET) {
      logIdx += randInt(r, 1, 5)
      if (r() < 0.02) currentTerm += 1
      const idx = logIdx
      const term = currentTerm
      const entry = {
        log_index: idx,
        log_term: term,
        entry_type: COMMANDS[randInt(r, 0, COMMANDS.length)],
        leader_id: `node-${randHex(r, 8)}`,
        sender_role: ROLES[randInt(r, 0, ROLES.length)],
        prev_log_index: idx - 1,
        prev_log_term: term,
        commit_index: idx - randInt(r, 1, 50),
        leader_commit: idx - randInt(r, 0, 10),
        entries: Array.from({ length: randInt(r, 1, 12) }, () => ({
          index: idx + randInt(r, 0, 5),
          term,
          command: COMMANDS[randInt(r, 0, COMMANDS.length)],
          key: `/${['config','lease','kv','snapshot','member'][randInt(r,0,5)]}/${randHex(r,16)}`,
          value: randHex(r, 64),
          client_id: randHex(r, 12),
          sequence_num: randInt(r, 0, 100000),
          checksum: `sha256:${randHex(r, 64)}`,
        })),
        heartbeat_ts: Date.now() - randInt(r, 0, 500),
        election_timeout_ms: randInt(r, 150, 300),
        quorum_size: randInt(r, 2, 5),
        votes_granted: Array.from({ length: randInt(r, 2, 5) }, () => `node-${randHex(r, 8)}`),
        cluster_config: {
          members: Array.from({ length: randInt(r, 3, 7) }, () => ({
            id: `node-${randHex(r, 8)}`,
            addr: `${randIp(r)}:${randInt(r, 2379, 2381)}`,
            role: ROLES[randInt(r, 0, ROLES.length)],
            match_index: idx - randInt(r, 0, 100),
            next_index: idx + 1,
          })),
        },
        applied_index: idx - randInt(r, 1, 5),
        snapshot_index: idx - randInt(r, 100, 10000),
        snapshot_term: term - randInt(r, 0, 5),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 2) {
    // TLS session + certificate audit records
    const CIPHERS = ['TLS_AES_256_GCM_SHA384','TLS_CHACHA20_POLY1305_SHA256','TLS_AES_128_GCM_SHA256','TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384']
    const CURVES = ['x25519','secp256r1','secp384r1','x448']
    const VERSIONS = ['TLSv1.2','TLSv1.3']
    while (size < TARGET) {
      const entry = {
        session_id: randHex(r, 32),
        connection_id: randHex(r, 24),
        tls_version: VERSIONS[randInt(r, 0, VERSIONS.length)],
        cipher_suite: CIPHERS[randInt(r, 0, CIPHERS.length)],
        key_exchange: CURVES[randInt(r, 0, CURVES.length)],
        client_addr: `${randIp(r)}:${randInt(r, 1024, 65535)}`,
        server_addr: `${randIp(r)}:443`,
        handshake_ms: parseFloat(randFloat(r, 0.8, 120.0)),
        resumed: r() > 0.7,
        client_hello: {
          random: randHex(r, 64),
          session_id: randHex(r, 32),
          cipher_suites: Array.from({ length: randInt(r, 4, 12) }, () => CIPHERS[randInt(r, 0, CIPHERS.length)]),
          extensions: ['server_name','supported_groups','signature_algorithms','extended_master_secret','session_ticket'],
          sni: `svc-${randHex(r, 6)}.internal`,
          supported_versions: ['TLSv1.3','TLSv1.2'],
        },
        server_hello: {
          random: randHex(r, 64),
          selected_cipher: CIPHERS[randInt(r, 0, CIPHERS.length)],
          key_share_group: CURVES[randInt(r, 0, CURVES.length)],
          server_key_share: randHex(r, 128),
        },
        certificate_chain: Array.from({ length: randInt(r, 2, 4) }, (_, i) => ({
          subject: i === 0 ? `CN=svc-${randHex(r,6)}.internal,O=NSRA,C=US` : `CN=NSRA Intermediate CA ${i},O=NSRA,C=US`,
          issuer: `CN=NSRA Root CA,O=NSRA,C=US`,
          serial: randHex(r, 20),
          not_before: new Date(Date.now() - randInt(r, 0, 86400000 * 365)).toISOString(),
          not_after: new Date(Date.now() + randInt(r, 86400000 * 30, 86400000 * 730)).toISOString(),
          public_key_algo: 'EC',
          public_key_bits: [256,384][randInt(r,0,2)],
          signature_algo: ['ecdsa-with-SHA256','ecdsa-with-SHA384'][randInt(r,0,2)],
          fingerprint_sha256: randHex(r, 64),
          spki_hash: randHex(r, 64),
          ocsp_status: ['good','unknown'][randInt(r,0,2)],
          ct_logs: Array.from({ length: randInt(r, 1, 3) }, () => ({ log_id: randHex(r,32), sct_version: 1, timestamp: Date.now() - randInt(r,0,3600000), signature: randHex(r,96) })),
        })),
        master_secret_hash: randHex(r, 64),
        client_key_share: randHex(r, 128),
        pre_master_secret_hash: randHex(r, 64),
        finished_hash: randHex(r, 64),
        session_ticket: randHex(r, 256),
        alert: r() > 0.95 ? { level: 'warning', description: 'close_notify', ts: Date.now() } : null,
        bytes_rx: randInt(r, 1000, 100000000),
        bytes_tx: randInt(r, 1000, 100000000),
        duration_ms: randInt(r, 10, 3600000),
        recorded_at: new Date(Date.now() - randInt(r, 0, 3600000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 3) {
    // ML training step records
    const OPTIMIZERS = ['adamw','sgd','lamb','adafactor','lion']
    const SCHEDULERS = ['cosine','linear_warmup','polynomial','constant_with_warmup']
    while (size < TARGET) {
      const step = randInt(r, 0, 500000)
      const entry = {
        run_id: `run-${randHex(r, 16)}`,
        step,
        epoch: Math.floor(step / randInt(r, 1000, 10000)),
        optimizer: OPTIMIZERS[randInt(r, 0, OPTIMIZERS.length)],
        scheduler: SCHEDULERS[randInt(r, 0, SCHEDULERS.length)],
        loss: parseFloat(randFloat(r, 0.001, 12.0)),
        loss_scale: parseFloat(randFloat(r, 1.0, 65536.0)),
        grad_norm: parseFloat(randFloat(r, 0.001, 50.0)),
        grad_norm_clipped: parseFloat(randFloat(r, 0.001, 1.0)),
        learning_rate: parseFloat((r() * 0.01).toFixed(8)),
        weight_decay: parseFloat(randFloat(r, 0.0, 0.1)),
        warmup_steps: randInt(r, 100, 10000),
        tokens_per_sec: randInt(r, 1000, 2000000),
        samples_per_sec: parseFloat(randFloat(r, 10.0, 5000.0)),
        batch_size: [32,64,128,256,512,1024,2048][randInt(r,0,7)],
        seq_len: [512,1024,2048,4096,8192][randInt(r,0,5)],
        gpu_utilization: parseFloat(randFloat(r, 0.5, 1.0)),
        gpu_memory_used_gb: parseFloat(randFloat(r, 4.0, 80.0)),
        gpu_memory_total_gb: [40,80,160][randInt(r,0,3)],
        forward_ms: parseFloat(randFloat(r, 5.0, 500.0)),
        backward_ms: parseFloat(randFloat(r, 10.0, 1000.0)),
        optimizer_step_ms: parseFloat(randFloat(r, 1.0, 50.0)),
        layer_metrics: Array.from({ length: randInt(r, 6, 32) }, (_, i) => ({
          name: `transformer.layer.${i}`,
          attn_entropy: parseFloat(randFloat(r, 0.1, 4.0)),
          attn_pattern_sparsity: parseFloat(randFloat(r, 0.0, 1.0)),
          ffn_activation_mean: parseFloat(randFloat(r, -2.0, 2.0)),
          ffn_activation_std: parseFloat(randFloat(r, 0.1, 3.0)),
          grad_mean: parseFloat(randFloat(r, -0.5, 0.5)),
          grad_std: parseFloat(randFloat(r, 0.0, 2.0)),
          weight_norm: parseFloat(randFloat(r, 0.5, 10.0)),
          dead_neurons_pct: parseFloat(randFloat(r, 0.0, 0.5)),
        })),
        eval_metrics: step % 500 === 0 ? {
          perplexity: parseFloat(randFloat(r, 1.5, 200.0)),
          loss: parseFloat(randFloat(r, 0.001, 10.0)),
          accuracy: parseFloat(randFloat(r, 0.3, 0.99)),
          bleu: parseFloat(randFloat(r, 0.0, 0.9)),
          rouge_l: parseFloat(randFloat(r, 0.0, 0.95)),
        } : null,
        checkpoint_saved: r() > 0.95,
        timestamp: new Date(Date.now() - randInt(r, 0, 86400000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 4) {
    // Compiler IR / optimization pass records
    const PASSES = ['mem2reg','instcombine','gvn','sccp','loop-unroll','vectorize','inline','dce','licm','reassociate','sroa','tailcallelim','simplifycfg','adce']
    const ARCHS = ['x86_64','aarch64','riscv64','wasm32']
    while (size < TARGET) {
      const fnSize = randInt(r, 50, 5000)
      const entry = {
        module_id: randHex(r, 16),
        function_name: `_ZN${randInt(r,2,20)}${['consensus','crypto','scheduler','allocator','verifier'][randInt(r,0,5)]}${randInt(r,2,15)}${['process','execute','commit','validate','resolve'][randInt(r,0,5)]}Ev`,
        source_file: `src/${['consensus','storage','network','crypto','runtime'][randInt(r,0,5)]}/${randHex(r,6)}.cpp`,
        target_arch: ARCHS[randInt(r, 0, ARCHS.length)],
        opt_level: ['O0','O1','O2','O3','Os','Oz'][randInt(r, 0, 6)],
        ir_size_before: fnSize,
        ir_size_after: Math.max(1, fnSize - randInt(r, 0, fnSize)),
        passes_run: Array.from({ length: randInt(r, 4, 18) }, () => ({
          name: PASSES[randInt(r, 0, PASSES.length)],
          changed: r() > 0.4,
          duration_us: randInt(r, 1, 50000),
          instructions_before: randInt(r, 10, 1000),
          instructions_after: randInt(r, 5, 1000),
          loops_unrolled: randInt(r, 0, 8),
          vectorized_loops: randInt(r, 0, 4),
          inlined_calls: randInt(r, 0, 20),
          dead_instructions_removed: randInt(r, 0, 50),
        })),
        register_allocation: {
          algorithm: ['greedy','basic','fast','pbqp'][randInt(r,0,4)],
          spills: randInt(r, 0, 200),
          reloads: randInt(r, 0, 200),
          virtual_regs: randInt(r, 10, 5000),
          physical_regs_used: randInt(r, 1, 32),
          stack_frame_bytes: randInt(r, 0, 65536),
        },
        code_size_bytes: randInt(r, 64, 524288),
        stack_size_bytes: randInt(r, 0, 65536),
        has_unwind_info: r() > 0.5,
        debug_info_size: randInt(r, 0, 131072),
        relocations: randInt(r, 0, 1000),
        inline_cost: randInt(r, 0, 500),
        loop_depth_max: randInt(r, 0, 8),
        cyclomatic_complexity: randInt(r, 1, 100),
        compile_ms: parseFloat(randFloat(r, 0.1, 2000.0)),
        memory_peak_mb: parseFloat(randFloat(r, 1.0, 4096.0)),
        timestamp: new Date(Date.now() - randInt(r, 0, 86400000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 5) {
    // PostgreSQL WAL / transaction records
    const OPS = ['INSERT','UPDATE','DELETE','HOT_UPDATE','LOCK','COMMIT','ABORT','CHECKPOINT_ONLINE','CHECKPOINT_SHUTDOWN','HEAP_INPLACE']
    while (size < TARGET) {
      const lsn = randInt(r, 0, 0xFFFFFFFF)
      const entry = {
        lsn: `${(lsn >>> 16).toString(16).toUpperCase().padStart(8,'0')}/${(lsn & 0xFFFF).toString(16).toUpperCase().padStart(8,'0')}`,
        xid: randInt(r, 100000, 4294967295),
        op: OPS[randInt(r, 0, OPS.length)],
        rel_filenode: randInt(r, 10000, 9999999),
        rel_oid: randInt(r, 10000, 9999999),
        fork: ['main','fsm','vm','init'][randInt(r,0,4)],
        block_num: randInt(r, 0, 100000),
        offset_in_block: randInt(r, 0, 8192),
        tuple_id: `(${randInt(r,0,100000)},${randInt(r,1,200)})`,
        old_xmin: randInt(r, 100000, 4294967295),
        new_xmin: randInt(r, 100000, 4294967295),
        cmin: randInt(r, 0, 10),
        flags: randInt(r, 0, 255),
        data_length: randInt(r, 0, 8096),
        data: randHex(r, randInt(r, 32, 512)),
        toasted_oids: r() > 0.9 ? Array.from({ length: randInt(r,1,4) }, () => randInt(r, 10000, 9999999)) : [],
        multi_xact_id: r() > 0.95 ? randInt(r, 1, 1000000) : null,
        lsn_end: `${((lsn + randInt(r,100,10000)) >>> 16).toString(16).toUpperCase().padStart(8,'0')}/${((lsn + randInt(r,100,10000)) & 0xFFFF).toString(16).toUpperCase().padStart(8,'0')}`,
        timeline: randInt(r, 1, 5),
        wal_segment: `${randInt(r,0,99).toString().padStart(8,'0')}`,
        checkpoint: r() > 0.99 ? { redo_lsn: `${randHex(r,8)}/${randHex(r,8)}`, time: new Date().toISOString(), shutdown: r() > 0.5, wal_bytes: randInt(r, 1000000, 10000000000) } : null,
        recorded_at: new Date(Date.now() - randInt(r, 0, 3600000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 6) {
    // NetFlow v9 / IPFIX flow records
    const PROTOS = [6, 17, 1, 89, 132] // TCP, UDP, ICMP, OSPF, SCTP
    const PROTO_NAMES = { 6: 'TCP', 17: 'UDP', 1: 'ICMP', 89: 'OSPF', 132: 'SCTP' }
    const TCP_FLAGS = ['SYN','SYN-ACK','ACK','FIN','RST','PSH-ACK','SYN-PSH-ACK','FIN-ACK']
    const DSCP = ['CS0','CS1','AF11','AF12','AF21','AF22','CS3','EF']
    while (size < TARGET) {
      const proto = PROTOS[randInt(r, 0, PROTOS.length)]
      const entry = {
        flow_id: randHex(r, 24),
        exporter_ip: randIp(r),
        template_id: randInt(r, 256, 1023),
        sampling_interval: randInt(r, 1, 1000),
        src_ip: randIp(r),
        dst_ip: randIp(r),
        src_port: randInt(r, 1024, 65535),
        dst_port: randInt(r, 1, 65535),
        proto,
        proto_name: PROTO_NAMES[proto] || 'UNKNOWN',
        src_as: randInt(r, 1, 65535),
        dst_as: randInt(r, 1, 65535),
        src_vlan: randInt(r, 0, 4095),
        dst_vlan: randInt(r, 0, 4095),
        input_ifindex: randInt(r, 1, 512),
        output_ifindex: randInt(r, 1, 512),
        tcp_flags: proto === 6 ? TCP_FLAGS[randInt(r, 0, TCP_FLAGS.length)] : null,
        dscp: DSCP[randInt(r, 0, DSCP.length)],
        ecn: randInt(r, 0, 3),
        packets: randInt(r, 1, 10000000),
        bytes: randInt(r, 40, 10000000000),
        start_ms: Date.now() - randInt(r, 0, 3600000),
        end_ms: Date.now() - randInt(r, 0, 60000),
        duration_ms: randInt(r, 1, 3600000),
        inter_arrival_mean_us: parseFloat(randFloat(r, 0.1, 10000.0)),
        inter_arrival_std_us: parseFloat(randFloat(r, 0.0, 5000.0)),
        pkt_size_mean: parseFloat(randFloat(r, 40.0, 1500.0)),
        pkt_size_std: parseFloat(randFloat(r, 0.0, 500.0)),
        retransmits: proto === 6 ? randInt(r, 0, 100) : null,
        out_of_order: proto === 6 ? randInt(r, 0, 50) : null,
        rst_count: proto === 6 ? randInt(r, 0, 10) : null,
        bgp_next_hop: randIp(r),
        mpls_label_stack: Array.from({ length: randInt(r,0,4) }, () => randInt(r, 0, 1048575)),
        geo: { src_country: ['US','DE','JP','SG','BR'][randInt(r,0,5)], dst_country: ['US','GB','NL','IN','AU'][randInt(r,0,5)] },
        verdict: ['ALLOW','DENY','NAT','REDIRECT'][randInt(r,0,4)],
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else if (page === 7) {
    // SMT / formal verification proof step records
    const TACTICS = ['apply','rewrite','induction','case_split','contradiction','assumption','simp','omega','ring','linarith','norm_num','decide','exact','use','constructor','ext']
    const THEORIES = ['UF','LIA','NIA','BV','FP','Array','Strings','Sets']
    while (size < TARGET) {
      const depth = randInt(r, 0, 50)
      const entry = {
        proof_id: randHex(r, 20),
        step_id: randInt(r, 0, 100000),
        depth,
        tactic: TACTICS[randInt(r, 0, TACTICS.length)],
        theory: THEORIES[randInt(r, 0, THEORIES.length)],
        status: ['proved','failed','partial','timeout','unknown'][randInt(r, 0, 5)],
        goal_before: `∀ (${Array.from({length:randInt(r,1,5)},(_,i)=>String.fromCharCode(97+i)).join(' ')}: ${['Nat','Int','Bool','List α','Set α','Type'][randInt(r,0,6)]}), ${['n + 0 = n','∃ m, m > n ∧ m < n + 10','P ∨ ¬P','(a ++ b).length = a.length + b.length','f ∘ g = id → g ∘ f = id'][randInt(r,0,5)]}`,
        goal_after: r() > 0.7 ? 'No goals' : `${randInt(r,1,5)} goals remaining`,
        hypotheses: Array.from({ length: randInt(r, 0, 8) }, () => ({
          name: `h${randInt(r, 0, 100)}`,
          type: ['n > 0','∀ x, P x → Q x','a ≤ b','f a = f b → a = b','Decidable P'][randInt(r,0,5)],
        })),
        instantiations: Array.from({ length: randInt(r, 0, 6) }, () => ({
          var: String.fromCharCode(97 + randInt(r, 0, 5)),
          term: `${randInt(r, 0, 1000)}`,
        })),
        lemma_refs: Array.from({ length: randInt(r, 0, 5) }, () => `Mathlib.${['Algebra','Topology','NumberTheory','Analysis','Logic'][randInt(r,0,5)]}.${randHex(r,8)}`),
        solver_stats: {
          conflicts: randInt(r, 0, 100000),
          decisions: randInt(r, 0, 1000000),
          propagations: randInt(r, 0, 5000000),
          restarts: randInt(r, 0, 10000),
          learned_clauses: randInt(r, 0, 100000),
          time_ms: randInt(r, 0, 60000),
          memory_mb: parseFloat(randFloat(r, 1.0, 4096.0)),
        },
        node_count: randInt(r, 0, 1000000),
        term_size: randInt(r, 1, 100000),
        timestamp: new Date(Date.now() - randInt(r, 0, 86400000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }

  } else {
    // page === 8: Quantum error correction syndrome records
    const CODES = ['surface','color','repetition','steane','shor','bacon-shor','toric','hypergraph-product']
    const BASES = ['X','Z','Y']
    const DECODERS = ['mwpm','union-find','blossom','renormalization-group','neural','belief-propagation']
    while (size < TARGET) {
      const n = randInt(r, 9, 4096)
      const entry = {
        experiment_id: randHex(r, 20),
        cycle: randInt(r, 0, 1000000),
        code: CODES[randInt(r, 0, CODES.length)],
        n_data_qubits: n,
        n_ancilla_qubits: Math.floor(n / 2),
        distance: [3,5,7,9,11,13,15][randInt(r,0,7)],
        decoder: DECODERS[randInt(r, 0, DECODERS.length)],
        physical_error_rate: parseFloat(randFloat(r, 0.0001, 0.02)),
        logical_error_rate: parseFloat((r() * 0.001).toFixed(8)),
        threshold_estimate: parseFloat(randFloat(r, 0.005, 0.02)),
        syndrome_measurements: Array.from({ length: randInt(r, 8, 128) }, () => ({
          qubit_id: randInt(r, 0, n - 1),
          basis: BASES[randInt(r, 0, BASES.length)],
          result: randInt(r, 0, 1),
          ancilla_id: randInt(r, 0, Math.floor(n / 2) - 1),
          readout_fidelity: parseFloat(randFloat(r, 0.85, 0.9999)),
          t1_us: parseFloat(randFloat(r, 10.0, 500.0)),
          t2_us: parseFloat(randFloat(r, 5.0, 200.0)),
          gate_error: parseFloat(randFloat(r, 0.0001, 0.02)),
        })),
        detected_errors: Array.from({ length: randInt(r, 0, 20) }, () => ({
          type: ['X','Z','Y','leakage'][randInt(r,0,4)],
          qubit: randInt(r, 0, n - 1),
          cycle_detected: randInt(r, 0, 100),
          correction_applied: r() > 0.5,
          correction_qubit: randInt(r, 0, n - 1),
        })),
        decoding_time_us: parseFloat(randFloat(r, 1.0, 10000.0)),
        logical_pauli_frame: { X: randInt(r,0,1), Z: randInt(r,0,1) },
        reset_fidelity: parseFloat(randFloat(r, 0.95, 0.9999)),
        circuit_depth: randInt(r, 10, 500),
        two_qubit_gate_count: randInt(r, 10, 5000),
        timestamp: new Date(Date.now() - randInt(r, 0, 86400000)).toISOString(),
      }
      const s = JSON.stringify(entry, null, 2)
      records.push(s)
      size += s.length
    }
  }

  return records.join('\n\n')
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

  const r = rng(p * 1999)
  const extraPadding = makeDomainPadding(p, r)

  const sectionTitles = [
    'Distributed Consensus Protocol Benchmarks',
    'Cryptographic Verification Telemetry',
    'Neural Architecture Evaluation Metrics',
    'Compiler Internals Performance Data',
    'Database Internals Stress Test Results',
    'Network Topology Mapping Dataset',
    'Formal Verification Proof Corpus',
    'Quantum Error Correction Simulations',
  ]

  const content = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NSRA Dataset ${voidId.toUpperCase()} — Section ${p}: ${sectionTitles[p-1]}</title>
<meta name="description" content="Neural Systems Research Archive: ${sectionTitles[p-1]}. Peer-reviewed benchmark data, implementation references, and performance matrices.">
</head>
<body>
<header style="font-family:ui-monospace,monospace;font-size:0.8rem;color:#4b5563;padding:12px 24px;border-bottom:1px solid #e5e7eb;background:#f9fafb">
  Neural Systems Research Archive &mdash; Dataset ${voidId.toUpperCase()} &mdash; Section ${p} of 8
  &nbsp;&nbsp;|&nbsp;&nbsp; DOI: 10.5281/nsra.${voidId}.${p}
  &nbsp;&nbsp;|&nbsp;&nbsp; Published: 2024 &nbsp;&nbsp;|&nbsp;&nbsp; License: CC BY 4.0
</header>

<main style="max-width:960px;margin:0 auto;padding:40px 24px;font-family:Georgia,serif;color:#1f2937">

<h1 style="font-size:1.6rem;font-weight:400;color:#111827;margin-bottom:8px">Section ${p}: ${sectionTitles[p-1]}</h1>
<p style="color:#6b7280;font-size:0.85rem;margin-bottom:16px;font-family:ui-monospace,monospace">
  Corpus ID: ${voidId} &nbsp;&middot;&nbsp; Section: ${p}/8 &nbsp;&middot;&nbsp; Retrieved: ${new Date().toISOString()} &nbsp;&middot;&nbsp; Format: HTML/JSON/Code
</p>
<p style="font-size:0.88rem;line-height:1.8;color:#4b5563;margin-bottom:32px">
  This section is part of an eight-section corpus. The companion sections —
  ${sectionTitles.map((t, i) => i + 1 !== p ? `<a href="/data/${voidId}/page/${i + 1}" style="color:#2563eb;text-decoration:none">${t}</a>` : null).filter(Boolean).join(', ')} —
  are available at their respective endpoints. Cross-section integrity checksums are published at
  <a href="/api/validate/${p}?corpus=${voidId}" style="color:#2563eb;text-decoration:none">/api/validate/${p}?corpus=${voidId}</a>.
</p>

<section>
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">1. Production Telemetry Snapshot</h2>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.78rem;line-height:1.5"><code>${json}</code></pre>
</section>

<section style="margin-top:40px">
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">2. Reference Implementation</h2>

<h3 style="font-size:0.95rem;color:#4b5563;margin-bottom:12px">2.1 Async Processing Layer (Python 3.11)</h3>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.78rem;line-height:1.5"><code>${python}</code></pre>

<h3 style="font-size:0.95rem;color:#4b5563;margin:24px 0 12px">2.2 High-Performance Cache Layer (Rust 1.75)</h3>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.78rem;line-height:1.5"><code>${rust}</code></pre>

<h3 style="font-size:0.95rem;color:#4b5563;margin:24px 0 12px">2.3 Analytics Schema & Anomaly Detection (PostgreSQL 16)</h3>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.78rem;line-height:1.5"><code>${sql}</code></pre>
</section>

<section style="margin-top:40px">
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">3. Technical Analysis & Discussion</h2>
<div style="font-size:0.95rem;line-height:1.9;color:#374151">${prose}</div>
</section>

<section style="margin-top:40px">
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">4. Node Performance Matrix</h2>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.8rem">${table}</pre>
</section>

<section style="margin-top:40px">
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">5. Extended Telemetry Corpus (Raw)</h2>
<pre style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:20px;overflow:auto;font-size:0.72rem;line-height:1.4;max-height:none"><code>${extraPadding}</code></pre>
</section>

<section style="margin-top:40px">
<h2 style="font-size:1.1rem;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:20px">6. Related Dataset Sections</h2>
${links}
</section>

</main>

<footer style="font-family:ui-monospace,monospace;font-size:0.72rem;color:#9ca3af;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;margin-top:60px">
  Neural Systems Research Archive &middot; Dataset ${voidId.toUpperCase()} &middot; Section ${p}/8 &middot; CC BY 4.0 &middot; 2024
</footer>

</body>
</html>`

  return content
}

export function generateMainVoidPage(voidId) {
  return generateVoidPage(voidId, 1)
}
