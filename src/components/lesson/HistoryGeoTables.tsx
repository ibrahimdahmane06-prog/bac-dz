import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Users, BookOpen, Calendar, Search, Filter, 
  Volume2, VolumeX, Sparkles, Globe, Eye, Landmark, Bookmark,
  ChevronDown, ChevronUp, Star, Award, BookMarked, HelpCircle,
  TrendingUp, Clock, FileText, ArrowLeftRight
} from 'lucide-react';

interface Character {
  id: string;
  name: string;
  category: 'algerian' | 'american' | 'soviet' | 'other';
  title: string;
  period: string;
  description: string;
  keyBAC: string; // Brief summary for rapid revision in exams
}

interface Term {
  id: string;
  name: string;
  category: 'history' | 'geography';
  type: string; // e.g., "سياسي", "عسكري", "اقتصادي", "تنموي"
  description: string;
  keyBAC: string;
}

interface EventDate {
  id: string;
  date: string;
  year: number;
  event: string;
  category: 'polar' | 'revolution' | 'decolonization' | 'new-world';
  significance: string; // Why this date matters in the exam
}

const HISTORICAL_CHARACTERS: Character[] = [
  // Algerian Figures
  {
    id: 'char-1',
    name: 'مصطفى بن بولعيد',
    category: 'algerian',
    title: 'قائد المنطقة الأولى (الأوراس) وأحد مؤسسي اللجنة الثورية للوحدة والعمل',
    period: '1917 - 1956',
    description: 'يُلقب بـ "أب الثورة الجزائرية". امتاز بقدرته الفائقة على التنظيم والتمويل وتجميع السلاح. فرّ من سجن الكدية الشهير بقسنطينة مواصلاً قيادة الكفاح المسلح حتى استشهاده إثر انفجار مذياع مفخخ ألقته المخابرات الفرنسية.',
    keyBAC: 'العقل المدبر والمالي للأوراس، فر من السجن واستشهد بمذياع مفخخ في 1956.'
  },
  {
    id: 'char-2',
    name: 'العربي بن مهيدي',
    category: 'algerian',
    title: 'قائد المنطقة الخامسة (الوهران) والمنسق الفعلي لمعركة الجزائر',
    period: '1923 - 1957',
    description: 'رمز الصمود والفكر الثوري المنظم. صاحب العبارة الشهيرة: "ألقوا بالثورة إلى الشارع سيحتضنها الشعب". أشرف على إطلاق إضراب الثمانية أيام وتنسيق الخلايا الفدائية. قتله السفاح بيجار خنقاً بعد تعذيب وحشي لم يبح فيه بسر واحد.',
    keyBAC: 'رجل الهيكلة والتنسيق، قاد إضراب الـ 8 أيام وصاحب مقولة "ألقوا بالثورة للشارع"، واستشهد تحت التعذيب.'
  },
  {
    id: 'char-3',
    name: 'ديدوش مراد',
    category: 'algerian',
    title: 'قائد المنطقة الثانية (الشمال القسنطيني) ومحرر بيان أول نوفمبر',
    period: '1927 - 1955',
    description: 'أصغر القادة الستة المفجرين للثورة سناً وأكثرهم حماساً وثقافة. أشرف على صياغة بيان أول نوفمبر وصياغة تنظيمات الكفاح المسلح. سقط شهيداً في معركة بوكركر البطلة في جانفي 1955 ليكون أول القادة الشهداء.',
    keyBAC: 'قائد الشمال القسنطيني، شارك بصياغة بيان أول نوفمبر وأول المستشهدين من القادة الستة سنة 1955.'
  },
  {
    id: 'char-4',
    name: 'كريم بلقاسم',
    category: 'algerian',
    title: 'قائد المنطقة الثالثة (القبائل) ورئيس الوفد المفاوض في إيفيان',
    period: '1922 - 1970',
    description: 'مؤسس أولى خلايا الكفاح المسلح بالجبال منذ 1947. انضم للستة وكان له شرف تنظيم وهيكلة مؤتمر الصومام 1956. أصبح نائباً لرئيس الحكومة المؤقتة ووزيراً للقوات المسلحة. هو الموقع الرسمي باسم جبهة التحرير على اتفاقيات إيفيان.',
    keyBAC: 'قائد منطقة القبائل، هندس مؤتمر الصومام ورئيس الوفد الجزائري الموقع على اتفاقيات إيفيان الاستقلالية.'
  },
  {
    id: 'char-5',
    name: 'أحمد بن بلة',
    category: 'algerian',
    title: 'أحد قيادات المنظمة الخاصة والوفد الخارجي، وأول رئيس للجزائر المستقلة',
    period: '1916 - 2012',
    description: 'مناضل قديم في حزب الشعب، ترأس المنظمة الخاصة (OS) وشارك في اللقاءات التحضيرية للثورة. كان مع الطاقم الخارجي الذي ألقي عليه القبض في عملية اختطاف الطائرة الشهيرة سنة 1956 من قبل الطيران العسكري الفرنسي. تولى رئاسة الجزائر عقب الاستقلال (1962 - 1965).',
    keyBAC: 'رئيس المنظمة الخاصة، من قيادات الوفد الخارجي المعتقلين في حادثة قرصنة الطائرة 1956، وأول رئيس للبلاد.'
  },
  {
    id: 'char-6',
    name: 'هواري بومدين',
    category: 'algerian',
    title: 'رئيس أركان جيش التحرير الوطني وثاني رئيس للجمهورية الجزائرية',
    period: '1932 - 1978',
    description: 'قائد عسكري وسياسي ومخطط غيور. وحد جيش التحرير بالحدود وأشرف على تسليحه. قاد التصحيح الثوري سنة 1965 وبنى الدولة الوطنية الحديثة من خلال الثورات الثلاث (الزراعية، الصناعية، الثقافية) وقرار تأميم المحروقات سنة 1971 التاريخي ونصرة حركة عدم الانحياز والقضية الفلسطينية.',
    keyBAC: 'رئيس أركان جيش الحدود، قاد الجزائر لبناء قاعدة صناعية متينة، أمم المحروقات 1971، ودعم دول العالم الثالث.'
  },
  {
    id: 'char-7',
    name: 'ميصالي الحاج',
    category: 'algerian',
    title: 'أبو الحركة الوطنية ومؤسس ركائزها الاستقلالية الكلاسيكية',
    period: '1898 - 1974',
    description: 'زعيم سياسي بارز ومؤسس أول الأحزاب الاستقلالية (نجم شمال إفريقيا 1926، ثم حزب الشعب 1937، وحركة انتصار الحريات الديمقراطية 1946). عارض الكفاح المسلح عند اندلاعه متشبثاً بالحلول السياسية، مما همش دوره لاحقاً في الثورة.',
    keyBAC: 'رائد الاتجاه الاستقلالي بالجزائر، وطني ثائر ومؤسس نجم شمال إفريقيا وحزب الشعب، عارض تفجير ثورة نوفمبر.'
  },
  {
    id: 'char-8',
    name: 'فرحات عباس',
    category: 'algerian',
    title: 'زعيم الاتجاه الإدماجي المعتدل ورئيس أول حكومة مؤقتة جزائرية',
    period: '1899 - 1985',
    description: 'ولد بالرويس. حرر "بيان الشعب الجزائري" 1943 مطالباً بالإصلاحات والاستقلال الذاتي. بعد مجازر 8 ماي، اقتنع بعدم جدوى الحلول مع الاستعمار، وحل حزبه لينخرط رسمياً بروح كاملة في جبهة التحرير الوطني 1956، وعُيّن رئيساً للحكومة المؤقتة الأولى GPRA.',
    keyBAC: 'كاتب بيان فيفري 1943، أسس أحباب البيان والحرية، التحق بالثورة 1956 وعُين أول رئيس للحكومة الجزائرية المؤقتة.'
  },

  // American Figures
  {
    id: 'char-9',
    name: 'هاري ترومان',
    category: 'american',
    title: 'الرئيس الثالث والثلاثون للولايات المتحدة الأمريكية (رجل القنبلة والمشروع)',
    period: '1945 - 1953',
    description: 'تولى الإدارة عقب وفاة روزفلت. أمر بإلقاء القنبلتين النوويتين على هيروشيما وناغازاكي لإنهاء ح م 2. أطلق رسمياً سياسة "الحرب الباردة" بتبنيه "مبدأ ترومان" القاضي بتقديم الدعم المالي والعسكري لمحاصرة المد الشيوعي في اليونان وتركيا وهو صاحب مشروع الاحتواء والتطويق.',
    keyBAC: 'رئيس أمريكي، صانع قرار قنبلة الذرة، أطلق مبدأ ترومان لمحاصرة الشيوعية 1947 وسياسة الاحتواء.'
  },
  {
    id: 'char-10',
    name: 'دوايت أيزنهاور',
    category: 'american',
    title: 'الرئيس الرابع والثلاثون للولايات المتحدة وجنرال الحرب العالمية الثانية',
    period: '1953 - 1961',
    description: 'قائد كفء لقوات الحلفاء بأوروبا سابقاً. استهل رئاسته بإنهاء الحرب الكورية. أطلق سياسة "ملء الفراغ" بتأسيس "مشروع أيزنهاور" سنة 1957 لتعويض النفوذ البريطاني والفرنسي المتراجع في الشرق الأوسط ومكافحة التغلغل الشيوعي بالمنطقة.',
    keyBAC: 'جنرال حلفاء أوروبا، رئيس أمريكي أطلق "مشروع أيزنهاور" 1957 ومارس سياسة ملء الفراغ بالشرق الأوسط.'
  },
  {
    id: 'char-11',
    name: 'جون كينيدي',
    category: 'american',
    title: 'الرئيس الخامس والثلاثون للولايات المتحدة ورجل التهدئة الساخنة وقبرص',
    period: '1961 - 1963',
    description: 'أصغر رئيس أمريكي منتخب. واجهت إدارته أخطر أزمات الحرب الباردة وأكثرها حساسية: أزمة خليج الخنازير وأزمة الصواريخ الكوبية 1962 مع خروتشوف والتي هددت بنهاية العالم. اغتيل في ظروف غامضة تكتنفها الأسرار السياسية في دالاس 1963.',
    keyBAC: 'رئيس أمريكي واجه أزمة الصواريخ الكوبية الصعبة 1962، دعم غزو خليج الخنازير واغتيل سنة 1963.'
  },
  {
    id: 'char-12',
    name: 'رونالد ريغان',
    category: 'american',
    title: 'الرئيس الأربعون للولايات المتحدة وصاحب مبادرة حرب النجوم وحقبة الشدة',
    period: '1981 - 1989',
    description: 'اشتهر بمواقفه المتشددة ضد السوفييت وسماهم بـ "إمبراطورية الشر". أطلق برنامجه التسلحي المكلف والمعروف دفاعياً بـ "حرب النجوم" لإرهاق الميزانية والقدرات السوفييتية اقتصادياً وتكنولوجياً، مما عجل باستسلامهم للإصلاحات والانهيار.',
    keyBAC: 'رئيس أمريكي متشدد طارد الشيوعية بـ "حرب النجوم"، وأطلق تحفيزات اقتصادية ضغطت على المعسكر الشرقي.'
  },

  // Soviet Figures
  {
    id: 'char-13',
    name: 'جوزيف ستالين',
    category: 'soviet',
    title: 'الرجل الحديدي وجنرال السوفييت المفرد بالحكم في الحرب العالمية الثانية',
    period: '1924 - 1953',
    description: 'مؤسس القوة العظمى للاتحاد السوفيتي وباني ترسانتها الصناعية والعسكرية الجبارة بعد لينين. حارب النازية بحزم وانتصر عليها. اشتهر بتعصبه الشديد ومواقفه الحادة تجاه الرأسمالية ومصالحها، وبوفاته انفتحت بارقة الأمل لـ "التعايش السلمي".',
    keyBAC: 'ديكتاتور سوفييتي صلب هزمت بلاده النازية بفضله، وطور الترسانة النووية؛ وفاته في 1953 فتحت باب الانفراج والدبلوماسية.'
  },
  {
    id: 'char-14',
    name: 'نيكيتا خروتشوف',
    category: 'soviet',
    title: 'الزعيم السوفييتي المبادر بسياسة التعايش السلمي وصاحب أزمة الكاريبي',
    period: '1953 - 1964',
    description: 'خلف ستالين بتشكيله القيادة الثلاثية "الترويكا". أدان ممارسات ستالين الحادة وطرح رسمياً سياسة "التعايش السلمي" لتقبل الرأسماليين دبلوماسياً. هو باني جدار برلين وتحدى واشنطن بوضع صواريخ نووية في كوبا كادت تشعل فناء البشرية.',
    keyBAC: 'زعيم سوفييتي بادر بـ "التعايش السلمي"، وشيد جدار برلين وأرسل الصواريخ لكوبا 1962 مخضعاً الساحة للتعقل.'
  },
  {
    id: 'char-15',
    name: 'ميخائيل غورباتشوف',
    category: 'soviet',
    title: 'آخر رئيس للاتحاد السوفييتي، وصاحب إصلاحات البريسترويكا والغلاسنوست',
    period: '1985 - 1991',
    description: 'تولى القيادة في ظرف اقتصادي خانق. أطلق فلسفة إصلاحية تضمنت "البريسترويكا" (إعادة البناء الاقتصادي) والغلاسنوست (الشفافية السياسية الديمقراطية)، لكنها تسببت بتفكك الحزب والبلاد وانهيار جدار برلين، ليوقع على حل الاتحاد السوفيتي رسمياً عام 1991.',
    keyBAC: 'آخر زعيم سوفييتي فاشل الإصلاح بالبريسترويكا والغلاسنوست، مهّد للتوافق المطلق مع أمريكا وتفكك الكتلة الشرقية.'
  },

  // Other World Figures
  {
    id: 'char-16',
    name: 'جمال عبد الناصر',
    category: 'other',
    title: 'رئيس جمهورية مصر ورائد القومية العربية ومساند الثورة الجزائرية',
    period: '1918 - 1970',
    description: 'أحد مؤسسي تنظيم الضباط الأحرار ورمز الكرامة العربية. أمم قناة السويس 1956 مما قاد لشن العدوان الثلاثي على بلاده. ركائز مساندته لبيان أول نوفمبر وصواريخ الدعم اللوجيستي والمادي للجزائر جعلته هدفاً دائماً لفرنسا وحلفائها بالمنطقة.',
    keyBAC: 'زعيم مصري وقومي، أمم قناة السويس 1956 ودعم الثورة الجزائرية بأسلحة وإعلام إذاعة صوت العرب بحماس.'
  },
  {
    id: 'char-17',
    name: 'فيدل كاسترو',
    category: 'other',
    title: 'قائد الثورة الكوبية ومؤسس جبهة الصمود الشيوعية بأمريكا اللاتينية',
    period: '1926 - 2016',
    description: 'أطاح بنظام باتيستا الرأسمالي العميل لواشنطن عام 1959. أعلن الشيوعية مباشرة في الفناء الخلفي للولايات المتحدة. صمد أمام مئات محاولات الاغتيال وقاد بلاده بدعم سوفييتي كامل محولاً هافانا لرمز تاريخي لمناهضة الإمبريالية بالعالم الثالث.',
    keyBAC: 'زعيم ثوري كوبي شيوعي أطاح بحكم باتيستا، وسمح بنصب القواعد الصاروخية ومناهض صلب للنفوذ الغربي.'
  }
];

