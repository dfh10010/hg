// 黄果短剧自建 Spider（基于官方 JSON 接口）
// 适用于 FongMi / 影视仓 / TVBox（type:3 + QuickJS 模组）
// 接口来源：你提供的截图 + 黄果官方 JSON

const API = 'https://huangguo-parser.13681235735.workers.dev';
const SITE = 'https://huangguoai.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 2026-11 后 Worker 反爬签名
const HG_SECRET = 'hg-dx150-2026-11-w7Qm4pLz';
const HG_ORIGIN = 'https://drdrdrrddrdr.github.io';
const HG_REFERER = 'https://drdrdrrddrdr.github.io/huangguo-web/';

function hgRotr(x, n) { return (x >>> n) | (x << (32 - n)); }
function hgUtf8Bytes(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0xD800 || c >= 0xE000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else {
      i++;
      const c2 = s.charCodeAt(i);
      const cp = 0x10000 + ((c & 0x3FF) << 10) + (c2 & 0x3FF);
      out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }
  }
  return out;
}
function hgSha256(bytes) {
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const msg = bytes.slice(0);
  const len = bytes.length;
  const bitLo = (len * 8) >>> 0;
  const bitHi = Math.floor(len / 536870912) >>> 0;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  msg.push((bitHi >>> 24) & 255, (bitHi >>> 16) & 255, (bitHi >>> 8) & 255, bitHi & 255);
  msg.push((bitLo >>> 24) & 255, (bitLo >>> 16) & 255, (bitLo >>> 8) & 255, bitLo & 255);
  const W = new Array(64);
  for (let off = 0; off < msg.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = ((msg[off + i * 4] << 24) | (msg[off + i * 4 + 1] << 16) | (msg[off + i * 4 + 2] << 8) | msg[off + i * 4 + 3]) | 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = hgRotr(W[i - 15], 7) ^ hgRotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = hgRotr(W[i - 2], 17) ^ hgRotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = hgRotr(e, 6) ^ hgRotr(e, 11) ^ hgRotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = hgRotr(a, 2) ^ hgRotr(a, 13) ^ hgRotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = [];
  for (let i = 0; i < 8; i++) out.push((H[i] >>> 24) & 255, (H[i] >>> 16) & 255, (H[i] >>> 8) & 255, H[i] & 255);
  return out;
}
function hgHmacHex(keyStr, msgStr) {
  let key = hgUtf8Bytes(keyStr);
  if (key.length > 64) key = hgSha256(key);
  while (key.length < 64) key.push(0);
  const ipad = [], opad = [];
  for (let i = 0; i < 64; i++) { ipad.push(key[i] ^ 0x36); opad.push(key[i] ^ 0x5c); }
  const inner = hgSha256(ipad.concat(hgUtf8Bytes(msgStr)));
  const outer = hgSha256(opad.concat(inner));
  let hex = '';
  for (let i = 0; i < outer.length; i++) {
    const t = outer[i].toString(16);
    hex += t.length === 1 ? '0' + t : t;
  }
  return hex;
}

function reqJson(url, method, body) {
  const u = String(url || '');
  const signed = u.indexOf(API) === 0;
  const pathWithQuery = signed ? u.slice(API.length) : '';
  const shifts = signed ? [0, -1, 1] : [0];
  for (let i = 0; i < shifts.length; i++) {
    const headers = {
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
      'Referer': SITE + '/'
    };
    if (signed) {
      const win = Math.floor(Date.now() / 1000 / 300) + shifts[i];
      headers['Origin'] = HG_ORIGIN;
      headers['Referer'] = HG_REFERER;
      headers['X-HG-Ts'] = String(win * 300);
      headers['X-HG-Sig'] = hgHmacHex(HG_SECRET, win + '\n' + pathWithQuery);
    }
    try {
      const opts = { method: method || 'get', headers: headers, timeout: 15000 };
      if (body !== undefined && body !== null) {
        const payload = (typeof body === 'string') ? body : JSON.stringify(body);
        opts.headers['Content-Type'] = 'application/json';
        opts.body = payload;
        opts.data = payload;
      }
      const r = req(u, opts);
      if (!r || !r.content) continue;
      const code = Number(r.code);
      if (code === 200) {
        try { return JSON.parse(String(r.content)); } catch (e) { return null; }
      }
      if (!signed || (code !== 403 && code !== 401)) return null;
    } catch (e) {}
  }
  return null;
}

function getJson(path) {
  return reqJson(API + path);
}

function getSiteJson(path) {
  return reqJson(SITE + path);
}

function picOf(u) {
  u = String(u || '');
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return API + '/media?url=' + encodeURIComponent(u);
  return API + u;
}

function toVod(x) {
  return {
    vod_id: String(x.vod_id || x.id || ''),
    vod_name: String(x.vod_name || x.title || ''),
    vod_pic: picOf(x.vod_pic || x.cover),
    vod_remarks: String(x.vod_remarks || x.remarks || (x.episode_count ? x.episode_count + '集' : '')),
    vod_year: String(x.vod_year || ''),
    vod_score: String(x.vod_score || x.score || ''),
    vod_content: String(x.vod_desc || x.description || ''),
    type_name: Array.isArray(x.vod_tags) ? x.vod_tags.join(' / ') : String(x.vod_type_name || '')
  };
}

const CLASSES = [
  { type_id: 'ai-duanju', type_name: 'AI短剧' },
  { type_id: 'ai-manju', type_name: 'AI漫剧' },
  { type_id: 'chigua', type_name: '吃瓜·全部' },
  { type_id: 'chigua:remen', type_name: '吃瓜·热门' },
  { type_id: 'chigua:yuanchuang', type_name: '吃瓜·AI原创' },
  { type_id: 'rank:hot', type_name: '热播榜' },
  { type_id: 'rank:recommend', type_name: '推荐榜' },
  { type_id: 'rank:potential', type_name: '潜力榜' }
];

const SORTS = [
  { n: '最新更新', v: 'latest' },
  { n: '当前热播', v: 'hot' },
  { n: '独家原创', v: 'original' },
  { n: '随机推荐', v: 'random' }
];

const SORT_FILTER = [{ key: 'sort', name: '排序', value: SORTS.map(s => ({ n: s.n, v: s.v })) }];
const FILTERS = {
  'ai-duanju': SORT_FILTER,
  'ai-manju': SORT_FILTER
};

function home(filter) {
  return JSON.stringify({
    class: CLASSES,
    filters: FILTERS
  });
}

function homeVod() {
  const d = getJson('/api/all');
  let list = [];
  if (d && d.sections && Array.isArray(d.sections.recommend)) {
    list = d.sections.recommend.map(toVod);
  }
  return JSON.stringify({ list });
}

function category(tid, pg, filter, extend) {
  pg = Number(pg) || 1;
  let url = '';
  let items = [];

  if (tid.startsWith('rank:')) {
    const type = tid.split(':')[1];
    url = '/api/ranks/' + type + '?page=' + pg + '&size=20';
    const d = getJson(url);
    if (d && Array.isArray(d.list)) items = d.list;
    else if (d && Array.isArray(d.data)) items = d.data;
  } else if (tid.startsWith('chigua')) {
    const cate = tid.includes(':') ? tid.split(':')[1] : 'all';
    // 优先用源站 posts 接口
    const d = getSiteJson('/api/posts?cate=' + cate + '&page=' + pg + '&size=50');
    if (d && Array.isArray(d.data)) {
      items = d.data.map(x => ({
        id: 'archives_' + (x.id || ''),
        title: x.title || '',
        cover: x.cover || '',
        remarks: x.created_at || ''
      }));
    } else {
      // 兜底 Worker
      const w = getJson('/api/posts?cate=' + cate + '&page=' + pg + '&size=50');
      if (w && Array.isArray(w.list)) items = w.list;
    }
  } else {
    const sort = (extend && extend.sort) || 'latest';
    url = '/api/videos/category/' + tid + '?page=' + pg + '&size=50&sort=' + sort;
    const d = getJson(url);
    if (d && Array.isArray(d.list)) items = d.list;
    else if (d && Array.isArray(d.data)) items = d.data;
    else if (d && d.videos && Array.isArray(d.videos)) items = d.videos;
  }

  const list = items.map(toVod);
  return JSON.stringify({
    page: pg,
    pagecount: 999,
    limit: 50,
    total: 99999,
    list
  });
}

function detail(id) {
  id = String(id || '');
  // 吃瓜帖
  if (id.startsWith('archives_')) {
    const pid = id.replace('archives_', '');
    const d = getSiteJson('/api/posts/' + pid);
    if (!d || !d.data) return JSON.stringify({ list: [] });
    const data = d.data;
    let playUrl = '';
    // 尝试从 playback 拿视频
    const pb = reqJson(SITE + '/api/posts/' + pid + '/playback', 'post', {});
    if (pb && pb.data && Array.isArray(pb.data.videos) && pb.data.videos.length) {
      playUrl = pb.data.videos.map((v, i) => (i + 1) + '$' + (v.url || v.video_url || '')).join('#');
    } else if (data.video_url) {
      playUrl = '1$' + data.video_url;
    }
    return JSON.stringify({
      list: [{
        vod_id: id,
        vod_name: data.title || ('吃瓜' + pid),
        vod_pic: picOf(data.cover),
        vod_content: data.desc || data.content || '',
        vod_remarks: data.created_at || '',
        vod_play_from: '黄果吃瓜',
        vod_play_url: playUrl || '1$'
      }]
    });
  }

  // 普通视频
  const d = getJson('/api/videos/' + id);
  if (!d) return JSON.stringify({ list: [] });
  const eps = (d.episodes || []).map(e => {
    const num = e.ep_num || e.ep || 1;
    return num + '$' + id + '#' + num;
  }).join('#');
  return JSON.stringify({
    list: [{
      vod_id: id,
      vod_name: d.title || '',
      vod_pic: picOf(d.cover),
      vod_content: d.description || '',
      vod_remarks: d.remarks || '',
      vod_play_from: '黄果',
      vod_play_url: eps || ('1$' + id + '#1')
    }]
  });
}

function play(flag, id, flags) {
  id = String(id || '');
  // 已经是完整 m3u8 地址的情况（吃瓜直链）
  if (/^https?:\/\//i.test(id) && (id.includes('.m3u8') || id.includes('auth_key'))) {
    return JSON.stringify({ parse: 0, url: id });
  }
  // 普通：视频ID#集数
  const parts = id.split('#');
  const vid = parts[0];
  const ep = parts[1] || '1';
  const d = getJson('/api/play?url=' + encodeURIComponent(vid) + '&ep=' + ep);
  let url = '';
  if (d) {
    url = d.url || d.proxy || (d.data && (d.data.video_url || d.data.url)) || '';
  }
  // 优先原始 m3u8（完整片源），代理只作兜底
  if (url) {
    return JSON.stringify({ parse: 0, url });
  }
  return JSON.stringify({ parse: 0, url: '' });
}

function search(wd, quick, pg) {
  pg = Number(pg) || 1;
  const d = getJson('/api/search?q=' + encodeURIComponent(wd) + '&page=' + pg + '&size=50');
  let items = [];
  if (d) {
    if (Array.isArray(d.list)) items = d.list;
    else if (Array.isArray(d.data)) items = d.data;
  }
  return JSON.stringify({
    page: pg,
    pagecount: 99,
    list: items.map(toVod)
  });
}

export default { home, homeVod, category, detail, play, search };
