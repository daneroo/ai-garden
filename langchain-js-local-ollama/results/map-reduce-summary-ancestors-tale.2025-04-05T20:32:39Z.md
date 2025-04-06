# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".
It is invoked repeatedly on chunks of text.

The summaries themselves are then concatenated.
This is the reduction part.

This summarization is repeated until a sufficiently concise summary is reached.



## Parameters

  - sourceNickname: ancestors-tale.epub
  - modelName: llama3.1:8b
  - chunkSize: 8000
Summarizing ancestors-tale.epub

## Level 0 Summarization

- Level 0 input summary:
  - 217 docs, length: 2096.84 kB
  - split into 432 chunks, length: 2097.35 kB

- Level 0 progress:
  - Level 0 Chunk 0 (1.63s rate:15.95b/s):
  - Level 0 Chunk 1 (5.01s rate:163.47b/s):
  - Level 0 Chunk 2 (14.53s rate:547.42b/s):
  - Level 0 Chunk 3 (8.40s rate:125.60b/s):
  - Level 0 Chunk 4 (3.92s rate:226.02b/s):
  - Level 0 Chunk 5 (14.04s rate:462.68b/s):
  - Level 0 Chunk 6 (14.25s rate:355.79b/s):
  - Level 0 Chunk 7 (20.84s rate:370.44b/s):
  - Level 0 Chunk 8 (21.27s rate:348.75b/s):
  - Level 0 Chunk 9 (18.25s rate:405.26b/s):
  - Level 0 Chunk 10 (16.25s rate:258.65b/s):
  - Level 0 Chunk 11 (20.68s rate:373.31b/s):
  - Level 0 Chunk 12 (5.56s rate:146.04b/s):
  - Level 0 Chunk 13 (19.51s rate:375.24b/s):
  - Level 0 Chunk 14 (20.04s rate:391.27b/s):
  - Level 0 Chunk 15 (20.36s rate:376.62b/s):
  - Level 0 Chunk 16 (18.14s rate:258.27b/s):
  - Level 0 Chunk 17 (31.63s rate:243.69b/s):
  - Level 0 Chunk 18 (21.20s rate:372.97b/s):
  - Level 0 Chunk 19 (21.80s rate:342.11b/s):
  - Level 0 Chunk 20 (20.28s rate:385.50b/s):
  - Level 0 Chunk 21 (20.39s rate:373.91b/s):
  - Level 0 Chunk 22 (20.80s rate:347.64b/s):
  - Level 0 Chunk 23 (20.42s rate:370.42b/s):
  - Level 0 Chunk 24 (12.17s rate:227.20b/s):
  - Level 0 Chunk 25 (24.84s rate:281.24b/s):
  - Level 0 Chunk 26 (19.94s rate:394.48b/s):
  - Level 0 Chunk 27 (23.97s rate:304.59b/s):
  - Level 0 Chunk 28 (23.02s rate:323.11b/s):
  - Level 0 Chunk 29 (22.37s rate:332.19b/s):
  - Level 0 Chunk 30 (23.99s rate:308.17b/s):
  - Level 0 Chunk 31 (20.81s rate:378.81b/s):
  - Level 0 Chunk 32 (22.89s rate:340.85b/s):
  - Level 0 Chunk 33 (21.46s rate:368.22b/s):
  - Level 0 Chunk 34 (19.43s rate:274.32b/s):
  - Level 0 Chunk 35 (19.81s rate:384.20b/s):
  - Level 0 Chunk 36 (21.35s rate:329.65b/s):
  - Level 0 Chunk 37 (19.75s rate:366.43b/s):
  - Level 0 Chunk 38 (19.61s rate:219.84b/s):
  - Level 0 Chunk 39 (20.45s rate:322.10b/s):
  - Level 0 Chunk 40 (21.48s rate:351.86b/s):
  - Level 0 Chunk 41 (20.66s rate:383.20b/s):
  - Level 0 Chunk 42 (17.54s rate:254.96b/s):
  - Level 0 Chunk 43 (25.36s rate:265.02b/s):
  - Level 0 Chunk 44 (23.92s rate:294.40b/s):
  - Level 0 Chunk 45 (23.84s rate:314.77b/s):
  - Level 0 Chunk 46 (20.89s rate:375.11b/s):
  - Level 0 Chunk 47 (24.18s rate:299.13b/s):
  - Level 0 Chunk 48 (28.28s rate:274.79b/s):
  - Level 0 Chunk 49 (18.57s rate:160.10b/s):
  - Level 0 Chunk 50 (18.91s rate:384.40b/s):
  - Level 0 Chunk 51 (20.83s rate:356.07b/s):
  - Level 0 Chunk 52 (17.36s rate:433.64b/s):
  - Level 0 Chunk 53 (22.34s rate:352.19b/s):
  - Level 0 Chunk 54 (24.10s rate:319.92b/s):
  - Level 0 Chunk 55 (16.23s rate:159.83b/s):
  - Level 0 Chunk 56 (13.07s rate:190.74b/s):
  - Level 0 Chunk 57 (6.18s rate:182.52b/s):
  - Level 0 Chunk 58 (22.27s rate:357.84b/s):
  - Level 0 Chunk 59 (6.64s rate:232.38b/s):
  - Level 0 Chunk 60 (14.08s rate:184.23b/s):
  - Level 0 Chunk 61 (3.99s rate:77.69b/s):
  - Level 0 Chunk 62 (22.55s rate:320.89b/s):
  - Level 0 Chunk 63 (12.72s rate:235.61b/s):
  - Level 0 Chunk 64 (27.56s rate:266.44b/s):
  - Level 0 Chunk 65 (20.71s rate:380.35b/s):
  - Level 0 Chunk 66 (20.88s rate:376.10b/s):
  - Level 0 Chunk 67 (18.44s rate:368.17b/s):
  - Level 0 Chunk 68 (23.24s rate:296.26b/s):
  - Level 0 Chunk 69 (20.17s rate:376.85b/s):
  - Level 0 Chunk 70 (6.46s rate:120.90b/s):
  - Level 0 Chunk 71 (17.20s rate:373.08b/s):
  - Level 0 Chunk 72 (18.50s rate:245.35b/s):
  - Level 0 Chunk 73 (3.95s rate:122.28b/s):
  - Level 0 Chunk 74 (20.41s rate:367.71b/s):
  - Level 0 Chunk 75 (21.89s rate:341.66b/s):
  - Level 0 Chunk 76 (24.55s rate:297.84b/s):
  - Level 0 Chunk 77 (22.79s rate:334.44b/s):
  - Level 0 Chunk 78 (14.37s rate:199.37b/s):
  - Level 0 Chunk 79 (10.59s rate:287.91b/s):
  - Level 0 Chunk 80 (17.43s rate:204.70b/s):
  - Level 0 Chunk 81 (11.63s rate:289.94b/s):
  - Level 0 Chunk 82 (4.88s rate:120.08b/s):
  - Level 0 Chunk 83 (19.93s rate:364.73b/s):
  - Level 0 Chunk 84 (22.66s rate:292.32b/s):
  - Level 0 Chunk 85 (21.54s rate:366.81b/s):
  - Level 0 Chunk 86 (20.96s rate:183.11b/s):
  - Level 0 Chunk 87 (10.28s rate:258.17b/s):
  - Level 0 Chunk 88 (6.18s rate:170.55b/s):
  - Level 0 Chunk 89 (18.71s rate:353.23b/s):
  - Level 0 Chunk 90 (8.74s rate:303.66b/s):
  - Level 0 Chunk 91 (9.29s rate:268.57b/s):
  - Level 0 Chunk 92 (4.33s rate:142.03b/s):
  - Level 0 Chunk 93 (21.02s rate:365.98b/s):
  - Level 0 Chunk 94 (18.39s rate:401.58b/s):
  - Level 0 Chunk 95 (22.43s rate:316.63b/s):
  - Level 0 Chunk 96 (20.37s rate:368.43b/s):
  - Level 0 Chunk 97 (10.35s rate:316.81b/s):
  - Level 0 Chunk 98 (14.19s rate:201.20b/s):
  - Level 0 Chunk 99 (5.51s rate:149.00b/s):
  - Level 0 Chunk 100 (20.39s rate:357.09b/s):
  - Level 0 Chunk 101 (23.26s rate:296.73b/s):
  - Level 0 Chunk 102 (21.88s rate:325.27b/s):
  - Level 0 Chunk 103 (20.42s rate:346.57b/s):
  - Level 0 Chunk 104 (23.05s rate:315.05b/s):
  - Level 0 Chunk 105 (23.04s rate:330.60b/s):
  - Level 0 Chunk 106 (4.78s rate:116.53b/s):
  - Level 0 Chunk 107 (12.70s rate:240.63b/s):
  - Level 0 Chunk 108 (7.68s rate:123.70b/s):
  - Level 0 Chunk 109 (17.28s rate:455.67b/s):
  - Level 0 Chunk 110 (28.79s rate:226.64b/s):
  - Level 0 Chunk 111 (23.77s rate:327.39b/s):
  - Level 0 Chunk 112 (21.18s rate:368.84b/s):
  - Level 0 Chunk 113 (27.45s rate:288.01b/s):
  - Level 0 Chunk 114 (20.54s rate:360.95b/s):
  - Level 0 Chunk 115 (11.50s rate:190.61b/s):
  - Level 0 Chunk 116 (12.40s rate:224.68b/s):
  - Level 0 Chunk 117 (6.20s rate:161.29b/s):
  - Level 0 Chunk 118 (19.94s rate:372.57b/s):
  - Level 0 Chunk 119 (23.70s rate:254.68b/s):
  - Level 0 Chunk 120 (3.61s rate:106.93b/s):
  - Level 0 Chunk 121 (3.50s rate:95.43b/s):
  - Level 0 Chunk 122 (3.22s rate:93.79b/s):
  - Level 0 Chunk 123 (2.57s rate:85.60b/s):
  - Level 0 Chunk 124 (2.13s rate:132.86b/s):
  - Level 0 Chunk 125 (3.52s rate:83.24b/s):
  - Level 0 Chunk 126 (3.07s rate:80.13b/s):
  - Level 0 Chunk 127 (3.86s rate:146.89b/s):
  - Level 0 Chunk 128 (1.35s rate:105.93b/s):
  - Level 0 Chunk 129 (2.81s rate:125.98b/s):
  - Level 0 Chunk 130 (1.21s rate:130.58b/s):
  - Level 0 Chunk 131 (3.91s rate:117.39b/s):
  - Level 0 Chunk 132 (4.55s rate:101.10b/s):
  - Level 0 Chunk 133 (4.59s rate:101.53b/s):
  - Level 0 Chunk 134 (3.41s rate:73.90b/s):
  - Level 0 Chunk 135 (1.65s rate:84.24b/s):
  - Level 0 Chunk 136 (1.88s rate:121.28b/s):
  - Level 0 Chunk 137 (2.57s rate:99.61b/s):
  - Level 0 Chunk 138 (3.65s rate:104.93b/s):
  - Level 0 Chunk 139 (3.17s rate:82.97b/s):
  - Level 0 Chunk 140 (2.43s rate:121.81b/s):
  - Level 0 Chunk 141 (3.80s rate:108.95b/s):
  - Level 0 Chunk 142 (2.97s rate:86.53b/s):
  - Level 0 Chunk 143 (3.39s rate:113.57b/s):
  - Level 0 Chunk 144 (3.46s rate:78.61b/s):
  - Level 0 Chunk 145 (2.67s rate:79.40b/s):
  - Level 0 Chunk 146 (3.71s rate:57.14b/s):
  - Level 0 Chunk 147 (2.42s rate:87.60b/s):
  - Level 0 Chunk 148 (1.90s rate:85.79b/s):
  - Level 0 Chunk 149 (3.27s rate:83.79b/s):
  - Level 0 Chunk 150 (2.81s rate:131.32b/s):
  - Level 0 Chunk 151 (4.04s rate:95.79b/s):
  - Level 0 Chunk 152 (1.98s rate:129.80b/s):
  - Level 0 Chunk 153 (1.95s rate:105.64b/s):
  - Level 0 Chunk 154 (1.60s rate:93.13b/s):
  - Level 0 Chunk 155 (1.85s rate:98.92b/s):
  - Level 0 Chunk 156 (1.31s rate:105.34b/s):
  - Level 0 Chunk 157 (1.80s rate:87.22b/s):
  - Level 0 Chunk 158 (2.93s rate:102.39b/s):
  - Level 0 Chunk 159 (1.70s rate:97.06b/s):
  - Level 0 Chunk 160 (1.42s rate:139.44b/s):
  - Level 0 Chunk 161 (2.23s rate:95.07b/s):
  - Level 0 Chunk 162 (3.08s rate:101.30b/s):
  - Level 0 Chunk 163 (2.94s rate:45.24b/s):
  - Level 0 Chunk 164 (3.21s rate:130.22b/s):
  - Level 0 Chunk 165 (1.95s rate:88.72b/s):
  - Level 0 Chunk 166 (2.69s rate:56.51b/s):
  - Level 0 Chunk 167 (3.60s rate:110.00b/s):
  - Level 0 Chunk 168 (1.61s rate:101.86b/s):
  - Level 0 Chunk 169 (1.46s rate:132.19b/s):
  - Level 0 Chunk 170 (4.34s rate:111.29b/s):
  - Level 0 Chunk 171 (11.02s rate:227.59b/s):
  - Level 0 Chunk 172 (4.05s rate:103.46b/s):
  - Level 0 Chunk 173 (23.21s rate:338.56b/s):
  - Level 0 Chunk 174 (24.88s rate:320.46b/s):
  - Level 0 Chunk 175 (21.06s rate:369.56b/s):
  - Level 0 Chunk 176 (24.89s rate:258.26b/s):
  - Level 0 Chunk 177 (22.34s rate:342.03b/s):
  - Level 0 Chunk 178 (16.51s rate:251.30b/s):
  - Level 0 Chunk 179 (1.86s rate:87.10b/s):
  - Level 0 Chunk 180 (17.24s rate:291.65b/s):
  - Level 0 Chunk 181 (11.40s rate:240.79b/s):
  - Level 0 Chunk 182 (5.71s rate:99.82b/s):
  - Level 0 Chunk 183 (17.86s rate:426.93b/s):
  - Level 0 Chunk 184 (21.88s rate:342.50b/s):
  - Level 0 Chunk 185 (22.95s rate:340.22b/s):
  - Level 0 Chunk 186 (18.14s rate:366.70b/s):
  - Level 0 Chunk 187 (20.53s rate:374.18b/s):
  - Level 0 Chunk 188 (26.29s rate:265.39b/s):
  - Level 0 Chunk 189 (20.95s rate:340.43b/s):
  - Level 0 Chunk 190 (19.51s rate:389.24b/s):
  - Level 0 Chunk 191 (23.42s rate:327.03b/s):
  - Level 0 Chunk 192 (22.47s rate:302.85b/s):
  - Level 0 Chunk 193 (16.46s rate:392.83b/s):
  - Level 0 Chunk 194 (13.05s rate:191.34b/s):
  - Level 0 Chunk 195 (4.04s rate:120.05b/s):
  - Level 0 Chunk 196 (22.70s rate:337.09b/s):
  - Level 0 Chunk 197 (22.92s rate:328.01b/s):
  - Level 0 Chunk 198 (25.39s rate:308.90b/s):
  - Level 0 Chunk 199 (21.28s rate:328.71b/s):
  - Level 0 Chunk 200 (15.14s rate:457.07b/s):
  - Level 0 Chunk 201 (23.32s rate:328.56b/s):
  - Level 0 Chunk 202 (21.50s rate:324.33b/s):
  - Level 0 Chunk 203 (21.30s rate:375.12b/s):
  - Level 0 Chunk 204 (10.36s rate:114.29b/s):
  - Level 0 Chunk 205 (11.09s rate:224.26b/s):
  - Level 0 Chunk 206 (5.61s rate:108.56b/s):
  - Level 0 Chunk 207 (20.46s rate:334.60b/s):
  - Level 0 Chunk 208 (22.95s rate:309.41b/s):
  - Level 0 Chunk 209 (15.31s rate:206.34b/s):
  - Level 0 Chunk 210 (11.70s rate:250.68b/s):
  - Level 0 Chunk 211 (1.71s rate:107.02b/s):
  - Level 0 Chunk 212 (16.14s rate:488.04b/s):
  - Level 0 Chunk 213 (10.08s rate:299.01b/s):
  - Level 0 Chunk 214 (10.36s rate:190.93b/s):
  - Level 0 Chunk 215 (6.64s rate:106.48b/s):
  - Level 0 Chunk 216 (20.68s rate:354.30b/s):
  - Level 0 Chunk 217 (27.35s rate:279.01b/s):
  - Level 0 Chunk 218 (25.93s rate:288.97b/s):
  - Level 0 Chunk 219 (28.77s rate:248.94b/s):
  - Level 0 Chunk 220 (23.33s rate:331.29b/s):
  - Level 0 Chunk 221 (19.03s rate:414.45b/s):
  - Level 0 Chunk 222 (9.91s rate:229.57b/s):
  - Level 0 Chunk 223 (2.21s rate:162.44b/s):
  - Level 0 Chunk 224 (21.05s rate:234.25b/s):
  - Level 0 Chunk 225 (9.88s rate:284.72b/s):
  - Level 0 Chunk 226 (4.35s rate:102.30b/s):
  - Level 0 Chunk 227 (22.34s rate:354.92b/s):
  - Level 0 Chunk 228 (20.85s rate:372.13b/s):
  - Level 0 Chunk 229 (22.63s rate:313.83b/s):
  - Level 0 Chunk 230 (10.37s rate:265.96b/s):
  - Level 0 Chunk 231 (6.24s rate:160.42b/s):
  - Level 0 Chunk 232 (18.94s rate:331.15b/s):
  - Level 0 Chunk 233 (10.64s rate:221.62b/s):
  - Level 0 Chunk 234 (11.63s rate:271.71b/s):
  - Level 0 Chunk 235 (13.29s rate:399.62b/s):
  - Level 0 Chunk 236 (9.83s rate:291.96b/s):
  - Level 0 Chunk 237 (5.35s rate:132.15b/s):
  - Level 0 Chunk 238 (15.91s rate:313.58b/s):
  - Level 0 Chunk 239 (11.15s rate:200.90b/s):
  - Level 0 Chunk 240 (7.38s rate:117.75b/s):
  - Level 0 Chunk 241 (22.02s rate:351.59b/s):
  - Level 0 Chunk 242 (30.85s rate:251.47b/s):
  - Level 0 Chunk 243 (19.75s rate:399.95b/s):
  - Level 0 Chunk 244 (17.68s rate:420.19b/s):
  - Level 0 Chunk 245 (20.53s rate:380.61b/s):
  - Level 0 Chunk 246 (22.31s rate:337.56b/s):
  - Level 0 Chunk 247 (26.99s rate:283.33b/s):
  - Level 0 Chunk 248 (20.12s rate:355.42b/s):
  - Level 0 Chunk 249 (17.49s rate:450.71b/s):
  - Level 0 Chunk 250 (21.99s rate:334.24b/s):
  - Level 0 Chunk 251 (20.08s rate:364.24b/s):
  - Level 0 Chunk 252 (21.91s rate:329.53b/s):
  - Level 0 Chunk 253 (20.06s rate:368.30b/s):
  - Level 0 Chunk 254 (20.53s rate:370.73b/s):
  - Level 0 Chunk 255 (21.77s rate:331.05b/s):
  - Level 0 Chunk 256 (21.82s rate:362.14b/s):
  - Level 0 Chunk 257 (22.97s rate:334.44b/s):
  - Level 0 Chunk 258 (20.22s rate:373.89b/s):
  - Level 0 Chunk 259 (21.17s rate:334.15b/s):
  - Level 0 Chunk 260 (21.05s rate:378.86b/s):
  - Level 0 Chunk 261 (25.19s rate:288.61b/s):
  - Level 0 Chunk 262 (23.32s rate:333.02b/s):
  - Level 0 Chunk 263 (20.65s rate:349.83b/s):
  - Level 0 Chunk 264 (26.02s rate:283.74b/s):
  - Level 0 Chunk 265 (21.93s rate:326.68b/s):
  - Level 0 Chunk 266 (21.17s rate:374.11b/s):
  - Level 0 Chunk 267 (20.43s rate:390.46b/s):
  - Level 0 Chunk 268 (15.83s rate:490.46b/s):
  - Level 0 Chunk 269 (3.46s rate:70.23b/s):
  - Level 0 Chunk 270 (8.63s rate:333.84b/s):
  - Level 0 Chunk 271 (7.75s rate:131.48b/s):
  - Level 0 Chunk 272 (18.05s rate:392.35b/s):
  - Level 0 Chunk 273 (16.93s rate:263.20b/s):
  - Level 0 Chunk 274 (7.31s rate:121.20b/s):
  - Level 0 Chunk 275 (32.45s rate:230.82b/s):
  - Level 0 Chunk 276 (19.26s rate:404.41b/s):
  - Level 0 Chunk 277 (20.28s rate:387.97b/s):
  - Level 0 Chunk 278 (17.80s rate:302.75b/s):
  - Level 0 Chunk 279 (12.49s rate:224.50b/s):
  - Level 0 Chunk 280 (4.98s rate:125.30b/s):
  - Level 0 Chunk 281 (13.31s rate:198.65b/s):
  - Level 0 Chunk 282 (9.23s rate:238.03b/s):
  - Level 0 Chunk 283 (5.33s rate:152.72b/s):
  - Level 0 Chunk 284 (12.08s rate:278.97b/s):
  - Level 0 Chunk 285 (8.84s rate:239.82b/s):
  - Level 0 Chunk 286 (5.29s rate:115.31b/s):
  - Level 0 Chunk 287 (21.96s rate:337.20b/s):
  - Level 0 Chunk 288 (6.74s rate:262.02b/s):
  - Level 0 Chunk 289 (8.65s rate:223.35b/s):
  - Level 0 Chunk 290 (2.10s rate:109.52b/s):
  - Level 0 Chunk 291 (22.75s rate:272.31b/s):
  - Level 0 Chunk 292 (10.31s rate:201.84b/s):
  - Level 0 Chunk 293 (2.98s rate:76.85b/s):
  - Level 0 Chunk 294 (8.23s rate:353.22b/s):
  - Level 0 Chunk 295 (9.56s rate:203.77b/s):
  - Level 0 Chunk 296 (3.14s rate:115.92b/s):
  - Level 0 Chunk 297 (16.12s rate:215.82b/s):
  - Level 0 Chunk 298 (9.74s rate:244.05b/s):
  - Level 0 Chunk 299 (8.44s rate:129.86b/s):
  - Level 0 Chunk 300 (23.53s rate:310.11b/s):
  - Level 0 Chunk 301 (8.52s rate:242.72b/s):
  - Level 0 Chunk 302 (3.03s rate:89.11b/s):
  - Level 0 Chunk 303 (3.01s rate:190.03b/s):
  - Level 0 Chunk 304 (10.63s rate:207.62b/s):
  - Level 0 Chunk 305 (6.65s rate:91.43b/s):
  - Level 0 Chunk 306 (9.27s rate:277.78b/s):
  - Level 0 Chunk 307 (15.12s rate:278.37b/s):
  - Level 0 Chunk 308 (5.55s rate:172.07b/s):
  - Level 0 Chunk 309 (21.06s rate:340.93b/s):
  - Level 0 Chunk 310 (8.85s rate:152.20b/s):
  - Level 0 Chunk 311 (2.50s rate:88.40b/s):
  - Level 0 Chunk 312 (18.44s rate:433.79b/s):
  - Level 0 Chunk 313 (15.89s rate:421.71b/s):
  - Level 0 Chunk 314 (16.53s rate:453.84b/s):
  - Level 0 Chunk 315 (24.17s rate:324.24b/s):
  - Level 0 Chunk 316 (29.46s rate:259.16b/s):
  - Level 0 Chunk 317 (26.22s rate:270.52b/s):
  - Level 0 Chunk 318 (23.73s rate:321.83b/s):
  - Level 0 Chunk 319 (27.53s rate:277.73b/s):
  - Level 0 Chunk 320 (23.30s rate:302.83b/s):
  - Level 0 Chunk 321 (20.57s rate:367.38b/s):
  - Level 0 Chunk 322 (21.55s rate:352.25b/s):
  - Level 0 Chunk 323 (8.71s rate:193.23b/s):
  - Level 0 Chunk 324 (19.96s rate:333.82b/s):
  - Level 0 Chunk 325 (26.29s rate:302.89b/s):
  - Level 0 Chunk 326 (13.61s rate:216.75b/s):
  - Level 0 Chunk 327 (9.99s rate:246.45b/s):
  - Level 0 Chunk 328 (6.57s rate:185.24b/s):
  - Level 0 Chunk 329 (12.55s rate:299.76b/s):
  - Level 0 Chunk 330 (7.94s rate:266.12b/s):
  - Level 0 Chunk 331 (6.82s rate:191.64b/s):
  - Level 0 Chunk 332 (21.72s rate:341.90b/s):
  - Level 0 Chunk 333 (21.28s rate:349.72b/s):
  - Level 0 Chunk 334 (27.80s rate:271.37b/s):
  - Level 0 Chunk 335 (22.42s rate:348.62b/s):
  - Level 0 Chunk 336 (11.61s rate:293.02b/s):
  - Level 0 Chunk 337 (20.83s rate:364.38b/s):
  - Level 0 Chunk 338 (21.74s rate:337.12b/s):
  - Level 0 Chunk 339 (27.40s rate:288.36b/s):
  - Level 0 Chunk 340 (14.73s rate:499.93b/s):
  - Level 0 Chunk 341 (22.59s rate:340.59b/s):
  - Level 0 Chunk 342 (14.16s rate:542.87b/s):
  - Level 0 Chunk 343 (23.05s rate:323.95b/s):
  - Level 0 Chunk 344 (17.89s rate:343.88b/s):
  - Level 0 Chunk 345 (18.23s rate:392.87b/s):
  - Level 0 Chunk 346 (16.28s rate:398.10b/s):
  - Level 0 Chunk 347 (20.93s rate:367.46b/s):
  - Level 0 Chunk 348 (18.37s rate:363.91b/s):
  - Level 0 Chunk 349 (15.80s rate:494.11b/s):
  - Level 0 Chunk 350 (18.17s rate:378.81b/s):
  - Level 0 Chunk 351 (16.86s rate:428.83b/s):
  - Level 0 Chunk 352 (20.87s rate:335.36b/s):
  - Level 0 Chunk 353 (20.47s rate:350.27b/s):
  - Level 0 Chunk 354 (15.16s rate:501.85b/s):
  - Level 0 Chunk 355 (20.76s rate:363.87b/s):
  - Level 0 Chunk 356 (20.01s rate:393.55b/s):
  - Level 0 Chunk 357 (15.67s rate:309.32b/s):
  - Level 0 Chunk 358 (13.77s rate:184.60b/s):
  - Level 0 Chunk 359 (24.97s rate:297.44b/s):
  - Level 0 Chunk 360 (24.97s rate:319.02b/s):
  - Level 0 Chunk 361 (23.32s rate:320.41b/s):
  - Level 0 Chunk 362 (21.03s rate:166.90b/s):
  - Level 0 Chunk 363 (17.69s rate:447.94b/s):
  - Level 0 Chunk 364 (21.46s rate:367.66b/s):
  - Level 0 Chunk 365 (21.67s rate:365.44b/s):
  - Level 0 Chunk 366 (25.86s rate:305.57b/s):
  - Level 0 Chunk 367 (32.36s rate:241.44b/s):
  - Level 0 Chunk 368 (29.98s rate:266.21b/s):
  - Level 0 Chunk 369 (51.90s rate:150.40b/s):
  - Level 0 Chunk 370 (17.02s rate:466.69b/s):
  - Level 0 Chunk 371 (32.70s rate:140.76b/s):
  - Level 0 Chunk 372 (23.79s rate:335.65b/s):
  - Level 0 Chunk 373 (20.84s rate:372.36b/s):
  - Level 0 Chunk 374 (16.45s rate:81.40b/s):
  - Level 0 Chunk 375 (5.57s rate:229.44b/s):
  - Level 0 Chunk 376 (16.22s rate:492.79b/s):
  - Level 0 Chunk 377 (15.64s rate:477.24b/s):
  - Level 0 Chunk 378 (27.01s rate:175.31b/s):
  - Level 0 Chunk 379 (19.65s rate:402.34b/s):
  - Level 0 Chunk 380 (13.34s rate:593.70b/s):
  - Level 0 Chunk 381 (3.89s rate:81.23b/s):
  - Level 0 Chunk 382 (12.83s rate:616.99b/s):
  - Level 0 Chunk 383 (28.38s rate:275.02b/s):
  - Level 0 Chunk 384 (20.61s rate:386.51b/s):
  - Level 0 Chunk 385 (13.65s rate:580.51b/s):
  - Level 0 Chunk 386 (15.06s rate:208.70b/s):
  - Level 0 Chunk 387 (27.10s rate:295.20b/s):
  - Level 0 Chunk 388 (25.17s rate:316.85b/s):
  - Level 0 Chunk 389 (14.63s rate:112.58b/s):
  - Level 0 Chunk 390 (29.10s rate:260.86b/s):
  - Level 0 Chunk 391 (15.67s rate:510.02b/s):
  - Level 0 Chunk 392 (24.03s rate:210.61b/s):
  - Level 0 Chunk 393 (13.76s rate:545.06b/s):
  - Level 0 Chunk 394 (17.11s rate:280.71b/s):
  - Level 0 Chunk 395 (27.08s rate:292.95b/s):
  - Level 0 Chunk 396 (20.57s rate:379.58b/s):
  - Level 0 Chunk 397 (10.00s rate:301.80b/s):
  - Level 0 Chunk 398 (12.52s rate:634.03b/s):
  - Level 0 Chunk 399 (22.07s rate:333.71b/s):
  - Level 0 Chunk 400 (34.76s rate:211.19b/s):
  - Level 0 Chunk 401 (11.77s rate:215.55b/s):
  - Level 0 Chunk 402 (11.46s rate:328.71b/s):
  - Level 0 Chunk 403 (22.74s rate:347.41b/s):
  - Level 0 Chunk 404 (19.43s rate:313.12b/s):
  - Level 0 Chunk 405 (24.25s rate:329.03b/s):
  - Level 0 Chunk 406 (22.59s rate:347.85b/s):
  - Level 0 Chunk 407 (14.69s rate:536.90b/s):
  - Level 0 Chunk 408 (11.48s rate:145.21b/s):
  - Level 0 Chunk 409 (19.43s rate:301.39b/s):
  - Level 0 Chunk 410 (32.82s rate:201.43b/s):
  - Level 0 Chunk 411 (31.74s rate:250.32b/s):
  - Level 0 Chunk 412 (15.82s rate:495.07b/s):
  - Level 0 Chunk 413 (34.11s rate:233.86b/s):
  - Level 0 Chunk 414 (9.60s rate:68.02b/s):
  - Level 0 Chunk 415 (3.50s rate:101.71b/s):
  - Level 0 Chunk 416 (26.57s rate:290.29b/s):
  - Level 0 Chunk 417 (11.84s rate:348.82b/s):
  - Level 0 Chunk 418 (28.41s rate:277.61b/s):
  - Level 0 Chunk 419 (23.37s rate:336.97b/s):
  - Level 0 Chunk 420 (15.98s rate:498.94b/s):
  - Level 0 Chunk 421 (21.51s rate:290.61b/s):
  - Level 0 Chunk 422 (16.04s rate:495.07b/s):
  - Level 0 Chunk 423 (38.87s rate:152.64b/s):
  - Level 0 Chunk 424 (8.40s rate:201.90b/s):
  - Level 0 Chunk 425 (12.93s rate:441.30b/s):
  - Level 0 Chunk 426 (18.20s rate:425.88b/s):
  - Level 0 Chunk 427 (8.43s rate:158.48b/s):
  - Level 0 Chunk 428 (3.73s rate:149.87b/s):
  - Level 0 Chunk 429 (5.65s rate:84.25b/s):
  - Level 0 Chunk 430 (3.84s rate:134.38b/s):
  - Level 0 Chunk 431 (5.50s rate:179.09b/s):