const CURRICULUM_TERMS: Term[] = [
  // History terms
  {
    id: 'term-1',
    name: 'الحرب الباردة',
    category: 'history',
    type: 'سياسي / عسكري',
    description: 'صراع أيديولوجي ومذهبي وسياسي ممتد من نهاية الحرب العالمية الثانية 1945 إلى غاية تصدع الاتحاد السوفييتي 1991، جرى بين قطبي العالم ومحوريهما (المعسكر الشرقي السوفييتي والمعسكر الغربي الأمريكي) واستعملت فيه كل الوسائل العسكرية والنقدية واللوجستية والنفسية عدا المواجهة المباشرة بين العملاقين خوفاً من الزوال النووي.',
    keyBAC: 'صراع أيديولوجي مذهبي (1945 - 1991) بين العملاقين (الرأسمالي والشيوعي) استخدمت فيه كل الوسائل باستثناء الحرب المباشرة.'
  },
  {
    id: 'term-2',
    name: 'التعايش السلمي',
    category: 'history',
    type: 'دبلوماسي',
    description: 'سياسة دبلوماسية ونهج عقائدي دعا إليه خروتشوف في قمة الحزب الشيوعي العشرين سنة 1956، ويقوم على قبول ومبدأ تعدد المذاهب والأيديولوجيات والتعايش المشترك دون اللجوء للصراع العسكري المدمر، وتفضيل أسلوب الحوار الاقتصادي والثقافي والعلمي كطريق لتفادي الفناء النووي المتبادل.',
    keyBAC: 'مفهوم سياسي سوفييتي عقب وفاة ستالين 1953 يقضي بنبذ الحروب وقبول العيش المشترك وفض الأزمات بالتسويات الحوارية.'
  },
  {
    id: 'term-3',
    name: 'مشروع مارشال',
    category: 'history',
    type: 'اقتصادي / سياسي',
    description: 'مساعدات وقروض مالية وهبات اقتصادية يسيرة قدمها وزير الخارجية الأمريكي جورج مارشال في 5 جوان 1947 بقيمة تفوق 13 مليار دولار، ووجهها لتعمير اقتصاد أوروبا المدمر بالكامل، بهدف ترسيخ الفلسفة الليبرالية الرأسمالية ومحاصرة امتداد المد الشيوعي وتجفيف منابع الفقر الخصبة لتمركزه.',
    keyBAC: 'مساعدة مالية أمريكية في 5 جوان 1947 لإعادة إعمار أوروبا، وهدفها ربطها بالتبعية الرأسمالية والحد من المد الشيوعي.'
  },
  {
    id: 'term-4',
    name: 'الأحادية القطبية',
    category: 'history',
    type: 'سياسي',
    description: 'شكل ونموذج جيوسياسي جديد تزعمته الولايات المتحدة الأمريكية منذ انهيار المعسكر الشرقي وتفكك السوفييت (قمة مالطا 1989 وتفكك الاتحاد 1991) حيث انفردت واشنطن بفرض هيمنتها وقيادتها لقرارت السلم، والحرب، والتجارة، والملاحة وتأهيل المؤسسات الدولية (مجلس الأمن وصندوق النقد الدولي) لتحقيق مصالحها.',
    keyBAC: 'نظام دولي جديد انفردت فيه الولايات المتحدة بقيادة العالم وحل شفرات سياسته وتجارته، وبدأ رسمياً مع مطلع التسعينيات.'
  },
  {
    id: 'term-5',
    name: 'مؤتمر الصومام',
    category: 'history',
    type: 'عسكري / تنظيمي',
    description: 'أهم المنعطفات التنظيمية والديناميكية الفطرية للثورة الجزائرية، انعقد في قرية إيفري بمدينة بجاية التاريخية في 20 أوت 1956 بحضور نخبة القادة والمجاهدين. وضع هيكل التنظيم الموجه لمراحل الكفاح وأخرج مبدأ أولوية العمل الداخلي على الخارجي، وأولوية العمل السياسي المدني على العسكري واستحداث المجلس الوطني للثورة.',
    keyBAC: 'مؤتمر تنظيمي تاريخي انعقد ببلاد القبائل في 20 أوت 1956، هيكل مؤسسات وجيش التحرير وأقر الأولويات التوجيهية الكبرى للثورة.'
  },
  {
    id: 'term-6',
    name: 'حركة عدم الانحياز',
    category: 'history',
    type: 'دبلوماسي',
    description: 'تنظيم سياسي ودبلوماسي تأسس رسمياً في مؤتمر بلغراد بيوغوسلافيا من 1 إلى 6 سبتمبر 1961 بقيادة شخصيات ثورية عالمية كبرى (تيتو، نهرو، عبد الناصر، سوكارنو). ضمت الحركة الدول المستقلة حديثاً المطالبة بالابتعاد الكامل عن صراع الاستقطاب البارد وتبني نهج الحياد الإيجابي والوقوف في وجه الإمبريالية.',
    keyBAC: 'كتلة تأسست في بلغراد 1961 لدول إفريقيا وآسيا حديثة للحياد عن المحاور المتصارعة ومساندة حركات التحرر والسيادة.'
  },

  // Geography terms
  {
    id: 'term-7',
    name: 'مؤشر التنمية البشرية (IDH)',
    category: 'geography',
    type: 'تنموي / اجتماعي',
    description: 'أداة تركيبية ومعيار مرجعي وضعه برنامج الأمم المتحدة الإنمائي لرصد كفاءة وجودة الحياة بالدول، يتراوح رقمياً بين 0 و 1. يرتكز حسابياً على ثلاثة أبعاد أساسية متكاملة: متوسط العمر المتوقع للفرد، ونسب انتشار التعليم ومحو الأمية، والدخل الفردي المعدل بموجب تعادل القدرة الشرائية.',
    keyBAC: 'معدل مركب ورقم إحصائي من 0 لـ 1، يقيس ترقي العيش بالبلد بناء على الصحة والتعليم والدخل الفردي.'
  },
  {
    id: 'term-8',
    name: 'السلاح الأخضر',
    category: 'geography',
    type: 'اقتصادي / زراعي / جيوسياسي',
    description: 'مصطلح جيوستراتيجي يصف الاستعمال الموجه للغذاء والمنتجات الفلاحية الكبرى، وخاصة محصول "القمح والشعير"، من قبل القوى والبلدان المصدرة الكبرى (مثل الولايات المتحدة الأمريكية)، واستغلال الشح الغذائي بالدول الأخرى كأداة ضغط ونفوذ اقتصادي وسياسي كقوة ضاغطة لتغيير التوجهات السيادية للدول النفطية أو النامية.',
    keyBAC: 'استخدام القمح والمزارع الكبرى كوسيلة ضغط وحصار اقتصادي تفرضه الدول المصدرة ضد المستهلكة لتحقيق نفوذ سياسي.'
  },
  {
    id: 'term-9',
    name: 'منظمة الأوبك (OPEC)',
    category: 'geography',
    type: 'اقتصادي / جيوسياسي',
    description: 'منظمة الدول المصدرة للنفط تأسست في سبتمبر 1960 بموجب "مؤتمر بغداد" من قبل الدول المؤسسة البارزة (السعودية، العراق، الكويت، إيران، فنزويلا). يقع مقرها بفيينا بالنمسا. تهدف المنظمة لحماية حقوق سيادة ثروات الأعضاء، وصون أسعار براميل الخام بتشريعات نسب الحصص وحراسة ميزان السوق الكونية ضد تلاعب الشركات الكبرى.',
    keyBAC: 'منظمة نفطية تشكلت في بغداد 1960 لحراسة مصالح الدول المنتجة، وضبط الأسعار والحصص السوقية الكافية للمحافظة على الثروات.'
  },
  {
    id: 'term-10',
    name: 'النمور التآزرية والآسيوية',
    category: 'geography',
    type: 'اقتصادي',
    description: 'أربع دول صاعدة ومتميزة التحقت بـ "التنينات الأربعة" في صعودها الصناعي والتكنولوجي، وتضم: ماليزيا، تايلاند، إندونيسيا، والفلبين. طوعت هذه الدول كفاءاتها الطبيعية وعمالتها واستجذبت الاستثمار للتطور الفوري اعتماداً على الصناعة الإحلالية وتجميع الأجهزة والاستيراد التصديري وتصدير الخدمات.',
    keyBAC: 'أربعة كيانات صاعدة بشرق آسيا (ماليزيا، إندونيسيا، تايلاند، الفلبين) شيدت قفزتها التنموية بتكتيك اقتصادي متطور.'
  }
];

