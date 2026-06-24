# epubts-node vs storyteller

- parserA: epubts-node
- parserB: storyteller
- both-opened (distinct books): 213

## Per-field outcomes

mismatch = differ + a-only + b-only.

| field | agree | differ | a-only | b-only | both-null | mismatch |
|---|---:|---:|---:|---:|---:|---:|
| title | 211 | 2 | 0 | 0 | 0 | 2 |
| creator | 213 | 0 | 0 | 0 | 0 | 0 |
| date | 168 | 0 | 0 | 0 | 45 | 0 |

## Spine comparison

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

## Manifest comparison

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

## Spine content hashes

| status | distinct books |
|---|---:|
| agree | 213 |
| differ | 0 |

per-book distinct spine-content sha256s / total spine positions (from epubts-node): 10601 / 10601

## TOC comparison

| status | distinct books |
|---|---:|
| agree | 27 |
| differ | 186 |

## Not compared

| reason | distinct books |
|---|---:|
| epubts-node not opened | 0 |
| storyteller not opened | 543 |
| neither opened | 0 |

## Mismatches

### test

- [abbott-flatland.epub](details/b02a83d74573bb8c2efc044fdf4f8f96644126fdf3f3924b06305daf83fdc792.md) — toc: differ
- [aristotle-nicomachean-ethics.epub](details/325b24eb9e3d2a85e765113ee34a0bfce46cafa43ffd131ebb0cb61d53c5f62b.md) — toc: differ
- [carroll-alice-in-wonderland.epub](details/c3d9fc744f42493b99d6117f272259e06e61fb550ca731dd753958262f8f6233.md) — toc: differ
- [dickens-tale-of-two-cities.epub](details/10f02d9c0abe47a6c5f28ce34d5eadf6da8c4749aefdcb20edf409fb5946bef6.md) — toc: differ

### space