- Level 0 output summary:
  - 432 docs, length: 419.66 kB

## Level 1 Summarization

- Level 1 input summary:
  - 1 docs, length: 420.52 kB
  - split into 54 chunks, length: 420.75 kB

- Level 1 progress:
  - Level 1 Chunk 0 (20.01s rate:389.46b/s):
  - Level 1 Chunk 1 (19.53s rate:399.33b/s):
  - Level 1 Chunk 2 (26.73s rate:297.49b/s):
  - Level 1 Chunk 3 (25.18s rate:306.75b/s):
  - Level 1 Chunk 4 (26.70s rate:298.95b/s):
  - Level 1 Chunk 5 (29.41s rate:263.28b/s):
  - Level 1 Chunk 6 (26.89s rate:293.38b/s):
  - Level 1 Chunk 7 (26.93s rate:292.09b/s):
  - Level 1 Chunk 8 (27.87s rate:283.57b/s):
  - Level 1 Chunk 9 (24.31s rate:319.13b/s):
  - Level 1 Chunk 10 (24.84s rate:309.22b/s):
  - Level 1 Chunk 11 (25.42s rate:304.01b/s):
  - Level 1 Chunk 12 (30.54s rate:258.94b/s):
  - Level 1 Chunk 13 (24.49s rate:318.13b/s):
  - Level 1 Chunk 14 (35.44s rate:217.75b/s):
  - Level 1 Chunk 15 (19.14s rate:395.77b/s):
  - Level 1 Chunk 16 (30.94s rate:256.43b/s):
  - Level 1 Chunk 17 (23.43s rate:335.47b/s):
  - Level 1 Chunk 18 (22.90s rate:347.42b/s):
  - Level 1 Chunk 19 (25.24s rate:314.14b/s):
  - Level 1 Chunk 20 (36.57s rate:218.13b/s):
  - Level 1 Chunk 21 (27.39s rate:279.37b/s):
  - Level 1 Chunk 22 (22.90s rate:336.59b/s):
  - Level 1 Chunk 23 (23.29s rate:333.79b/s):
  - Level 1 Chunk 24 (28.49s rate:271.29b/s):
  - Level 1 Chunk 25 (30.17s rate:259.13b/s):
  - Level 1 Chunk 26 (32.23s rate:247.66b/s):
  - Level 1 Chunk 27 (28.32s rate:274.29b/s):
  - Level 1 Chunk 28 (28.50s rate:274.63b/s):
  - Level 1 Chunk 29 (22.92s rate:340.75b/s):
  - Level 1 Chunk 30 (26.35s rate:285.69b/s):
  - Level 1 Chunk 31 (19.96s rate:395.39b/s):
  - Level 1 Chunk 32 (24.36s rate:321.35b/s):
  - Level 1 Chunk 33 (26.26s rate:295.96b/s):
  - Level 1 Chunk 34 (27.19s rate:287.50b/s):
  - Level 1 Chunk 35 (26.30s rate:303.46b/s):
  - Level 1 Chunk 36 (32.82s rate:240.74b/s):
  - Level 1 Chunk 37 (17.74s rate:446.51b/s):
  - Level 1 Chunk 38 (35.39s rate:220.32b/s):
  - Level 1 Chunk 39 (26.52s rate:293.82b/s):
  - Level 1 Chunk 40 (23.16s rate:338.13b/s):
  - Level 1 Chunk 41 (22.65s rate:352.54b/s):
  - Level 1 Chunk 42 (21.33s rate:366.01b/s):
  - Level 1 Chunk 43 (21.95s rate:363.33b/s):
  - Level 1 Chunk 44 (22.57s rate:352.68b/s):
  - Level 1 Chunk 45 (22.76s rate:349.60b/s):
  - Level 1 Chunk 46 (29.66s rate:266.55b/s):
  - Level 1 Chunk 47 (17.38s rate:446.32b/s):
  - Level 1 Chunk 48 (31.27s rate:245.41b/s):
  - Level 1 Chunk 49 (18.44s rate:431.13b/s):
  - Level 1 Chunk 50 (15.69s rate:504.46b/s):
  - Level 1 Chunk 51 (29.94s rate:258.82b/s):
  - Level 1 Chunk 52 (23.06s rate:343.24b/s):
  - Level 1 Chunk 53 (22.51s rate:249.04b/s):

