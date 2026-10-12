/* 《米侦探：粮食王国大追捕》粮食作物档案库
 * 说明：本文件为游戏默认知识库，所有作物特征、加工用途、营养信息均已人工核对。
 * 涉及中国粮食统计数字时，以「国家统计局2025年12月12日《关于2025年粮食产量数据的公告》」为准。
 * 结构：window.CROPS —— 每种粮食作物含「六维档案」与「分层线索」。
 */
window.CROPS = [
  {
    id: 'rice',
    name: '水稻',
    grainName: '稻谷',
    emoji: '🌾',
    color: '#6FBF73',
    accent: '#3E8E4A',
    scene: 'ricefield',
    badge: '🌾',
    difficulty: 'easy',
    summary: '喜欢泡在水里长大的「水中黄金」，脱掉外壳就变成白米。',
    dimensions: {
      appearance: '幼苗细细长长、绿油油的；成熟后稻穗低垂，结出一串串金黄色的谷粒。谷粒外面包着一层稻壳，脱掉壳就是白米。',
      habit: '喜欢温暖湿润，是「爱喝水」的庄稼，稻田里常常蓄着一层浅浅的水；怕冷，生长期间需要充足的阳光。',
      region: '主要住在南方，长江流域及以南地区最多；东北的黑龙江等地也出产有名的大米。',
      process: '稻谷 → 脱壳 → 糙米 → 碾米 → 白米 → 煮成米饭。还能磨成米粉做米线、糕点；糯米用来包粽子、打年糕。',
      nutrition: '主要为身体提供碳水化合物（淀粉）和一部分蛋白质，是我国最重要的主粮之一。米糠可以做饲料，稻草能编织、还田。',
      life: '米饭、白粥、米线、粽子、年糕、米饼……南方小朋友每天都能见到它。'
    },
    clues: [
      { level: 1, dimension: '生长习性', text: '我的幼苗喜欢温暖湿润的环境，生长的时候，脚下常常蓄着一层浅浅的水。' },
      { level: 2, dimension: '外形特征', text: '我成熟以后，会结出一串串沉甸甸的谷粒，把自己的腰都压弯了。' },
      { level: 3, dimension: '生产加工', text: '经过脱壳、碾米等加工过程，我可以变成餐桌上最常见的主食。' },
      { level: 4, dimension: '生活关联', text: '端午节的粽子、早餐的米线，还有那块甜甜的米糕，都和我有关。' }
    ],
    foods: ['米饭', '白粥', '米线', '粽子', '年糕', '米糕'],
    knowledgeCard: '水稻是「爱喝水」的庄稼，稻田要蓄水、气候要温暖，所以它主要住在南方。稻谷脱掉稻壳、碾去米糠就变成了我们天天吃的白米。'
  },
  {
    id: 'wheat',
    name: '小麦',
    grainName: '麦子',
    emoji: '🌾',
    color: '#E8B44A',
    accent: '#C08A1E',
    scene: 'wheatfield',
    badge: '🍞',
    difficulty: 'medium',
    summary: '磨成粉就能变出无数面食的「北方主食担当」。',
    dimensions: {
      appearance: '麦秆直立，麦穗上整整齐齐排着麦粒；成熟时整片麦田变成金灿灿的海洋。',
      habit: '比较耐寒也耐旱。有秋天播种、第二年夏天收获的「冬小麦」，也有春天播种、秋天收获的「春小麦」。',
      region: '主要住在北方，河南、山东、河北、安徽、江苏北部等黄淮海地区最多；东北也种春小麦。',
      process: '小麦 → 磨成面粉 → 做成馒头、面条、饺子皮、面包、饼干、蛋糕；剩下的麦麸可以做饲料。',
      nutrition: '含有碳水化合物、蛋白质（面筋）、B族维生素和膳食纤维，是我国北方最主要的粮食。',
      life: '馒头、包子、饺子、面条、面包、饼干、蛋糕、油条，都是它变出来的。'
    },
    clues: [
      { level: 1, dimension: '生长习性', text: '我不太怕冷，可以秋天种下去、第二年夏天收获，也可以春天播种秋天收获。' },
      { level: 2, dimension: '外形特征', text: '我成熟的时候，整片田野会变成金灿灿的海洋；细长的穗子上，整整齐齐排着一粒粒饱满的籽粒。' },
      { level: 3, dimension: '生产加工', text: '把我磨成细细的粉，就能变出各种香喷喷的面食。' },
      { level: 4, dimension: '分布区域', text: '我主要住在北方，河南、山东、河北那一带的田地里，有我的许多兄弟姐妹。' }
    ],
    foods: ['馒头', '面条', '饺子', '面包', '饼干', '蛋糕'],
    knowledgeCard: '小麦最厉害的本领是「能磨成粉」。麦粒里有一种叫面筋的蛋白质，所以面粉能揉成面团、拉成面条、发成馒头。我国北方的主食大多来自小麦。'
  },
  {
    id: 'corn',
    name: '玉米',
    grainName: '玉米棒',
    emoji: '🌽',
    color: '#F2C744',
    accent: '#D19E10',
    scene: 'cornfield',
    badge: '🌽',
    difficulty: 'medium',
    summary: '个子最高、产量最大的「高产冠军」，还是爆米花的原料。',
    dimensions: {
      appearance: '个子高高的，腰间挂着一个裹着绿皮（苞叶）的「大棒子」，剥开是金黄（也有白、紫色的）玉米粒，头顶还长着长长的玉米须。',
      habit: '喜欢温暖和充足的阳光，比较耐旱，是很能「出粮食」的高产作物。',
      region: '我国种植面积最大的粮食作物。东北的吉林、黑龙江、辽宁和华北的河南、山东、河北都大面积种植。',
      process: '玉米粒可以煮着吃、做玉米糊、爆爆米花；磨成玉米面做窝头、玉米饼；还能榨玉米油。它也是重要的饲料和工业原料。',
      nutrition: '含有碳水化合物、膳食纤维和玉米黄素等，营养比较丰富，但蛋白质不够全面。',
      life: '煮玉米、爆米花、玉米糊、玉米油，还有喂猪喂鸡的饲料里都少不了它。'
    },
    clues: [
      { level: 1, dimension: '外形特征', text: '我个子高高的，腰间挂着一个裹着绿皮的「大棒子」，头顶还长着长长的须。' },
      { level: 2, dimension: '生长习性', text: '我喜欢温暖和充足的阳光，比较耐旱，还是很能「出粮食」的高产作物。' },
      { level: 3, dimension: '分布区域', text: '东北和华北的大片田地里都有我，我的种植面积在我国粮食作物里排第一。' },
      { level: 4, dimension: '生活关联', text: '电影院门口香喷喷的爆米花、早餐那碗玉米糊，都是我变的。' }
    ],
    foods: ['煮玉米', '爆米花', '玉米糊', '玉米油', '窝头'],
    knowledgeCard: '玉米是我国种植面积最大的粮食作物，也是名副其实的「高产冠军」。它不但能当粮食吃，还能做成油、淀粉和饲料，是重要的「多面手」。'
  },
  {
    id: 'soybean',
    name: '大豆',
    grainName: '黄豆',
    emoji: '🫘',
    color: '#D9A94E',
    accent: '#A87A22',
    scene: 'soyfield',
    badge: '🥛',
    difficulty: 'hard',
    summary: '会「养地」的植物蛋白之王，被叫做「田里的肉」。',
    dimensions: {
      appearance: '个子不高，身上挂着一串串小豆荚，剥开就有圆滚滚的黄色小豆子；成熟后豆荚变黄、干裂。',
      habit: '根部住着能「制造氮肥」的根瘤菌，所以种过大豆的土地会更肥沃；喜欢温暖，需要充足阳光。',
      region: '东北的黑土地是它最重要的家，黑龙江、内蒙古、吉林、辽宁是主产区，黄淮海地区也有种植。',
      process: '黄豆可以榨豆油；做豆浆、豆腐、豆干、腐竹、酱油、豆腐脑；榨油剩下的豆粕是最好的饲料蛋白。',
      nutrition: '蛋白质含量很高，被称为「植物蛋白之王」和「田里的肉」，还含有不饱和脂肪酸、钙和大豆异黄酮。',
      life: '早餐那杯豆浆、餐桌上的豆腐、炒菜用的酱油和豆油，都是它变出来的。'
    },
    clues: [
      { level: 1, dimension: '外形特征', text: '我个子不高，身上挂着一串串小豆荚，剥开就有圆滚滚的黄色小豆子。' },
      { level: 2, dimension: '生长习性', text: '我的根上住着会「制造肥料」的小帮手，所以我种过的地方，土地会变得更肥沃。' },
      { level: 3, dimension: '分布区域', text: '我的家在东北的黑土地，黑龙江和内蒙古是我最重要的产区。' },
      { level: 4, dimension: '生产加工', text: '人们用我磨豆浆、做豆腐、榨豆油，还夸我是「田里的肉」。' }
    ],
    foods: ['豆浆', '豆腐', '豆油', '酱油', '腐竹'],
    knowledgeCard: '大豆是粮食家族里的「营养担当」，蛋白质特别丰富，所以被叫做「田里的肉」。它根上的根瘤菌能制造氮肥，种过大豆的土地会更肥沃。'
  },
  {
    id: 'potato',
    name: '马铃薯',
    grainName: '土豆',
    emoji: '🥔',
    color: '#C99A63',
    accent: '#966B33',
    scene: 'potatofield',
    badge: '🥔',
    difficulty: 'hard',
    summary: '把果实藏在地下的「第四大主粮」，薯条的原料。',
    dimensions: {
      appearance: '果实藏在地下，圆滚滚的块茎，黄皮或红皮，表面有一个一个「芽眼」；地上开着白色或紫色的小花。',
      habit: '喜欢凉爽的天气，怕高温也怕霜冻，生长期比较短，适合高原和山区。用薯块（种薯）来繁殖。',
      region: '甘肃、内蒙古、四川、贵州、云南等冷凉地区最多，北方和西南山区是它的主产区。',
      process: '可以做成薯条、薯片、土豆泥、土豆粉条；也能提取淀粉；还能磨成粉做土豆馒头、土豆面条。',
      nutrition: '含有丰富的淀粉（可以当主食）、维生素C和钾，比米饭更容易吃饱。我国把它列为重要的主粮之一。',
      life: '薯条、薯片、土豆丝、土豆炖牛肉、土豆泥，都是它的身影。'
    },
    clues: [
      { level: 1, dimension: '生活关联', text: '我成熟以后，会被切成条炸一炸，变成小朋友都爱吃的薯条。' },
      { level: 2, dimension: '外形特征', text: '我的果实藏在泥土里，圆滚滚的，身上还有一个一个的小「芽眼」。' },
      { level: 3, dimension: '生长习性', text: '我喜欢凉爽的天气，怕热也怕霜冻，在高原和山区长得特别好。' },
      { level: 4, dimension: '营养用途', text: '我含有丰富的淀粉，可以当主食吃，国家把我列入了重要的主粮队伍。' }
    ],
    foods: ['薯条', '薯片', '土豆丝', '土豆泥', '土豆粉条'],
    knowledgeCard: '马铃薯把果实藏在地下，靠「芽眼」长出新苗。它含有丰富的淀粉，既能当菜也能当主食，是我国重要的主粮之一。'
  }
];

