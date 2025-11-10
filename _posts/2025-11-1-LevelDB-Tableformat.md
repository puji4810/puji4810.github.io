---
layout:     post
title:      "LevelDB Table format"
subtitle:   "The Design of LevelDB's Table Format "
date:       2025-11-1 00:00:00
author:     "Puji"
header-img: "img/hero.svg"
catalog: true
tags:
    - LevelDB
    - Prism
    - KV 
summary: "Overview of WriteBatch layout and record encoding for LevelDB table operations."
---

<!-- more -->
<div class="mermaid">
---
config:
  packet:
    bitsPerRow: 32
---
packet-beta
0-63: "sequence: fixed64"
64-95: "count: fixed32"
96-255: "data: record[count]"
</div>

<div class="mermaid">
---
config:
  packet:
    bitsPerRow: 32
---
packet-beta
0-7: "type: kTypeValue"
8-15: "key_len: varint32"
16-47: "key_data: uint8[key_len]"
48-55: "value_len: varint32"
56-87: "value_data: uint8[value_len]"
</div>

<div class="mermaid">
---
config:
  packet:
    bitsPerRow: 32
---
packet-beta
0-7: "type: kTypeDeletion"
8-15: "key_len: varint32"
16-47: "key_data: uint8[key_len]"
</div>



```plaintext
WriteBatch::rep_ :=
   sequence: fixed64
   count: fixed32
   data: record[count]
record :=
   kTypeValue varstring varstring         |
   kTypeDeletion varstring
varstring :=
   len: varint32
   data: uint8[len]
```



`PUT` and `DELETE` have different `record` structure.

We will use `WriteBatch` as the actuall format in our `WAL`.

- `sequence` : 8 bytes, the index of sequence
- `count` : 4 bytes, the count of operations
- `record` : the record of `PUT` and `DELETE` opreation
  - kTypeValue varstring(key) varstring(value) (for `PUT`)
  - kTypeDeletion varstring(key) (for `DELETION`)
  - > Here, `varint32` and `uint8[len]` make the `varstring`, which can be understanded as [key_len key_value] or [data_len data_value]