- Level 1 output summary:
  - 54 docs, length: 101.58 kB

## Level 2 Summarization

- Level 2 input summary:
  - 1 docs, length: 101.69 kB
  - split into 13 chunks, length: 101.66 kB

- Level 2 progress:
  - Level 2 Chunk 0 (31.03s rate:249.11b/s):
  - Level 2 Chunk 1 (27.57s rate:281.21b/s):
  - Level 2 Chunk 2 (35.67s rate:221.75b/s):
  - Level 2 Chunk 3 (36.96s rate:208.14b/s):
  - Level 2 Chunk 4 (27.42s rate:285.70b/s):
  - Level 2 Chunk 5 (36.57s rate:215.70b/s):
  - Level 2 Chunk 6 (29.77s rate:257.94b/s):
  - Level 2 Chunk 7 (29.06s rate:271.61b/s):
  - Level 2 Chunk 8 (31.30s rate:246.23b/s):
  - Level 2 Chunk 9 (25.67s rate:310.01b/s):
  - Level 2 Chunk 10 (28.55s rate:273.06b/s):
  - Level 2 Chunk 11 (29.96s rate:263.62b/s):
  - Level 2 Chunk 12 (24.85s rate:318.79b/s):

- Level 2 output summary:
  - 13 docs, length: 31.90 kB