- [Ada Palmer - Inventing the Renaissance/Ada Palmer - Inventing the Renaissance.epub](details/169d41060f90e52a6c0ce423524fd56cd7539c4500fadfa7eccc566a41014f5e.md) — toc: differ
- [Adam Becker - More Everything Forever/Adam Becker - More Everything Forever.epub](details/deb0e48e5e6dd19c582c99e7150d8d97935cc587cbd1882601c1ab4082a8d05e.md) — toc: differ
- [Adam Becker - What Is Real/Adam Becker - What Is Real.epub](details/2a7b6648b75d318fb2cd958e600a6d2532b503f4b48ebdef963d54a551bdb606.md) — toc: differ
- [Andrzej Sapkowski - The Witcher/Andrzej Sapkowski - The Witcher 1 - Blood of Elves/Andrzej Sapkowski - The Witcher 1 - Blood of Elves.epub](details/0337aaf5d9c4449f6837272116e4fc70b17860c13d6268d16828cbfbbe0cef2b.md) — toc: differ
- [Andrzej Sapkowski - The Witcher/Andrzej Sapkowski - The Witcher 3 - Baptism of Fire The Witcher/Andrzej Sapkowski - The Witcher 3 - Baptism of Fire The Witcher.epub](details/fb3336ee42aadb368d68be2442044a85bd136279d9860356ca15486fbaf909b9.md) — toc: differ
- [Andrzej Sapkowski - The Witcher/Andrzej Sapkowski - The Witcher 4 - The Tower of Swallows/Andrzej Sapkowski - The Witcher 4 - The Tower of Swallows.epub](details/0ed7947cc5aa5b1831513483ac16ef1951919f298f58d7f7e2bde878037ede9e.md) — toc: differ
- [Andrzej Sapkowski - The Witcher/Andrzej Sapkowski - The Witcher 5 - Lady of the Lake/Andrzej Sapkowski - The Witcher 5 - Lady of the Lake.epub](details/a7025b18e61830b960b672b48c61776288dad30a2897a30858b642ed0ffa2329.md) — toc: differ
- [Annaka Harris - Conscious/Annaka Harris - Conscious.epub](details/685075cd5388e8e98009a686d26c85c15bc7415f474f58f68c090ef4f72698b7.md) — toc: differ
- [Annie Duke - How to Decide/Annie Duke - How to Decide.epub](details/8b1b63b2b18d149d4c1ee162b107f7b489da350f499dfd92831e43c2501ae44d.md) — toc: differ
- [Annie Duke - Thinking in Bets/Annie Duke - Thinking in Bets.epub](details/b2f301e01df14c980bfd5c209e1a944ead840d5d0eafdfba3ea23307f3266035.md) — toc: differ
- [Antonio Padilla - Fantastic Numbers and Where to Find Them/Antonio Padilla - Fantastic Numbers and Where to Find Them.epub](details/a84aa663bf29088b99f80f181df989bcee989b0cd09a2ba9a14b2a2969415b9c.md) — toc: differ
- [Aristotle - Nicomachean Ethics and Eudemian Ethics/Aristotle - Nicomachean Ethics.epub](details/2a39f1ee32ba84745948095e500ea6e4ab703dcce93350a2706d8e1c92d79e22.md) — toc: differ
- [Ben Buchanan - The Hacker and the State/Ben Buchanan - The Hacker and the State.epub](details/5e15013e1e36d1dcdd301dc64d7eb66090bbc921085244acdf02df3c295fee0d.md) — toc: differ
- [Bent Flyvbjerg - How Big Things Get Done/Bent Flyvbjerg - How Big Things Get Done.epub](details/47b79c2693d51b83469a0af7baaa10a9943ecdcb0385ac13d4f763851ec14587.md) — toc: differ
- [Blake Crouch - Recursion/Blake Crouch - Recursion.epub](details/156ed18745405e960c719b3316b147de7e8a4f4c7ad60a12873c192da42394e0.md) — toc: differ
- [Blake Crouch - Upgrade/Blake Crouch - Upgrade.epub](details/b210ea276f4ffa5238bcac8d7f3a9f4d9bb1b1118d52d5b7fd87576e83a7218d.md) — toc: differ
- [Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 00 - Arcanum Unbounded/Brandon Sanderson - Mistborn 00 - Arcanum Unbounded.epub](details/76c496a1e4849c52c024d1da93df4cdfbec58b00705a1315cdcdfdcbb509c850.md) — toc: differ
- [Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 05 - Shadows of Self/Brandon Sanderson - Mistborn 05 - Shadows of Self.epub](details/8b102306387538e4eb455e15fdc4c33a0b5c8e4dc7c4f780f20d6f0914d06f70.md) — toc: differ
- [Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 07 - The Lost Metal/Brandon Sanderson - Mistborn 07 - The Lost Metal.epub](details/2a00e539e313a2a80250f7a12963945e503de3b44bfe70cb987d4f2ac5391242.md) — toc: differ
- [Brandon Sanderson - Stormlight Archive/Brandon Sanderson - Stormlight Archive 03 - Oathbringer/Brandon Sanderson - Stormlight Archive 03 - Oathbringer.epub](details/d45e3eedb4946928fcf5a018d63162e16d3752b75cb337e48e98afe0a286d619.md) — toc: differ
- [Brandon Sanderson - Stormlight Archive/Brandon Sanderson - Stormlight Archive 04 - Rhythm of War/Brandon Sanderson - Stormlight Archive 04 - Rhythm of War.epub](details/56bfef77a1d5da6b6a89823a6a3f00c7969fc3d35399aa142d942a7e46eb34d1.md) — toc: differ
- [Brene Brown - Atlas of the Heart/Brene Brown - Atlas of the Heart.epub](details/aab1a164f6bcbaaaaf11dce74926b135e116d813de36dbf12863d0d4b9b32199.md) — toc: differ
- [Brent Weeks - The LightBringer Saga/Brent Weeks - The Lightbringer Saga 04 - The Blood Mirror/Brent Weeks - The Lightbringer Saga 04 - The Blood Mirror.epub](details/5f6d2bebd6610e5a1d3163c135c864288b648931a906d262c239c99ccaa65f84.md) — toc: differ
- [Camilla Townsend - Fifth Sun/Camilla Townsend - Fifth Sun.epub](details/75be1db7e45f1138c90a4867acdf8aead5721287ccc2ec3d44f3ead7963435f9.md) — toc: differ
- [Carlo Rovelli - The Order of Time/Carlo Rovelli - The Order of Time.epub](details/b7f89f990cd98f30e982160dfb05c7807ba62d3f9658ec831ad19f8f30820270.md) — toc: differ
- [Carlo Rovelli - White Holes/Carlo Rovelli - White Holes.epub](details/b763a9c214a2e0a120a949f3a19017bf2677f98450ebc914727ed73bd8a63fbb.md) — toc: differ
- [Charles Stross - Accelerando/Charles Stross - Accelerando.epub](details/72379fe7498aae3b6dccc115e903c40f36f38032c4468cc04aa0266bb4d36f3a.md) — toc: differ
- [Chris Dixon - Read Write Own/Chris Dixon - Read Write Own.epub](details/02434eb4a91edae7fb29415c94c3ad01f2fe729fdca319d9b205d991b3c4138d.md) — toc: differ
- [Christopher Hibbert - Rome - The Biography of a City/Christopher Hibbert - Rome - The Biography of a City.epub](details/c65efa208d44b3cfa4a9910019823ecd30ee0ea810f641caf464be47e74557b9.md) — toc: differ
- [Christopher Ruocchio - Sun Eater/Christopher Ruocchio - Sun Eater 01 - Empire of Silence/Christopher Ruocchio - Sun Eater 01 - Empire of Silence.epub](details/1c4b22177f7d061d78a3b78c85e92cadcabfdcd66ceaa98ad123c7cf8d02a37a.md) — toc: differ
- [Christopher Ruocchio - Sun Eater/Christopher Ruocchio - Sun Eater 03 - Demon in White/Christopher Ruocchio - Sun Eater 03 - Demon in White.epub](details/0e60181bb2a0cf5abf2d506726d9be20eda4f4739cd18019bd06a6136064865c.md) — toc: differ
- [Christopher Ruocchio - Sun Eater/Christopher Ruocchio - Sun Eater 04 - Kingdoms of Death/Christopher Ruocchio - Sun Eater 04 - Kingdoms of Death.epub](details/e2a0e18abbf213faea64fe717c38d30af8ba98a1813b8470e83047d771d4bec0.md) — toc: differ
- [Christopher Ruocchio - Sun Eater/Christopher Ruocchio - Sun Eater 05 - Ashes of Man/Christopher Ruocchio - Sun Eater 05 - Ashes of Man.epub](details/5c831167bcf2c61a7781436f070745a5e689df5981c3be76fd51c9e743e379eb.md) — toc: differ
- [Cory Doctorow - Enshittification/Cory Doctorow - Enshittification.epub](details/0094a1a81cfc28eb1fe09330426233d871104b9289f83615269f2fe30ba5a638.md) — toc: differ
- [Cory Doctorow - Little Brother Series/Cory Doctorow - Little Brother 02.75 - Force Multiplier/Cory Doctorow - Force Multiplier.epub](details/aa671b70608518de9e6e928884a4a33b7e0a7d7ea4c0712d74aae98f86059380.md) — toc: differ
- [Cory Doctorow - Little Brother Series/Cory Doctorow - Little Brother 03 - Attack Surface/Cory Doctorow - Attack Surface.epub](details/319536e0a728bb8cb4dec57e33ae9ffe5b3786a37d522a2fbb3635e4edcb7bb2.md) — toc: differ
- [Cory Doctorow - Martin Hench 02 - The Bezzle/Cory Doctorow - Martin Hench 02 - The Bezzle.epub](details/b7851c5ffbddc2489125f74b0813a70ca0027bfa7136e7e58a39d135a6acad28.md) — toc: differ
- [Cory Doctorow - Martin Hench 03 - Picks and Shovels/Cory Doctorow - Martin Hench 03 - Picks and Shovels.epub](details/8983a32fad5257af2fbd1dbc9d789da2466eb299915a666204251a4d7f4b5f93.md) — toc: differ
- [Cory Doctorow - Martin Hench Series/Cory Doctorow - Martin Hench 01 - Red Team Blues/Cory Doctorow - Martin Hench 01 - Red Team Blues.epub](details/0189f8d66deb721241fed2697f32aba5133061065a72398711f1fe2dadc4455e.md) — toc: differ
- [Cory Doctorow - Reverse Centaurs Guide To Life After AI/Cory Doctorow - Reverse Centaurs Guide To Life After AI.epub](details/bcb9a94e6205a4ddda56120009abff08cf5c9a49ad0ae00467439c03229a9710.md) — title: epubts-node ≠ storyteller; toc: differ
- [Cory Doctorow - The Internet Con/Cory Doctorow - The Internet Con.epub](details/2c8b33b21084ff1f4dc56f74787b982d5ebb7deef15a7402a8215572fbea8bb4.md) — toc: differ
- [Cory Doctorow - The Lost Cause/Cory Doctorow - The Lost Cause.epub](details/4c96380acdc7267b9c4c4b259ca44687c724d37cf612ceffbe8c63ffcf150963.md) — toc: differ
- [Dan Jones - Essex Dogs/Dan Jones - Essex Dogs 01 - Essex Dogs/Dan Jones - Essex Dogs 01 - Essex Dogs.epub](details/298e3655e3534a99631ad9b2ce996aa8502e38feb0085f968859b573333a92f8.md) — toc: differ
- [Dan Jones - Essex Dogs/Dan Jones - Essex Dogs 02 - Wolves of Winter/Dan Jones - Essex Dogs 02 - Wolves of Winter.epub](details/1afff776fadf528d2ed125d62bfc984bc3c9864d99ad98dc9f3abbd872530c53.md) — toc: differ
- [Dan Jones - Essex Dogs/Dan Jones - Essex Dogs 03 - Lion Hearts/Dan Jones - Essex Dogs 03 - Lion Hearts.epub](details/62844cc26a82ce87c9a2fb030a8655bd61bb763de248b0b8f64183608b7525d7.md) — toc: differ
- [Daniel Wang - Breakneck/Daniel Wang - Breakneck.epub](details/92e3f517c578520559cc4703bd78da8da5e4ee68bacc601e91314792f6f816e9.md) — toc: differ
- [Dava Sobel - The Elements of Marie Curie/Dava Sobel - The Elements of Marie Curie.epub](details/d111e30337b3abbd2bd6a0b5e6997e3aeabb19eca8090db71e3ef0e0ada41f2d.md) — toc: differ
- [David Chalmers - Reality+/David Chalmers - Reality+.epub](details/f2a83efd297eda3146abe909f3e11fced4d4e4688ccc454e90d8e2571cf11dd9.md) — toc: differ
- [Dmitri Alperovitch - World on the Brink/Dmitri Alperovitch - World on the Brink.epub](details/3a2faf17a0bd21481b83eb46918841d3ec0ba230d9ded3e7e239041a59f4f74a.md) — toc: differ
- [Douglas Adams - The Hitchhiker's Guide to the Galaxy/Douglas Adams - THGTTG 01 - The Hitchhiker's Guide to the Galaxy/Douglas Adams - THGTTG 01 - The Hitchhiker’s Guide to the Galaxy.epub](details/7ff4408455ef7d90af55e81e60b4d13536f01914eba04b6c02693411cc2ee11a.md) — toc: differ
- [Ed Yong - An Immense World/Ed Yong - An Immense World.epub](details/7eb011d8ed4eb9f47f13d8b9689ad3d2b974b482ff8d9d2deaf1dcdf40421329.md) — toc: differ
- [Eliezer Yudkowsky - If Anyone Builds It Everyone Dies/Eliezer Yudkowsky - If Anyone Builds It Everyone Dies.epub](details/60ba24ad323e63ba89cfcb1daba5e458e5d28869bd3a10aeba4627564a44d527.md) — toc: differ
- [Elliot Ackerman - 2034 -  A Novel of the Next World War/Elliot Ackerman - 2034 - A Novel of the Next World War.epub](details/911dbb2f95d1c80cb5bc9202b99986cdaa369f81b61ce9dccc59631df76bb61b.md) — toc: differ
- [Elliot Ackerman - 2054 - A Novel/Elliot Ackerman - 2054 - A Novel.epub](details/d2a21a1ce39925acfa26d15ee7b912728a5fc30f9d405cd41fd3cc342e2791f9.md) — toc: differ
- [Emad Mostaque - The Last Economy/Emad Mostaque - The Last Economy.epub](details/ce48dccfdff4448303ac104015175e4414fa787db5c5c39877056fc5ffda4972.md) — toc: differ
- [Eric-Emmanuel Schmitt - La Traversee des temps/Eric-Emmanuel Schmitt - La Traversee des temps 01 - Paradis perdus/Eric-Emmanuel Schmitt - La Traversee des temps 01 - Paradis perdus.epub](details/f9e433b9efbe8cf50d43d7bdb4fde65ed73a8a5ed02ac79c2c0f92f108f3b949.md) — toc: differ
- [Evan Winter - The Burning/Evan Winter - The Burning 1 - The Rage of Dragons/Evan Winter - The Burning 1 - The Rage of Dragons.epub](details/f3ec6dd42958e798c4fd6271ca6f898ffa53e752df6eaafa637096f92dcafa5e.md) — toc: differ
- [Fonda Lee - The Green Bone Saga/Fonda Lee - The Green Bone Saga 0.5 - The Jade Setter of Janloon/Fonda Lee - The Green Bone Saga 0.5 - The Jade Setter of Janloon.epub](details/0756c06a13add06a5bb777fbd2fb1d1af687f030864d6e544637f066939bcf7d.md) — toc: differ
- [Fonda Lee - The Green Bone Saga/Fonda Lee - The Green Bone Saga 01 - Jade City/Fonda Lee - The Green Bone Saga 01 - Jade City.epub](details/20166d6d47a6d8bc0f94f2fe61d11993c9d9b305969f9bc029166b5a7e9b36b5.md) — toc: differ
- [Fonda Lee - The Green Bone Saga/Fonda Lee - The Green Bone Saga 02 - Jade War/Fonda Lee - The Green Bone Saga 02 - Jade War.epub](details/5f6d1b0833c1396ffcca4c7b6389231ba6bed2a4322597e57d3b3b33ab2dc276.md) — toc: differ
- [Fonda Lee - The Green Bone Saga/Fonda Lee - The Green Bone Saga 03 - Jade Legacy/Fonda Lee - The Green Bone Saga 03 - Jade Legacy.epub](details/b0a81775a5fa759630ffe331bb3257ff756c55e433ac20bb36ce3e339a3f85a5.md) — toc: differ
- [Fonda Lee - The Last Contract of Isako/Fonda Lee - The Last Contract of Isako.epub](details/61275386c327c9c9571f8007a70b2d19015241ffb9b90a7e24506c5057bedde3.md) — toc: differ
- [Frank Herbert - Dune Saga/Frank Herbert - Dune 04 - God Emperor of Dune/Frank Herbert - Dune 04 - God Emperor of Dune.epub](details/b6f12f71f475c49fd3e1576308ef2a0d29f5de9b264e19f7180b69ff28bb00df.md) — toc: differ
- [Fredrik Backman - Beartown/Fredrik Backman - Beartown 01 - Beartown/Fredrik Backman - The Beartown Trilogy.epub](details/12cd5abae4597af1139e6a83b1de137b550b4d9cd3ac257ed85e8616f856177e.md) — toc: differ
- [Guy Gavriel Kay - All the Seas of the World/Guy Gavriel Kay - All the Seas of the World.epub](details/eabaefe59d47601ce7db6aabbf46c325ee3183d16eb859609b9a5a7c6610eb39.md) — toc: differ
- [Helen Castor - The Eagle and the Hart/Helen Castor - The Eagle and the Hart.epub](details/c9ea8f17ebc9c65fd9fc95306ac027b72701c3e2c0d583506059b570eaa5c6cb.md) — toc: differ
- [Helen Czerski - The Blue Machine/Helen Czerski - The Blue Machine.epub](details/606e578d13d7d60ba4b36ae6664b5cfe7af08b7ba2de1f2464e563cfd04da761.md) — toc: differ
- [Helen Thompson - Disorder/Helen Thompson - Disorder.epub](details/bc1a231e6fbf1d7387e2e6d92fb4e8c5a78d3b09a0f26a0cdb3b9a143a187540.md) — toc: differ
- [Homer - The Iliad - t. Emily Wilson/Homer - The Iliad - t. Emily Wilson.epub](details/01fc14f93c040e94104a4a4b474eb0062e8a00a4ed3805719727be0510b9765d.md) — toc: differ
- [Ian Johnson - Sparks/Ian Johnson - Sparks.epub](details/880e1035ee8a6ae44e8ea3b791c9fb7675fc8b387d74049db79278dc042daa21.md) — toc: differ
- [Irvin Yalom - Existential Psychotherapy/Irvin Yalom - Existential Psychotherapy.epub](details/c50a34d391bcfc6bcc61541332c3b8a5c306616c1d1a94042f3c503870dd269d.md) — toc: differ
- [Italo Calvino - The Baron in the Trees/Italo Calvino - The Baron in the Trees.epub](details/f502b2bc16c7b3173a5ab9333ddbea53f1b2cef51cfd246ff3f5d10a7690cb95.md) — toc: differ
- [James Joyce - Dubliners/James Joyce - Dubliners.epub](details/d5e80dfd15da6e54499bc7dcd9debed479667ea948609a0ccfb0d35de55e9524.md) — toc: differ
- [Joe Abercrombie - The Age of Madness/Joe Abercrombie - The Age of Madness 02 - The Trouble with Peace/Joe Abercrombie - The Age of Madness - 02 - The Trouble with Peace.epub](details/fae01e896d2dc3e9d2f8ee451bc987edb376f922d4da475e4db3b3fa49e576bd.md) — toc: differ
- [Joe Abercrombie - The Age of Madness/Joe Abercrombie - The Age of Madness 03 - The Wisdom of Crowds/Joe Abercrombie - The Age of Madness - 03 - The Wisdom of Crowds.epub](details/e96560b6e3b743d5bdac41009053c05976a8bd507260d1e3b492406cb7432516.md) — toc: differ
- [Joe Abercrombie - The Devils/Joe Abercrombie - The Devils 01 - The Devils/Joe Abercrombie - The Devils 01 - The Devils.epub](details/791cf2ca3a4367af71f4211dd5207f07036d4405b264308e8ad95fae6482681f.md) — toc: differ
- [John Gwynne - Faithful and the Fallen/John Gwynne - Faithful and the Fallen 03 - Ruin/John Gwynne - Faithful and the Fallen 03 - Ruin.epub](details/52376d4a28f98bd554561eaa98ce4639acd5f9658d89147084d20f4ec0be32b9.md) — toc: differ
- [John Gwynne - Of Blood and Bone/John Gwynne - Of Blood and Bone 1 - A Time of Dread/John Gwynne - Of Blood and Bone 1 - A Time of Dread.epub](details/24a2c4179dd68f268a80c685ad43151fb8f41367c5a0959553a3cd47ec6be0ee.md) — toc: differ
- [John Gwynne - Of Blood and Bone/John Gwynne - Of Blood and Bone 2 - A Time of Blood/John Gwynne - Of Blood and Bone 2 - A Time of Blood.epub](details/92ac9300a3b88e01569195a884f5b2518f43251276b5abc3540179b258b1ea5d.md) — toc: differ
- [John Gwynne - Of Blood and Bone/John Gwynne - Of Blood and Bone 3 - A Time of Courage/John Gwynne - Of Blood and Bone 3 - A Time of Courage.epub](details/beedc3ab34629227ad1d2417890eb2108f8798d6b37acd0f5efd606672b04f40.md) — toc: differ
- [Jon Kabat-Zinn - Falling Awake/Jon Kabat-Zinn - Falling Awake.epub](details/81c279aad0cccb2ed2cfc6543c43c3538505ad0fd77756a791274a8273c2782b.md) — toc: differ
- [Katherine Addison - The Cemeteries of Amalo/Katherine Addison - The Cemeteries of Amalo 1 - The Witness for the Dead/Katherine Addison - The Cemeteries of Amalo 1 - The Witness for the Dead.epub](details/0d76e43661f109366290d8d5a29db24377508d64644c8c8d2f61ad18fb2c6791.md) — toc: differ
- [Katherine Addison - The Cemeteries of Amalo/Katherine Addison - The Cemeteries of Amalo 2 - The Grief of Stones/Katherine Addison - The Cemeteries of Amalo 2 - The Grief of Stones.epub](details/41f597993e1735d172a9fd5ea87873b5ae3a236e862e7bd7d3fb01003597516c.md) — toc: differ
- [Katherine Addison - The Cemeteries of Amalo/Katherine Addison - The Cemeteries of Amalo 3 - The Tomb of Dragons/Katherine Addison - The Cemeteries of Amalo 3 - The Tomb of Dragons.epub](details/c223402b8f5eadd8d808c39f571724b0aac4abbe68863a1acd44db05673ad8c4.md) — toc: differ
- [Ken Liu - All That We See or Seem/Ken Liu - All That We See or Seem.epub](details/48b4581f09111c1f54d4de28fd5012fd0f2d08a7896a9eef34214c2940c445fc.md) — toc: differ
- [Kevin J. Anderson - Clockwork Angels/Kevin J. Anderson - Clockwork Angels 02 - Clockwork Lives/Kevin J. Anderson - Clockwork Angels 02 - Clockwork Lives.epub](details/6776dc32783dcb1e356b2baa39df0e87d25b43c981e8ba587cbfc26ec2c14cb3.md) — toc: differ
- [Lee Smolin - Einstein's Unfinished Revolution/Lee Smolin - Einsteins Unfinished Revolution.epub](details/ccdf428758a7c5663524cc2a77a041d88e3af8179025afc81575ab3c26a4ce58.md) — toc: differ
- [Leslie Valiant - The Importance of Being Educable/Leslie Valiant - The Importance of Being Educable.epub](details/5c0f7f623d03ea7bda8d9d2ae9726725376ffc4417bc28cb7787e209bd4b081f.md) — toc: differ
- [Malcolm Gladwell - Revenge of the Tipping Point/Malcolm Gladwell - Revenge of the Tipping Point.epub](details/32f4fddc32f78003e03b394c645161e4366079814a72382bfc80b2b607d20f4d.md) — toc: differ
- [Margaret Atwood - Book of Lives/Margaret Atwood - Book of Lives.epub](details/63c62cf82ea59c6d67a4c0bc2aefff0301cbc139a8d7bcae15c7cab8ca5283fe.md) — toc: differ
- [Mark Lawrence - Book of the Ancestor/Mark Lawrence - Book of the Ancestor 1 - Red Sister/Mark Lawrence - Book of the Ancestor 1 - Red Sister.epub](details/69ceb13f49919aa6e4761d094f9fe46fa169bd0c69d45e7d9cbc3e4f53493fcf.md) — toc: differ
- [Mark Lawrence - Book of the Ancestor/Mark Lawrence - Book of the Ancestor 3 - Holy Sister/Mark Lawrence - Book of the Ancestor 3 - Holy Sister.epub](details/2f9ddd5da257e1550b669c12338cb9fb71cacb4d9ea41b4d797eab6acdbbd042.md) — toc: differ
- [Mark Lawrence - The Library Trilogy/Mark Lawrence - The Library Trilogy 02 - The Book That Broke the World/Mark Lawrence - The Library Trilogy 02 - The Book That Broke the World.epub](details/e68662ca290883c66352f422b52b34f536c575d7ebc6d97ad5d90dbb74d38cd3.md) — toc: differ
- [Mary Beard - Twelve Caesars/Mary Beard - Twelve Caesars.epub](details/2178e118969c38935355e1e67b0f5aac25718c663d7f30677deae8297b74f24b.md) — toc: differ
- [Matt Strassler  - Waves in an Impossible Sea/Matt Strassler  - Waves in an Impossible Sea.epub](details/47b664ed2587d05cc8c0bd12cbc6d0e3bd435058baa579e83c7acba4046e3a2f.md) — toc: differ
- [Max S. Bennett - A Brief History of Intelligence/Max S. Bennett - A Brief History of Intelligence.epub](details/2d68c96ea35e3cee99f51762df1075098ba96b8c8d3c9214172bd8562dbea5e4.md) — toc: differ
- [Michael Lewis - Going Infinite/Michael Lewis - Going Infinite.epub](details/26e41571dab280cf139dc9dde414cbf25f782265cd1102fd4193c80cac50b758.md) — toc: differ
- [Michael Lewis - The Premonition/Michael Lewis - The Premonition.epub](details/66a565d81d52edcea6c41e414f983a37e0b58a6124faa9fa34620832d969764b.md) — toc: differ
- [Moudhy Al-Rashid - Between Two Rivers/Moudhy Al-Rashid - Between Two Rivers.epub](details/b364e0e6016dbc9358924bb21370af3d86ec8ed784e82dd6380fcce9a618c6b0.md) — toc: differ
- [N.K. Jemison - The Broken Earth/N.K. Jemison - The Broken Earth 01 - The Fifth Season/N.K. Jemison - The Broken Earth 01 - The Fifth Season.epub](details/072b2a9875395565575109f257caea96357aff4644cf04c267a45d2ca08ddeb4.md) — toc: differ
- [Naomi Klein - Doppelganger/Naomi Klein - Doppelganger.epub](details/abb4f6247cf89676e001cee160a93e11c8ef26c95e4cedde3dbbe4c76b0f8094.md) — toc: differ
- [Neal Stephenson - Bomb Light/Neal Stephenson - Bomb Light 01 - Polostan/Neal Stephenson - Bomb Light 01 - Polostan.epub](details/1cddaffbb460970ce6e7c7a63d45b96cfeebf2fee2339261597954091c4a9912.md) — toc: differ
- [Niall Ferguson - Doom/Niall Ferguson - Doom.epub](details/3c26a7735bd7a3dd2b2354bd4de691a4cf6a0ac81c0fe7d8de1226ebd75ca122.md) — toc: differ
- [Nick Lane - Transformer/Nick Lane - Transformer.epub](details/54d8b1a4f240f3cb2f49e8a7bd9cfbe9ace1a04902d1ac8827ba33f1722691e0.md) — toc: differ
- [Orville Schell - My Old Home/Orville Schell - My Old Home.epub](details/06dcca2916c4833b7d0a83877456113ff320c07a265d50ca75eea640cd16ca74.md) — toc: differ
- [Patrick Rothfus - Kingkiller Chronicle/Patrick Rothfus - Kingkiller Chronicle 02.6 - The Narrow Road Between Desires/Patrick Rothfus - Kingkiller Chronicle 02.6 - The Narrow Road Between Desires.epub](details/a9ab5623f8871f583ca32f705d608a2f7e7516096a7796214a5ab6774120eec1.md) — toc: differ
- [Peter McLean - War for the Rose Throne/Peter McLean - War for the Rose Throne 01 - Priest of Bones/Peter McLean - War for the Rose Throne 01 - Priest of Bones.epub](details/5df9ecc4d646fd31c00547b23f97f1abcb6a159df9e8cd15236a68d924a19afe.md) — toc: differ
- [Peter McLean - War for the Rose Throne/Peter McLean - War for the Rose Throne 02 - Priest of Lies/Peter McLean - War for the Rose Throne 02 - Priest of Lies.epub](details/19d0826270948571061dd562496551b0e8f798cc4a3e89e5a2dcd964dfa701cd.md) — toc: differ
- [Ray Kurzweil - The Singularity Is Nearer/Ray Kurzweil - The Singularity Is Nearer.epub](details/96fed3474784695fa733a6f62b8724bd3d28905665390fbbc555da354cf7ff48.md) — toc: differ
- [Rebecca Wragg Sykes - Kindred/Rebecca Wragg Sykes - Kindred.epub](details/0694253d5c08ef0267fcb029acad8288ee1ada44e6a108440ee05455361eba2b.md) — toc: differ
- [Richard Dawkins - The Blind Watchmaker/Richard Dawkins - The Blind Watchmaker.epub](details/01af7c74d623f2bcddf292a085742b122d4c5b15d46b476368bf2420f6d828b8.md) — toc: differ
- [Richard Dawkins - The Genetic Book of the Dead/Richard Dawkins - The Genetic Book of the Dead.epub](details/6fb0bd4c3d65846fd08520b4c1b90112aad4173894bda1babab11906aeeb32df.md) — toc: differ
- [Robert Frost - The Road Not Taken/Robert Frost - The Road Not Taken.epub](details/e3363d6e292ab87f2fbcb41e5c7e675e7e6294f2f2d5c27dd0eee878a981cb85.md) — toc: differ
- [Robert M. Sapolsky - Determined/Robert M. Sapolsky - Determined.epub](details/d6fc05bb0b9e2668a4ccdb3d48d97bf4b68684b7231a01b892502bfa7505263c.md) — toc: differ
- [Robert Sheckley - Dimension Of Miracles/Robert Sheckley - Dimension of Miracles.epub](details/78d72e2170ff67fb61e485e1e5377f83260f4c201268a048f55c55da2f962af7.md) — toc: differ
- [Rush Doshi - The Long Game/Rush Doshi - The Long Game.epub](details/1e953c30a97af6f3a71478ad100145a736bcaa4da617fd7faf20071286f7a7ab.md) — toc: differ
- [Scott Anderson - King of Kings/Scott Anderson - King of Kings.epub](details/e9fa391085435097dabdf48268e5e99e1a77e4669808cd2dae7ebcc9e7844749.md) — toc: differ
- [Sean Carroll - Quanta and Fields/Sean Carroll - Quanta and Fields.epub](details/4ccd7c25cb8b36015d1ee19416c9a921988148f6bd8e5be13df1d986014af1f6.md) — toc: differ
- [Sebastian Mallaby - The Infinity Machine/Sebastian Mallaby - The Infinity Machine.epub](details/4bd2ebd41f377478b9bf2c1ff8843eb942cdeda7b9ce87cd4f204554689e91c3.md) — toc: differ
- [Shelby Van Pelt - Remarkably Bright Creatures/Shelby Van Pelt - Remarkably Bright Creatures.epub](details/82bab800f37ab77a0c977380b2dff7030a558fbe7d5f23284b4349d2ba79b597.md) — toc: differ
- [Stephen Budiansky - Journey to the Edge of Reason/Stephen Budiansky - Journey to the Edge of Reason.epub](details/30559b81175f69e8df4e1c04a92db9cdece691e286f5162bb2c7fa5f4a19840e.md) — toc: differ
- [Stephen Fry - Mythos/Stephen Fry - Mythos 03 - Troy/Stephen Fry - Mythos 03 - Troy.epub](details/63b088854bc77757b4c739809d87ae0b25e44883051bb07af278bcbf29448718.md) — toc: differ
- [Stephen Fry - Mythos/Stephen Fry - Mythos 04 - Odyssey/Stephen Fry - Mythos 04 - Odyssey.epub](details/65a63400495161d438fcc86bee226be601c467ecee13276e9c5d06bdf3379a3e.md) — toc: differ
- [Stephen Kotkin - Stalin/Stephen Kotkin - Stalin 02 - Waiting for Hitler/Stephen Kotkin - Stalin 02 - Waiting for Hitler.epub](details/086aca48532fc5982fd463b1482fc2de8a9951bbe8a16a406a83a6b42389bf37.md) — toc: differ
- [Steven Brust - Vlad Taltos/Steven Brust - Vlad Taltos 16 - Tsalmoth/Steven Brust - Vlad Taltos 16 - Tsalmoth.epub](details/040211383313d046efbc1e0cc3b698b74fbec0a9b94996638bd4fd1afae22aed.md) — toc: differ
- [Steven Pinker - Rationality/Steven Pinker - Rationality.epub](details/7f0f75b2680865d76c8520fbb337d8d5f315b2f9f088426de277a581662ff0b7.md) — toc: differ
- [Ted Chiang - Exhalation/Ted Chiang - Exhalation.epub](details/70e370dc89a18f3f7399587cfd114350efc1c3b1f998ea7db7f2db1d510091b4.md) — toc: differ
- [Terry Pratchett - Discworld/Terry Pratchett - Discworld 41 - The Shepherd's Crown/Terry Pratchett - Discworld 41 - The Shepherd's Crown.epub](details/687b01bc251607d05f23df4b2868770f79b40aceaf9689e45a8d69c27f514367.md) — toc: differ
- [Thomas Hertog - On the Origin of Time/Thomas Hertog - On the Origin of Time.epub](details/3ada9826324d0560a6e8ff12fe51612f5c3ad59c8ed648f972a9058f3ade5d5d.md) — toc: differ
- [Thomas Hughes - Tom Brown's Schoodays/Thomas Hughes - Tom Brown's Schoodays.epub](details/d7159d38d8d45abe453450484984b2ce9ab9b6b40b414e4b578591187617e77b.md) — toc: differ
- [Thomas Lin - The Prime Number Conspiracy/Thomas Lin - The Prime Number Conspiracy.epub](details/f80ef6322d43ae78a15c368131ee792122b2023ef11bb5ae043b2d159a651fb3.md) — toc: differ
- [Tim Harford - The Data Detective/Tim Harford - The Data Detective.epub](details/da6e47f493761c274e81b60c079864336a49bb8ee9effd199dd66bb02d01fd6f.md) — toc: differ
- [Tom Holland - Pax/Tom Holland - Pax.epub](details/57182d67646cd937749196fa3dddba29f28144db17c68f75eb282b46fe9a0cdb.md) — toc: differ
- [Travis Baldree - Legends & Lattes/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust/Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust.epub](details/84b753d6894ffcf1b6f6f0d7c63cfdfa7ec605c030f16286a77030fdb20323e9.md) — title: epubts-node ≠ storyteller; toc: differ
- [Ursula K. Le Guin - Hainish Cycle/Ursula K. Le Guin - Hainish Cycle 09 - Five Ways to Forgiveness/Ursula K. Le Guin - Hainish Cycle 09 - Five Ways to Forgiveness.epub](details/2d0d7b8babf80ae5e8223b71c858de87e1a83216ce2ca04026af1e1b81efbd6b.md) — toc: differ
- [Warwick F. Vincent - Lakes/Warwick F. Vincent - Lakes.epub](details/eb97831cfa1a5e65b2f9aaae3cf86c71fc317d0dc4af9ead2fe49a3171dcea1a.md) — toc: differ
- [William Dalrymple - The Golden Road/The Golden Road.epub](details/9cac4298c020e1de8d02c9fddad825aa97459e5784c408cdb95a075e7f2dfbcd.md) — toc: differ
- [William Egginton - The Rigor of Angels/William Egginton - The Rigor of Angels.epub](details/e3d1bc0cb40446e78be6590dfd61a26ecb0ff217d56edd141bfeab799b406959.md) — toc: differ
- [Wolfgang Munchau - Kaput/Wolfgang Munchau - Kaput.epub](details/e627b244986e82f5664d3f282dbb5f66a780224ec9aa5049eca68b7f475b40ef.md) — toc: differ
- [Yuval Noah Harari - 21 Lessons for the 21st Century/Yuval Noah Harari - 21 Lessons for the 21st Century.epub](details/1061567f32fe500ef601616c8a9e9d0788f8586ebca5f333777e6e19528a8992.md) — toc: differ
- [Yuval Noah Harari - Nexus/Yuval Noah Harari - Nexus.epub](details/0aad59737fd1709a553e6d09c34e921d523694ed78e0a43fa9c6f1d633c4758a.md) — toc: differ

### drop

- [Amanda H. Podany - Weavers, Scribes, and Kings - A New History of the Ancient Near East.epub](details/164ea58eabb1782daa06745269bb8ba9ddceb4395d303dcfa30c7871d39528ba.md) — toc: differ
- [Andrew Pontzen - The Universe in a Box.epub](details/ff84af75f2ad932c456e054c2c55c062c7ad210499061fd866cbbdfe1ed22d5f.md) — toc: differ
- [Azeem Azhar - Exponential.epub](details/7ce044bcd9c7023cb16c81999b70b3a0e8ed71825cf8a94672108fc0c1ad5634.md) — toc: differ
- [Bertrand Russsel - The Problems of Philosophy.epub](details/0d2d1bd1dee453fafbdfcc37b76ec5022dd34fb526b75d97e1eb916b9d48a8b8.md) — toc: differ
- [Claudia de Rham - The Beauty of Falling - A Life in Pursuit of Gravity.epub](details/14d5d217b70307c7d60b37fd1757c9e8d76c40f6515b6886cd6aab5981307483.md) — toc: differ
- [Dan Jones - Powers and Thrones, A New History of the Middle Ages.epub](details/885a980661aaf982f27f851f97af5366e3ae494cf995f96e90657e32e0212cba.md) — toc: differ
- [David Shariatmadari - Don't Believe a Word.epub](details/f9ba5d3f0a919be34c9d680b35e81f5af168996760d1ecee673aefcac4917905.md) — toc: differ
- [Dmitry Grozoubinski - Why Politicians Lie About Trade.epub](details/eface5f8032579a015723986019bf66cafc59fca36160d09b6cd51791f254fb5.md) — toc: differ
- [Douglas Adams - The Hitchhiker's Guide to the Galaxy/Douglas Adams - The Hitchhiker's Guide to the Galaxy Omnibus.epub](details/ae2fbc6ec76262e5df9e86aad680107f6bf0b988864a021ccb4451571f07c989.md) — toc: differ
- [Edward Chancellor - The Price of Time The Real Story of Interest.epub](details/a5bca1405e7d5950fbf439a2f58fb0a1cf0bb4986f6baeef6a516be2779a4532.md) — toc: differ
- [Edward Shawcross - The Last Emperor of Mexico - A Disaster in the New World.epub](details/3a2cc7925eb0548c016e7064f236194a504d759362dd4dbf5ef6e822c8abcdc3.md) — toc: differ
- [Eric-Emmanuel Schmitt - La Traversee des temps 04 - La Lumiere du bonheur.epub](details/caaac3d4dc76c111d91c4e3e37001d8e145080049793c279db021ee5d61953b1.md) — toc: differ
- [Frank Dikötter - China After Mao.epub](details/a384895800c4627f1dcf40788a957da0b7339bd52012857fdd6713103fd541e0.md) — toc: differ
- [Frank Wilczek - Fundamentals.epub](details/482987b4750b02a48d0cea5ec47bd54b65b669c34110c0e0e4e8ae9900ac891f.md) — toc: differ
- [Geoff Manaugh Nicola Twilley - Until Proven Safe The History and Future of Quarantine.epub](details/9969b480b54959b42acc27f8d0663e8dc1d3f4326732e01c5ffee508ce36dc86.md) — toc: differ
- [George F. Will - American happiness and discontents.epub](details/c74ab5c2747e902ac7cc4c5e5dfd74331228c568e8dc3747e9a95d536adf254a.md) — toc: differ
- [Harold Bloom - The Western Canon.epub](details/10a8391bcf6ad55e7556e4cc46beaca0aa9f0994ca4d5c6a9a3d828bec4d8a82.md) — toc: differ
- [Helen Thompson - Disorder.epub](details/111d63917dce0a4b7251b8c880d8fb8288f9310b26e1d6a4901479e0138c90fd.md) — toc: differ
- [J. Bradford DeLong - Slouching Towards Utopia.epub](details/d1599b9df8fb429f4325ea74b65d16b0250e8c0a2598a76cdda35ff1ae3ce0af.md) — toc: differ
- [Jo Nesbo - The Jealousy Man and Other Stories.epub](details/454534498a30b6ac06c878c8fbb76de57b8aba9d36e52e769798072d7c512840.md) — toc: differ
- [Kim Stanley Robinson - The Ministry for the Future.epub](details/bd9ac8b65a05defba9428d2dd954262a70c3ac566134a22af531b2850583285b.md) — toc: differ
- [Lee McIntyre - How to Talk to a Science Denier.epub](details/01ab5f9b482d1344f65cea457b2ddb9e8c1ab55d8fb102fc0ed6b93992b0a39b.md) — toc: differ
- [Mathematics/Roger A. Grimes - Cryptography Apocalypse.epub](details/aba46548795ef5f2ce08cffc352cb92a1fa3327c452d263d83c6d0e6a3c55568.md) — toc: differ
- [Morten H. Christiansen, Nick Chater - The Language Game.epub](details/6031d18e49c336f677a5409527c7f58e9240cf5863d1b371521ac2e24279d149.md) — toc: differ
- [Nicole Forsgren - Accelerate.epub](details/420eb86d14b2a90cba145ad4452a3e266b1dfce1b06c43fa1a0a5fb02e4c9146.md) — toc: differ
- [Nicole Perlroth - This Is How They Tell Me the World Ends.epub](details/b063f0ad017610246dd53496b926793340e9a78979ea6b033f8f626debe0a594.md) — toc: differ
- [Nicole Yunger Halpern - Quantum Steampunk.epub](details/b2265e3393b7b3cc7077af28049be3a8b5d978e043698fddf4ac1bef03b1fece.md) — toc: differ
- [Peter Zeihan - The End of the World is Just the Beginning.epub](details/8fec104682971d7bbd738213393ea55852af4a38fd718cc371ea92a9aab71a1e.md) — toc: differ
- [Philip Ball - Beyond Weird.epub](details/94103f99c27a4d84b9d4c25bf373faee6db41752464602d804683ab677dfc908.md) — toc: differ
- [Physics/Carlo Rovelli - Helgoland.epub](details/e0675116556e58aa817e6cbeb6d234c26a438b402dfb7e65ff53be6c2b120472.md) — toc: differ
- [Physics/Space at the Speed of Light - Dr. Becky Smethurst.epub](details/06696a62fe65fd59028f8f83701eb495a5ffc09eb89b30e92dd02d278715c149.md) — toc: differ
- [Seb Falk - The Light Ages_ The Surprising Story of Medieval Science.epub](details/1c8ee24c78d3adf9d368c4f44f527e7c6003ff053ea7fbb581989a8710395b49.md) — toc: differ
- [Simon Winchester - The Breath of the Gods.epub](details/f486a7740f8de707eecdff25891514c61ac1186ba6b9fb98cc3ee0ff401fa663.md) — toc: differ
- [Steven Brust - Vlad Taltos/Steven Brust - Vlad Taltos 15 - Vallista.epub](details/d1e2808a26a0a04a986ec2c7a408df7ca614355699fd4d6968dd3635ea4963b4.md) — toc: differ
- [Tech/DevOps/Viktor Farcic - Crossplane.epub](details/1f3570465769b3a0c2663b30facafd8f76bdd1dc23281b51073c2c7ba45d25fd.md) — toc: differ
- [Tim Harford - The Data Detective.epub](details/912319d9ab94081a3f7e631e7baa2fcef5f71af31bdb11ba9e54991e0893141a.md) — toc: differ
- [Tom Holland - Pax-15MB.epub](details/3e729d1b5726c99fca04aa2ed7f9430680b0101f66a7097f99aa8ab3de9d8df4.md) — toc: differ
- [Tony Fadell - Build.epub](details/1ceb22cee3db13fdc8cfbd5f432414bbffcbe3e135b9d231b4da15eb2cdd645a.md) — toc: differ
- [Travel/Christopher Hibbert - Rome - The Biography of a City.epub](details/d4d2392bbe920aa1abcc517b0c175c6db6f373c8b3051c69663640015a74989b.md) — toc: differ
- [Viktor Farcic - Crossplane.epub](details/76ec3eeccf258a6db3f1369907723318384e61d722c5824f8198bda026b4eefa.md) — toc: differ
- [William MacAskill - What We Owe the Future.epub](details/04959e2a801491a574216ad08ecfa43db203d6a88c1fc2e1f29bdc3cc873db03.md) — toc: differ