/* 按 id 快速取作物 */
window.getCrop = function (id) {
  if (!window.CROPS) return null;
  for (var i = 0; i < window.CROPS.length; i++) {
    if (window.CROPS[i].id === id) return window.CROPS[i];
  }
  return null;
};

/* 供 UI 使用的场景元数据 */
window.SCENES = {
  ricefield: { label: '稻田', sky: ['#BFE9FF', '#E8F7D9'], ground: '#7CC47F', accent: '#3E8E4A' },
  wheatfield: { label: '麦田', sky: ['#FFE9B8', '#FFF6DD'], ground: '#E8C259', accent: '#C08A1E' },
  cornfield: { label: '玉米地', sky: ['#CDEBFF', '#EAF9D6'], ground: '#8CCB6A', accent: '#D19E10' },
  soyfield: { label: '大豆田', sky: ['#D6ECFF', '#F0F7DC'], ground: '#93C07A', accent: '#A87A22' },
  potatofield: { label: '马铃薯地', sky: ['#DCEBFF', '#F2F6E0'], ground: '#A8B87A', accent: '#966B33' },
  granary: { label: '粮仓', sky: ['#F3E3C3', '#FBF2DF'], ground: '#C08A4E', accent: '#8A5A22' },
  road: { label: '乡村道路', sky: ['#CFE9FF', '#FFF3D9'], ground: '#B9C48E', accent: '#6E7A3E' },
  investigation: { label: '米侦探调查室', sky: ['#2A3566', '#4A5A9E'], ground: '#1E2647', accent: '#FFC94A' },
  night: { label: '星空真相', sky: ['#1B2350', '#3B2E63'], ground: '#141A38', accent: '#FFD166' }
};