## Level 3 Summarization

- Level 3 input summary:
  - 1 docs, length: 31.92 kB
  - split into 5 chunks, length: 31.91 kB

- Level 3 progress:
  - Level 3 Chunk 0 (34.12s rate:227.08b/s):
  - Level 3 Chunk 1 (30.33s rate:251.14b/s):
  - Level 3 Chunk 2 (49.30s rate:155.58b/s):
  - Level 3 Chunk 3 (37.74s rate:203.47b/s):
  - Level 3 Chunk 4 (10.04s rate:119.42b/s):

- Level 3 output summary:
  - 5 docs, length: 14.31 kB

## Level 4 Summarization

- Level 4 input summary:
  - 1 docs, length: 14.32 kB
  - split into 2 chunks, length: 14.32 kB

- Level 4 progress:
  - Level 4 Chunk 0 (23.79s rate:333.42b/s):
  - Level 4 Chunk 1 (34.51s rate:185.08b/s):

- Level 4 output summary:
  - 2 docs, length: 5.17 kB

## Level 5 Summarization

- Level 5 input summary:
  - 1 docs, length: 5.18 kB
  - split into 1 chunks, length: 5.18 kB

- Level 5 progress:
  - Level 5 Chunk 0 (17.77s rate:291.28b/s):

- Level 5 output summary:
  - 1 docs, length: 1.52 kB