const OFFICIAL_DATES: EventDate[] = [
  // 1945
  { id: 'date-1', date: '8 ماي 1945', year: 1945, event: 'مجازر 8 ماي 1945 الأليمة بالجزائر العاصمة وسطيف وقالمة وخراطة', category: 'revolution', significance: 'أبشع همجية واجه بها المستعمر مسيرات الشعب للمطالبة بوعوده، ونتج عنها وعي تام بأن الحرية لا تؤخذ إلا بالسلاح والجهاد.' },
  { id: 'date-2', date: '24 أكتوبر 1945', year: 1945, event: 'التأسيس الرسمي والنشأة لهيئة الأمم المتحدة بنظام ميثاق سان فرانسيسكو', category: 'polar', significance: 'ميلاد منبر دولي لإصلاح الكوكب وحفظ الأمن، ولكنه رهن حق "الفيتو" لدى الكبار، مما وهج لاحقاً صراعات القنص واستقطاب الثنائية.' },
  
  // 1947
  { id: 'date-3', date: '12 مارس 1947', year: 1947, event: 'الإعلان الرسمي والجهير عن مبدأ ترومان لمحاصرة المد الشيوعي', category: 'polar', significance: 'انطلاق حقيقي لسياسة الاحتواء ومطاردة الأيديولوجيات الحمراء بتقديم قروض مالية وتسهيلات لنظامي أثينا وأنقرة ضد السوفييت.' },
  { id: 'date-4', date: '5 جوان 1947', year: 1947, event: 'طرح مشروع مارشال لتعمير القارة الأوروبية المدمرة بالكامل', category: 'polar', significance: 'مظهر مالي جبار لتقييد دول أوروبا وربط ميزانيتها بواشنطن وبكشوف الرأسمالية لمنع تشرب الأوساط المتعبة بعقيدة الشيوعيين.' },
  { id: 'date-5', date: '22 سبتمبر 1947', year: 1947, event: 'صدور ميثاق ومبدأ جدانوف السوفييتي لتقسيم العالم لمعسكرين متناقضين', category: 'polar', significance: 'الموقف السوفييتي الرسمي من الحرب الباردة، ويتمثل في تقسيم جغرافيا الكوكب لمعسكر رأسمالي توسعي إمبراطوري ومعسكر ديمقراطي شرقي منادٍ بالتحرر.' },
  { id: 'date-6', date: '6 أكتوبر 1947', year: 1947, event: 'التأسيس والتوهج لمكتب الإعلام الشيوعي الكوني (الكومنفورم)', category: 'polar', significance: 'الجهاز التنسيقي والتسليحي للأجهزة الحزبية الشيوعية بالعالم لمواجهة الدعاية الإعلامية والتسلل الاستخباري والأطروحات الغربية والفرع المعادي.' },

  // 1949
  { id: 'date-7', date: '25 جانفي 1949', year: 1949, event: 'تشكيل تكتل منظمة التعاون والتكامل الاقتصادي للشرق (الكوميكون)', category: 'polar', significance: 'الرد السوفييتي المالي على مشروع مارشال، والذي استهدف صياغة شبكة تبادل وصناعة ونقد موحدة للأقطار المنخرطة بالشيوعية.' },
  { id: 'date-8', date: '4 أفريل 1949', year: 1949, event: 'التوقيع الرسمي والتوافق على حلف شمال الأطلسي العسكري (الناتو)', category: 'polar', significance: 'درع الأمن الجماعي الرأسمالي لحراسة واجهة البحر الأطلسي وأوروبا الغربية وعساكر واشنطن لمواجهة أي تحرك للجيش الأحمر السوفييتي.' },

  // 1953
  { id: 'date-9', date: '5 مارس 1953', year: 1953, event: 'وفاة الزعيم السوفييتي جوزيف ستالين وانقشاع غيوم التعنت الإيديولوجي', category: 'polar', significance: 'انفتاح قبة الكرملين لأساليب ونظام مهادن بديل للجمود، وميلاد كادر الترويكا المهيئ لسياسة التهدئة وقواعد التعايش السلمي.' },

  // 1954
  { id: 'date-10', date: '1 نوفمبر 1954', year: 1954, event: 'اندلاع شرارات الثورة التحريرية الجزائرية الباسلة وتلاوة بيان نوفمبر', category: 'revolution', significance: 'أعظم قفزة تاريخية بالقرن العشرين أعلنت تحطيم الأوهام الاندماجية الفرنسية وتصميم الوطن المستقل بقوة السلاح.' },

  // 1955
  { id: 'date-11', date: '18-24 أفريل 1955', year: 1955, event: 'انعقاد مؤتمر باندونغ المتضامن لإفريقيا وآسيا بإندونيسيا', category: 'decolonization', significance: 'الحاضنة الدبلوماسية التحررية الأولى التي ناضلت لمحاربة قوى الاستعمار والتبعية وأنشأت النواة الصلبة لتأسيس عدم الانحياز.' },
  { id: 'date-12', date: '14 ماي 1955', year: 1955, event: 'التوقيع العسكري السوفييتي البارز لتأسيس ورسم معاهدة حلف وارسو', category: 'polar', significance: 'تجميع لكل الطاقات المسلحة والعسكرية للدول الشيوعية لمواجهة التمدد الرأسمالي المسلح وتأطير قواعد الردع تحت الريادة السوفيتية.' },
  { id: 'date-13', date: '20 أوت 1955', year: 1955, event: 'هجومات الشمال القسنطيني البطلة تحت قيادة الثائر زيغود يوسف', category: 'revolution', significance: 'فك الحصار عن منطقة الأوراس، وإثبات البعد الشعبي الشامل للثورة وتكسير الدعاية الفرنسية بأن الكفاح مقتصر على شراذم خارج القانون.' },

  // 1956
  { id: 'date-14', date: '20 أوت 1956', year: 1956, event: 'عقد مؤتمر الصومام وهيكلة البنيان التنظيمي والمؤسساتي للثورة الكبرى', category: 'revolution', significance: 'مؤتمر توجيهي عميق أخرج الكود الداخلي لضبط الولايات والتراتبية وأعلن أولوية النضال الداخلي والسياسي على الخارجي.' },

  // 1957
  { id: 'date-15', date: '5 جانفي 1957', year: 1957, event: 'الإعلان عن مشروع أيزنهاور لسد الفراغات بالشرق الأوسط المعقد', category: 'polar', significance: 'مشروع مالي وعسكري لتعويض النفوذ الاستعماري الغائب لبريطانيا وفرنسا وحل الحراسة الأمريكية محلهم لضرب التأثير الشيوعي والقومي.' },

  // 1961
  { id: 'date-16', date: '13 أوت 1961', year: 1961, event: 'البدء بتشييد جدار برلين العازل (جدار العار الفاصل بين الشرق والغرب)', category: 'polar', significance: 'أوج مادية ومظهر عيني للحرب الباردة، وصمم لصد نزيف هروب الطاقات البشرية والأدمغة والعمالة لشطر برلين الرأسمالي الحر.' },
  { id: 'date-17', date: '1-6 سبتمبر 1961', year: 1961, event: 'مؤتمر بلغراد بيوغوسلافيا والتأسيس الفعلي لحركة عدم الانحياز', category: 'polar', significance: 'حاجز ودفاع دبلوماسي لأكثر من 25 وطناً ضد نزعات القطبين والاستقطاب والمناداة بنشر السلام ومظلات السيادة والتنمية.' },

  // 1962
  { id: 'date-18', date: '19 مارس 1962', year: 1962, event: 'تفعيل وقف إطلاق النار بالجزائر وعيد النصر عقب مفاوضات إيفيان', category: 'revolution', significance: 'رضوخ الكادر العسكري والسياسي الفرنسي لمطالب الاستقلال ومحاورة الجبهة كشرعية وحيدة، ونظمت كعيد نصر مجيد للأجيال.' },
  { id: 'date-19', date: '5 جويلية 1962', year: 1962, event: 'إعلان الاستقلال الوطني الشامل والانعتاق من قبضة الاستعمار الممتد', category: 'revolution', significance: 'تتويج لاستفتاء حر صوت فيه الجزائريون بنسبة 99% للأرض المستقلة وتنزيل رايات الاستعمار وبناء كرامة وهوية الأمة المستعدة للتشييد.' }
];