## Level 5 Summary

Studies suggest humans share millions of common ancestors with those from opposite ends of Europe within the last 1,000 years. Genetic evidence supports the "Out of Africa" theory proposing humans outside Africa descended from a single exodus between 50,000 to 100,000 years ago.

Phylogenetic analysis suggests two rounds of whole genome duplication in vertebrate ancestors and gene divergences extend back further than animal-plant splits. The book concludes that humans have high genetic uniformity with superficial differences attributed to past bottlenecks in human populations.

Convergent evolution is observed across species, where adaptations evolve multiple times due to universal physical principles. The concept of "evolution of evolvability" suggests that evolution itself can improve over time, allowing organisms to adapt and evolve more effectively.

Evolutionary methods such as archaeology and genetic analysis are used to understand human evolution, including the concept of a single ancestor shared by all surviving species, known as the concestor. The book also examines genetic relationships between humans, chimpanzees, and bonobos, revealing complex relationships due to hybridization and incomplete lineage sorting.

The tree of life is complex, with relationships between chloroplasts, mitochondria, and eubacteria unclear. Genetic sequences reveal evolutionary relationships but are uncertain due to factors like DNA exchange among bacteria and difficulties in reconstructing ancestral history.




## Level 4 Summary

The book explores the history of life on Earth through stories about different species, referred to as "tales." It uses various evolutionary methods, including archaeology and genetic analysis, to understand human evolution. The concept of a single ancestor shared by all surviving species, known as the concestor, is introduced.

Studies suggest that people from opposite ends of Europe share millions of common ancestors over the last 1,000 years. Genetic evidence supports this idea, which aligns with the "Out of Africa" theory proposing humans outside Africa descended from a single exodus between 50,000 to 100,000 years ago.

The book also examines genetic relationships between humans, chimpanzees, and bonobos, revealing complex relationships due to hybridization and incomplete lineage sorting. The concept of the molecular clock is discussed, including its limitations in dating human evolution.

Other topics covered include:

* Convergent evolution in New Guinean marsupials
* The Delayed Explosion Model suggesting mammals diversified after the K/T boundary
* Classification and categorization oversimplifying complex phenomena
* The emergence of amnion leading to distinct lineages
* Speciation through geographical and reproductive isolation

Phylogenetic analysis supports the "2R" hypothesis, proposing two rounds of whole genome duplication in vertebrate ancestors. Gene divergences extend back further than animal-plant splits, dating back to single-celled bacteria and the origin of life itself.

The book concludes that humans have a high level of genetic uniformity, with superficial differences attributed to past bottlenecks in human populations. The debate around racial classification is ongoing, with some arguing it is meaningless due to the small fraction of total variation accounted for by racial differences.

Hox genes in arthropods like fruit flies specify segment identity and development by being expressed in specific regions. The body plan is dynamic, with changes leading to modifications in anatomy.