export const HistoryGeoTables: React.FC<{ subjectId: string }> = ({ subjectId }) => {
  const [activeTab, setActiveTab] = useState<'char' | 'term' | 'date'>('char');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom states for each tab's sub-filter
  const [characterFilter, setCharacterFilter] = useState<'all' | 'algerian' | 'american' | 'soviet' | 'other'>('all');
  const [termFilter, setTermFilter] = useState<'all' | 'history' | 'geography'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'polar' | 'revolution' | 'decolonization' | 'new-world'>('all');

  // Expanded card tracking
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Text-To-Speech Pronunciation Audio helper
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }

    const cleanText = text.replace(/[.#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85; // highly articulate & clear pronunciation
    
    // Attempt to set specialized Arabic voices
    const voices = window.speechSynthesis.getVoices();
    const voiceAr = voices.find(v => v.lang.includes('ar') || v.lang.includes('SA'));
    if (voiceAr) {
      utterance.voice = voiceAr;
    }

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // 1. Memoized Characters Logic
  const filteredCharacters = useMemo(() => {
    return HISTORICAL_CHARACTERS.filter(char => {
      const matchSearch = char.name.includes(searchQuery) || 
                          char.title.includes(searchQuery) || 
                          char.description.includes(searchQuery) || 
                          char.keyBAC.includes(searchQuery);
      
      const matchCat = characterFilter === 'all' || char.category === characterFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, characterFilter]);

  // 2. Memoized Terms Logic
  const filteredTerms = useMemo(() => {
    return CURRICULUM_TERMS.filter(term => {
      const matchSearch = term.name.includes(searchQuery) || 
                          term.type.includes(searchQuery) || 
                          term.description.includes(searchQuery) || 
                          term.keyBAC.includes(searchQuery);
      
      const matchCat = termFilter === 'all' || term.category === termFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, termFilter]);

  // 3. Memoized Dates Logic
  const filteredDates = useMemo(() => {
    return OFFICIAL_DATES.filter(ev => {
      const matchSearch = ev.date.includes(searchQuery) || 
                          ev.event.includes(searchQuery) || 
                          ev.significance.includes(searchQuery) ||
                          ev.year.toString().includes(searchQuery);
      
      const matchCat = dateFilter === 'all' || ev.category === dateFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, dateFilter]);

  // If this is not a history-geo lesson, we don't render this kit.
  if (subjectId !== 'history-geo') return null;

  return (
    <div className="mt-12 bg-white rounded-[32px] border border-gray-150 p-6 sm:p-8 space-y-6 text-right" style={{ direction: 'rtl' }} id="history-geo-companion-tables">
      
      {/* Dynamic Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-xs text-[10px] font-black px-3 py-1 rounded-full text-white shadow-xs">
            <Sparkles size={11} className="animate-pulse" />
            <span>الحقيبة الجيو-تاريخية المساعدة للبكالوريا (BAC )</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">الكشكول الشامل: الشخصيات، المصطلحات، والتواريخ المعتمدة</h2>
          <p className="text-xs text-indigo-200 font-medium max-w-3xl leading-relaxed">
            مستودع متكامل مدمج يدعم تصفح ومذاكرة ركائز التاريخ والجغرافيا الوزارية مباشرة مع ميزة القراءة الصوتية والتلخيص العاجل الملائم لمتطلبات ورقة الامتحان.
          </p>
        </div>
      </div>

      {/* Primary Navigation System */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        
        {/* Tab Buttons bar */}
        <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200/50 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('char');
              setSearchQuery('');
              setExpandedId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'char'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={14} className={activeTab === 'char' ? 'text-emerald-600' : 'text-gray-400'} />
            <span>شخصيات المقرر ({HISTORICAL_CHARACTERS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('term');
              setSearchQuery('');
              setExpandedId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'term'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookMarked size={14} className={activeTab === 'term' ? 'text-emerald-600' : 'text-gray-400'} />
            <span>مصطلحات ومفاهيم ({CURRICULUM_TERMS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('date');
              setSearchQuery('');
              setExpandedId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'date'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar size={14} className={activeTab === 'date' ? 'text-emerald-600' : 'text-gray-400'} />
            <span>تواريخ وأحداث تاريخية ({OFFICIAL_DATES.length})</span>
          </button>
        </div>

        {/* Dynamic Interactive Search Module */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 right-3 flex items-center pr-1 pointer-events-none text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'char' ? 'ابحث عن شخصية (مثل: مهيدي، كينيدي...)' :
              activeTab === 'term' ? 'ابحث عن مفهوم (مثل: بؤرة، السلاح الأخضر...)' :
              'ابحث عن تاريخ أو حدث (مثل: صومام، 1956...)'
            }
            className="w-full pr-9 pl-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-gray-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 left-3 flex items-center pl-1 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* SECONDARY FILTERING BAR BASED ON ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'char' && (
          <motion.div
            key="char-filters"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-wrap gap-1.5"
          >
            {[
              { id: 'all', label: 'الجميع' },
              { id: 'algerian', label: 'شخصيات جزائرية' },
              { id: 'american', label: 'شخصيات أمريكية' },
              { id: 'soviet', label: 'شخصيات سوفييتية' },
              { id: 'other', label: 'شخصيات دولية أخرى' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setCharacterFilter(btn.id as any);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  characterFilter === btn.id 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold shadow-3xs'
                    : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}

        {activeTab === 'term' && (
          <motion.div
            key="term-filters"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-wrap gap-1.5"
          >
            {[
              { id: 'all', label: 'الجميع' },
              { id: 'history', label: 'مصطلحات التاريخ' },
              { id: 'geography', label: 'مصطلحات الجغرافيا' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setTermFilter(btn.id as any);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  termFilter === btn.id 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold shadow-3xs'
                    : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}

        {activeTab === 'date' && (
          <motion.div
            key="date-filters"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-wrap gap-1.5"
          >
            {[
              { id: 'all', label: 'كافة الفترات' },
              { id: 'revolution', label: 'الثورة التحريرية العظمى' },
              { id: 'polar', label: 'القطبية الثنائية وصراع النفوذ' },
              { id: 'decolonization', label: 'حركات التحرر العالمية' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setDateFilter(btn.id as any);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  dateFilter === btn.id 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-250 font-bold shadow-3xs'
                    : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN DATA TABLES AREA */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* 1. CHARACTERS TAB CARD LIST */}
          {activeTab === 'char' && (
            <motion.div
              key="characters-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredCharacters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCharacters.map((char) => {
                    const isExpanded = expandedId === char.id;
                    const isSpeaking = speakingId === char.id;
                    return (
                      <div 
                        key={char.id}
                        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isExpanded 
                            ? 'bg-white border-emerald-400 shadow-md ring-1 ring-emerald-400' 
                            : 'bg-gray-50/50 border-gray-150 hover:border-gray-250 hover:bg-white shadow-3xs'
                        }`}
                      >
                        <div className="space-y-3">
                          
                          {/* Top Row: category badge, action buttons */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                              char.category === 'algerian' ? 'bg-rose-50 border-rose-150 text-rose-800' :
                              char.category === 'american' ? 'bg-blue-50 border-blue-150 text-blue-800' :
                              char.category === 'soviet' ? 'bg-red-50 border-red-150 text-red-800' :
                              'bg-amber-50 border-amber-150 text-amber-800'
                            }`}>
                              {char.category === 'algerian' ? 'الجزائر 🇩🇿' :
                               char.category === 'american' ? 'أمريكا 🇺🇸' :
                               char.category === 'soviet' ? 'السوفييت ☭' :
                               'شخصية محورية 🌐'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Audio button */}
                              <button
                                type="button"
                                onClick={() => handleSpeak(`${char.name}. ${char.description}`, char.id)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSpeaking 
                                    ? 'bg-emerald-500 border-emerald-500 text-white animate-pulse' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800'
                                }`}
                                title="استمع لنبذة الشخصية بالصوت"
                              >
                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                              </button>

                              {/* Expansion Trigger */}
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(char.id)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 bg-white cursor-pointer"
                                title="تفاصيل وحياة الشخصية"
                              >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* Figure Core metadata */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Landmark size={14} className="text-gray-400" />
                              <h4 className="font-extrabold text-sm text-gray-900">{char.name}</h4>
                              <span className="text-[10px] font-mono text-gray-400 font-bold bg-gray-150 px-1.5 py-0.5 rounded-md">
                                {char.period}
                              </span>
                            </div>
                            <p className="text-[11px] font-black text-gray-500 leading-relaxed font-bold">{char.title}</p>
                          </div>

                          {/* Exam Focused formula */}
                          <div className="bg-emerald-50/70 border border-emerald-100/80 p-3 rounded-xl space-y-1">
                            <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">زبدة التعريف للبكالوريا (BAC )</span>
                            <p className="text-[10.5px] text-gray-750 font-black leading-relaxed">{char.keyBAC}</p>
                          </div>

                          {/* Full Rich Bio */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-gray-100 pt-3 mt-2"
                              >
                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-150">
                                  {char.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center text-gray-400 space-y-2">
                  <User size={32} className="mx-auto text-gray-300 opacity-60" />
                  <p className="text-xs font-black text-gray-600">لم يتم العثور على أي شخصية مطابقة لبحثك.</p>
                  <p className="text-[10px] text-gray-400">يرجى تعديل الكلمة المفتاحية أو اختيار تصنيف مرشح آخر.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 2. TERMS TAB CARD LIST */}
          {activeTab === 'term' && (
            <motion.div
              key="terms-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredTerms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTerms.map((term) => {
                    const isExpanded = expandedId === term.id;
                    const isSpeaking = speakingId === term.id;
                    return (
                      <div 
                        key={term.id}
                        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isExpanded 
                            ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400' 
                            : 'bg-gray-50/50 border-gray-150 hover:border-gray-250 hover:bg-white shadow-3xs'
                        }`}
                      >
                        <div className="space-y-3">
                          
                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                                term.category === 'history' ? 'bg-indigo-50 border-indigo-150 text-indigo-800' : 'bg-emerald-50 border-emerald-150 text-emerald-800'
                              }`}>
                                {term.category === 'history' ? 'تاريخ 📜' : 'جغرافيا 🌍'}
                              </span>
                              <span className="text-[8px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {term.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Audio */}
                              <button
                                type="button"
                                onClick={() => handleSpeak(`${term.name}. ${term.description}`, term.id)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSpeaking 
                                    ? 'bg-emerald-500 border-emerald-500 text-white animate-pulse' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800'
                                }`}
                                title="استمع لتعريف المعيار بالصوت"
                              >
                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                              </button>

                              {/* Toggle expand */}
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(term.id)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-800 bg-white cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* Detail */}
                          <div className="flex items-center gap-2">
                            <Bookmark size={14} className="text-gray-400" />
                            <h4 className="font-extrabold text-sm text-gray-900">{term.name}</h4>
                          </div>

                          {/* Quick revise */}
                          <div className="bg-amber-50/75 border border-amber-100/70 p-3 rounded-xl space-y-1">
                            <span className="text-[8px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">المفهوم الجوهري للورقة</span>
                            <p className="text-[10.5px] text-gray-750 font-black leading-relaxed">{term.keyBAC}</p>
                          </div>

                          {/* Rich Full concept */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-gray-100 pt-3 mt-2"
                              >
                                <p className="text-xs text-gray-650 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-150 whitespace-normal">
                                  {term.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center text-gray-400 space-y-2">
                  <BookOpen size={32} className="mx-auto text-gray-300 opacity-60" />
                  <p className="text-xs font-black text-gray-600">لم يعثر على أي مصطلح يحاكي طلبك.</p>
                  <p className="text-[10px] text-gray-400">حاول مراجعت الإلملاء أو تصفح كل المصطلحات بمسح كلمة البحث.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. EVENT DATES TAB CHRONOLOGICAL TIMELINE */}
          {activeTab === 'date' && (
            <motion.div
              key="dates-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {filteredDates.length > 0 ? (
                <div className="relative border-r-2 border-slate-200 mr-2 sm:mr-4 pr-6 sm:pr-8 py-2 space-y-6">
                  {filteredDates.map((ev, dIdx) => {
                    const isExpanded = expandedId === ev.id;
                    return (
                      <motion.div 
                        key={ev.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: dIdx * 0.05 }}
                        className="relative"
                      >
                        {/* Circle point in timeline vertical rail */}
                        <span className="absolute -right-[32px] sm:-right-[40px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-emerald-600 ring-2 ring-emerald-100 flex items-center justify-center"></span>
                        
                        <div className={`p-5 rounded-2xl border transition-all duration-200 ${
                          isExpanded 
                            ? 'bg-white border-emerald-400 shadow-md ring-1 ring-emerald-400' 
                            : 'bg-gray-50/50 border-gray-150 hover:border-gray-250 hover:bg-white shadow-3xs'
                        }`}>
                          <div className="space-y-3">
                            
                            {/* Metadata */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl font-mono">
                                  {ev.date}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                                  ev.category === 'revolution' ? 'bg-rose-50 border-rose-150 text-rose-800' :
                                  ev.category === 'polar' ? 'bg-indigo-50 border-indigo-150 text-indigo-800' :
                                  'bg-amber-50 border-amber-150 text-amber-805'
                                }`}>
                                  {ev.category === 'revolution' ? 'ثورة تحريرية 🇩🇿' :
                                   ev.category === 'polar' ? 'حرب باردة ❄️' :
                                   'عالم ثالث حركة عدم انحياز 🚩'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleExpand(ev.id)}
                                className="px-2.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 bg-white text-[10px] text-gray-500 font-bold hover:text-gray-800 cursor-pointer flex items-center gap-1"
                              >
                                <span>الأهمية والربط</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            </div>

                            {/* Event Text */}
                            <h4 className="font-extrabold text-xs sm:text-sm text-gray-950 leading-relaxed">
                              {ev.event}
                            </h4>

                            {/* Chronological importance view */}
                            <div className="bg-emerald-50/55 p-3 rounded-xl border border-emerald-100/50">
                              <span className="text-[8.5px] font-black text-emerald-800 flex items-center gap-1">
                                <Clock size={10} className="text-emerald-500" />
                                الأثر الجيو-تاريخي لحدث {ev.year}:
                              </span>
                              <p className="text-[11px] text-gray-750 font-medium leading-relaxed mt-1">
                                {ev.significance}
                              </p>
                            </div>

                            {/* Detailed analysis inside collapsible */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="pt-2 text-[10.5px] text-gray-500 border-t border-gray-100 mt-2 space-y-1"
                                >
                                  <span className="font-extrabold text-gray-700">📌 لماذا يستهدف المعلم هذا التاريخ في السؤال المقالي؟</span>
                                  <p className="leading-relaxed leading-normal bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                                    تعتبر المحطات الكبرى لسنوات {ev.year} خطوط فاصلة تؤرخ لنشوء قوى سياسية أو مادية دمرت هياكل استعمارية قديمة وبنت موازين حلف وارسو ومشاريع نفوذ جديدة. احفظ اليوم والبلد والشهر بغير نسيان للحصول على الدرجة كاملة!
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center text-gray-400 space-y-2">
                  <Calendar size={32} className="mx-auto text-gray-300 opacity-60" />
                  <p className="text-xs font-black text-gray-600">لا يوجد أي تاريخ مطابق في جدول الموازنة الحالي.</p>
                  <p className="text-[10px] text-gray-400">حاول البحث بذكر السنة فقط مثل (1956) لتصفح الأحداث المبرمجة فيها.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER TIPS */}
      <div className="bg-amber-50 rounded-2xl border border-amber-150 p-4 shrink-0 flex items-start gap-3">
        <span className="text-lg">📢</span>
        <div className="space-y-1">
          <strong className="text-xs text-amber-900 font-extrabold">ملاحظات توجيهية هامة للمصحح:</strong>
          <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
            - في أسئلة الشخصيات، لا يشترط سرد تاريخ الميلاد والوفاة الدقيق؛ بل يركز المصحح الوزاري على **الجنسية (الوظيفة أو التوجه) وثلاثة أعمال رئيسية بارزة**.
            <br />
            - في أسئلة المصطلحات، اعتمد على الفهم وذكر الحقل الأساسي (سياسي، جيوستراتيجي، عسكري، اقتصادي) وسياق نشوئه مع ذكر مثال حقيقي لترسيخ درجتك العالية.
          </p>
        </div>
      </div>

    </div>
  );
};