The homeobox gene family shares similarities but has distinct functions across species, controlling eye formation or heart development. Asexual reproduction in bdelloid rotifers, which have been asexually reproducing for 80 million years without males or sex, leads to genetic divergence due to lack of gene exchange.

The "twofold cost of sex" theory proposes that individuals with perfect genetic transfer do better than those with mixed offspring, but theories attempt to explain sex's benefits. The Cambrian Explosion saw new phyla emerging gradually over millions of years, contradicting the "overnight explosion theory," and molecular clock techniques estimate phylogenetic relationships but depend on assumptions.

Research suggests many molecular changes are neutral and accumulate randomly rather than being driven by selection. Recent evidence challenges traditional classification of Platyhelminthes, suggesting they may be distant relatives to all other animals.

Cnidarians capture prey using stinging cells, while coral reefs have complex species interactions, and individual selection can favor specific traits over community harmony. Sponges exhibit social behavior in experiments, potentially providing insights into embryonic development and multicellular evolution.

Eukaryotic life forms exhibit complex relationships between photosynthetic organisms, amoebas, slime molds, and fungi that form associations to create lichens. Radioactivity has various applications, while non-coding DNA in the human genome is debated among researchers.

Transposons play a role in genome evolution by facilitating gene duplication and regulating gene expression. Eukaryotic cells evolved from ancient single-celled organisms that merged with bacteria approximately 2 billion years ago, contributing to eukaryote evolution through biochemical innovations like photosynthesis.

The tree of life is complex, with relationships between chloroplasts, mitochondria, and eubacteria unclear. Genetic sequences reveal evolutionary relationships but are uncertain due to factors like DNA exchange among bacteria and difficulties in reconstructing ancestral history.

Researchers propose different scenarios for the origin of life, including prioritizing metabolism or self-replication. The concept of re-running evolution as a thought experiment identifies general laws of life, suggesting recurring patterns or lawfulness in evolution.

Independent evolution is observed across species with adaptations evolving multiple times due to universal physical principles on any planet with life. Evolution has led to unique biological features that have evolved only once, such as the bombardier beetle's explosion mechanism.

Convergent evolution shapes life on Earth, and evolutionary progress occurs in cycles of rapid change followed by periods of stability. Macroevolution is explained by natural selection and probability theory without requiring an additional mechanism or ingredient.

The concept of "evolution of evolvability" suggests that evolution itself can improve over time, allowing organisms to adapt and evolve more effectively.



