import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    InteractionManager,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { apiService } from "../../services/api";
import { hapticLight, hapticMedium } from "../../utils/haptics";
import { sanitizeString } from "../../utils/validation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH > 768;
const ADAPTIVE_COLUMNS = isTablet ? 3 : 2;
const ADAPTIVE_CARD_WIDTH = (SCREEN_WIDTH - 20 * (ADAPTIVE_COLUMNS + 1)) / ADAPTIVE_COLUMNS;

interface Recipe {
  id: string;
  title: string;
  image: string;
  calories: number;
  time: number;
  difficulty: "Легко" | "Средне" | "Сложно";
  category: string;
  ingredients: string[];
  instructions: string[];
  description: string;
  usageCount?: number;
  isPopular?: boolean;
}

const UZBEK_RECIPES: Recipe[] = [
  {
    id: "breakfast-1",
    title: "Каша маш",
    image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400",
    calories: 280,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["200г маша", "100г риса", "1 морковь", "1 луковица", "300г мяса", "Масло", "Соль, специи"],
    instructions: [
      "Замочите маш на 2 часа в холодной воде",
      "Нарежьте мясо кубиками и обжарьте на масле до золотистой корочки",
      "Добавьте нарезанный лук и тертую морковь, обжарьте 5 минут",
      "Добавьте маш, рис и залейте водой (1:3)",
      "Варите на медленном огне 40 минут до готовности",
      "Посолите, добавьте специи и перемешайте"
    ],
    description: "Традиционный узбекский завтрак с машем и рисом",
  },
  {
    id: "breakfast-2",
    title: "Самса с тыквой",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    calories: 320,
    time: 40,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["500г слоеного теста", "400г тыквы", "2 луковицы", "Масло", "Соль, перец", "Кунжут"],
    instructions: [
      "Нарежьте тыкву мелкими кубиками, лук полукольцами",
      "Смешайте тыкву с луком, добавьте соль, перец и масло",
      "Раскатайте тесто, нарежьте на квадраты 10×10см",
      "Выложите начинку в центр каждого квадрата",
      "Защипните края в виде треугольника, смажьте яйцом",
      "Посыпьте кунжутом и выпекайте при 200°C 35-40 минут"
    ],
    description: "Хрустящая самса с тыквенной начинкой",
  },
  {
    id: "breakfast-3",
    title: "Ширчой",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 250,
    time: 20,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["1л молока", "100г риса", "50г сахара", "50г масла", "Щепотка соли"],
    instructions: [
      "Промойте рис в холодной воде несколько раз",
      "Вскипятите молоко, добавьте щепотку соли",
      "Всыпьте рис и варите на медленном огне 15 минут",
      "Добавьте сахар и масло, перемешайте",
      "Варите еще 5 минут до загустения",
      "Подавайте горячим"
    ],
    description: "Молочная рисовая каша по-узбекски",
  },
  {
    id: "breakfast-4",
    title: "Кукси",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 380,
    time: 25,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["200г лапши", "2 огурца", "2 помидора", "2 яйца", "100мл соуса кукси", "Зелень"],
    instructions: [
      "Отварите лапшу согласно инструкции на упаковке",
      "Нарежьте огурцы и помидоры тонкой соломкой",
      "Сварите яйца вкрутую, разрежьте пополам",
      "Промойте лапшу холодной водой",
      "Выложите лапшу, овощи, яйца в глубокую тарелку",
      "Залейте холодным соусом кукси, украсьте зеленью"
    ],
    description: "Холодный суп с лапшой",
  },
  {
    id: "breakfast-5",
    title: "Катлама",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    calories: 350,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["500г муки", "250мл воды", "100мл масла", "2 яйца", "Зелень", "Соль"],
    instructions: [
      "Замесите тесто из муки, воды, яйца и соли",
      "Оставьте тесто на 20 минут под пленкой",
      "Раскатайте тесто очень тонко, смажьте маслом",
      "Посыпьте рубленой зеленью",
      "Сложите гармошкой, затем скрутите в рулет",
      "Обжарьте на сковороде с обеих сторон до золотистого цвета"
    ],
    description: "Слоеная лепешка",
  },
  {
    id: "breakfast-6",
    title: "Чучвара",
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400",
    calories: 400,
    time: 45,
    difficulty: "Сложно",
    category: "Завтрак",
    ingredients: ["300г муки", "300г фарша", "2 луковицы", "Соль, перец", "Зелень", "Сметана"],
    instructions: [
      "Замесите крутое тесто из муки и воды, оставьте на 30 минут",
      "Смешайте фарш с мелко нарезанным луком, солью и перцем",
      "Раскатайте тесто тонко, нарежьте на квадраты 4×4см",
      "Положите немного фарша, защипните уголки",
      "Отварите в кипящей подсоленной воде 7-8 минут",
      "Подавайте со сметаной и зеленью"
    ],
    description: "Узбекские пельмени",
  },
  {
    id: "breakfast-7",
    title: "Халваитар",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    calories: 420,
    time: 25,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["200г муки", "100г масла", "100г сахара", "3 яйца", "1 ч.л. разрыхлителя"],
    instructions: [
      "Взбейте яйца с сахаром до пышной массы",
      "Растопите масло и добавьте в яичную смесь",
      "Просейте муку с разрыхлителем",
      "Замесите мягкое тесто",
      "Сформируйте небольшие лепешки",
      "Выпекайте при 180°C 20-25 минут"
    ],
    description: "Сладкая выпечка",
  },
  {
    id: "breakfast-8",
    title: "Нон с маслом",
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400",
    calories: 220,
    time: 5,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["1 нон (узбекская лепешка)", "50г масла", "2 ст.л. меда"],
    instructions: [
      "Разогрейте нон в духовке или на сковороде",
      "Размягчите масло при комнатной температуре",
      "Разрежьте нон на порции",
      "Намажьте каждый кусок маслом",
      "Полейте медом по вкусу",
      "Подавайте с горячим чаем"
    ],
    description: "Узбекская лепешка с маслом",
  },
  {
    id: "breakfast-9",
    title: "Шавля",
    image: "https://images.unsplash.com/photo-1516714819001-8ee7a13b71d7?w=400",
    calories: 380,
    time: 30,
    difficulty: "Средне",
    category: "Завтрак",
    ingredients: ["200г риса", "200г мяса", "1 морковь", "1 луковица", "Масло", "Зира, соль"],
    instructions: [
      "Нарежьте мясо небольшими кусочками",
      "Обжарьте мясо на масле до золотистого цвета",
      "Добавьте нарезанный лук и тертую морковь",
      "Промойте рис и добавьте к мясу",
      "Залейте водой (1:2), добавьте зиру и соль",
      "Варите под крышкой на медленном огне 20 минут"
    ],
    description: "Легкий плов на завтрак",
  },
  {
    id: "breakfast-10",
    title: "Яйца с помидорами",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
    calories: 200,
    time: 15,
    difficulty: "Легко",
    category: "Завтрак",
    ingredients: ["4 яйца", "3 помидора", "1 луковица", "Масло", "Соль, перец, зелень"],
    instructions: [
      "Нарежьте помидоры кубиками, лук полукольцами",
      "Обжарьте лук на масле до прозрачности",
      "Добавьте помидоры, тушите 5 минут",
      "Взбейте яйца с солью и перцем",
      "Влейте яйца к помидорам, перемешайте",
      "Готовьте 3-4 минуты, посыпьте зеленью"
    ],
    description: "Простое и полезное блюдо",
  },
  {
    id: "lunch-1",
    title: "Плов",
    image: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400",
    calories: 650,
    time: 90,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["1кг риса", "1кг баранины", "1кг моркови", "4 луковицы", "200мл масла", "Зира, барбарис"],
    instructions: [
      "Нарежьте мясо крупными кусками, лук полукольцами",
      "Морковь нарежьте длинной соломкой",
      "Раскалите казан, налейте масло",
      "Обжарьте мясо до корочки, добавьте лук",
      "Добавьте морковь, жарьте 15 минут",
      "Залейте кипятком, тушите 40 минут",
      "Промойте рис, выложите ровным слоем",
      "Залейте водой выше риса на 2см",
      "Варите на сильном огне до испарения воды",
      "Накройте крышкой, томите 30 минут"
    ],
    description: "Классический узбекский плов",
  },
  {
    id: "lunch-2",
    title: "Шурпа",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 450,
    time: 120,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["1кг баранины", "4 картофелины", "3 моркови", "2 луковицы", "3 помидора", "Зелень"],
    instructions: [
      "Нарежьте мясо крупными кусками",
      "Залейте мясо холодной водой, доведите до кипения",
      "Снимите пену, варите 1 час",
      "Нарежьте овощи крупными кусками",
      "Добавьте лук и морковь, варите 20 минут",
      "Добавьте картофель и помидоры",
      "Варите до готовности картофеля",
      "Посолите, добавьте зелень"
    ],
    description: "Наваристый мясной суп",
  },
  {
    id: "lunch-3",
    title: "Лагман",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    calories: 550,
    time: 60,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["400г лапши", "500г мяса", "2 перца", "3 помидора", "1 редька", "Лук, чеснок", "Специи"],
    instructions: [
      "Нарежьте мясо соломкой, обжарьте на сильном огне",
      "Добавьте нарезанный лук и чеснок",
      "Нарежьте овощи соломкой",
      "Добавьте перец, редьку, обжарьте 5 минут",
      "Добавьте помидоры, залейте водой",
      "Тушите 20 минут, добавьте специи",
      "Отварите лапшу отдельно",
      "Выложите лапшу, полейте подливой"
    ],
    description: "Лапша с мясом и овощами",
  },
  {
    id: "lunch-4",
    title: "Мантышка",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
    calories: 480,
    time: 50,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["500г муки", "500г фарша", "3 луковицы", "200г тыквы", "Соль, перец", "Масло"],
    instructions: [
      "Замесите тесто из муки и воды, оставьте на 30 минут",
      "Смешайте фарш с мелко нарезанным луком",
      "Добавьте тертую тыкву, соль, перец",
      "Раскатайте тесто, нарежьте на квадраты",
      "Выложите начинку, защипните края конвертом",
      "Готовьте на пару 40-45 минут",
      "Подавайте со сметаной"
    ],
    description: "Манты на пару",
  },
  {
    id: "lunch-5",
    title: "Димляма",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    calories: 420,
    time: 80,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["1кг мяса", "6 картофелин", "1 капуста", "4 моркови", "3 луковицы", "Специи"],
    instructions: [
      "Нарежьте мясо кусочками среднего размера",
      "Нарежьте все овощи крупными кусками",
      "В казан выложите слоями: лук, мясо, морковь",
      "Затем капусту и картофель",
      "Посолите, добавьте специи",
      "Влейте немного воды, накройте крышкой",
      "Тушите на медленном огне 1,5 часа",
      "Не перемешивайте до готовности"
    ],
    description: "Тушеное мясо с овощами",
  },
  {
    id: "lunch-6",
    title: "Нарын",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    calories: 520,
    time: 90,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["500г конины", "500г теста для лапши", "3 луковицы", "Специи", "Зелень"],
    instructions: [
      "Отварите конину с луком до мягкости (1,5 часа)",
      "Раскатайте тесто тонко, подсушите 10 минут",
      "Нарежьте лапшу тонкой соломкой",
      "Отварите лапшу в подсоленной воде",
      "Нарежьте мясо тонкими ломтиками",
      "Нарежьте лук тонкими кольцами",
      "Смешайте лапшу, мясо, лук",
      "Полейте бульоном, посыпьте зеленью"
    ],
    description: "Традиционное блюдо с кониной",
  },
  {
    id: "lunch-7",
    title: "Самса с мясом",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    calories: 400,
    time: 45,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["500г слоеного теста", "500г баранины", "3 луковицы", "Курдючный жир", "Зира, соль"],
    instructions: [
      "Нарежьте мясо мелкими кубиками",
      "Мелко нарежьте лук и курдючный жир",
      "Смешайте мясо, лук, жир, добавьте зиру и соль",
      "Раскатайте тесто, нарежьте квадратами",
      "Выложите начинку, защипните треугольником",
      "Смажьте яйцом, посыпьте кунжутом",
      "Выпекайте при 200°C 35-40 минут"
    ],
    description: "Хрустящая самса с мясной начинкой",
  },
  {
    id: "lunch-8",
    title: "Мастава",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 380,
    time: 60,
    difficulty: "Средне",
    category: "Обед",
    ingredients: ["200г риса", "500г баранины", "3 помидора", "2 моркови", "Лук", "Зелень"],
    instructions: [
      "Нарежьте мясо кусочками, обжарьте",
      "Добавьте нарезанный лук, обжарьте",
      "Добавьте тертую морковь",
      "Нарежьте помидоры, добавьте к мясу",
      "Залейте водой, варите 30 минут",
      "Добавьте промытый рис",
      "Варите до готовности риса",
      "Посыпьте зеленью перед подачей"
    ],
    description: "Густой рисовый суп",
  },
  {
    id: "lunch-9",
    title: "Хасип",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 500,
    time: 120,
    difficulty: "Сложно",
    category: "Обед",
    ingredients: ["Бараньи кишки", "500г печени", "300г риса", "Лук", "Специи", "Курдючный жир"],
    instructions: [
      "Тщательно промойте кишки",
      "Мелко нарубите печень и лук",
      "Отварите рис до полуготовности",
      "Смешайте печень, рис, лук, специи",
      "Наполните кишки начинкой неплотно",
      "Завяжите концы ниткой",
      "Варите в воде 1,5 часа на слабом огне",
      "Подавайте нарезанным кружочками"
    ],
    description: "Колбаса из баранины",
  },
  {
    id: "lunch-10",
    title: "Шашлык",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 450,
    time: 40,
    difficulty: "Легко",
    category: "Обед",
    ingredients: ["1кг баранины", "3 луковицы", "Зира", "Соль, перец", "Уксус"],
    instructions: [
      "Нарежьте мясо кусками 4×4см",
      "Нарежьте лук кольцами",
      "Смешайте мясо с луком, зирой, солью",
      "Добавьте немного уксуса",
      "Маринуйте 2-3 часа в холодильнике",
      "Нанижите мясо на шампуры",
      "Жарьте на углях, переворачивая",
      "Подавайте с луком и зеленью"
    ],
    description: "Мясо на углях",
  },
  {
    id: "dinner-1",
    title: "Салат Ачичук",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    calories: 120,
    time: 10,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["4 помидора", "2 луковицы", "Кинза", "Базилик", "Соль", "Масло"],
    instructions: [
      "Нарежьте помидоры крупными дольками",
      "Лук нарежьте тонкими полукольцами",
      "Мелко нарубите зелень",
      "Смешайте все ингредиенты",
      "Посолите по вкусу",
      "Заправьте растительным маслом",
      "Дайте настояться 10 минут"
    ],
    description: "Легкий овощной салат",
  },
  {
    id: "dinner-2",
    title: "Салат Ташкент",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
    calories: 180,
    time: 15,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["1 редька", "2 моркови", "300г отварного мяса", "3 яйца", "Майонез", "Соль"],
    instructions: [
      "Натрите редьку на крупной терке",
      "Посолите, дайте постоять 10 минут, отожмите",
      "Натрите морковь",
      "Нарежьте мясо соломкой",
      "Отварите яйца, нарежьте кубиками",
      "Смешайте все ингредиенты",
      "Заправьте майонезом, перемешайте"
    ],
    description: "Сытный салат",
  },
  {
    id: "dinner-3",
    title: "Чалоп",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 150,
    time: 15,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["500мл катыка", "3 редиса", "2 огурца", "Зелень", "Соль", "Вода"],
    instructions: [
      "Взбейте катык с холодной водой (1:1)",
      "Нарежьте редис тонкими кружочками",
      "Огурцы нарежьте мелкими кубиками",
      "Мелко нарубите зелень",
      "Добавьте овощи в катык",
      "Посолите по вкусу",
      "Охладите перед подачей"
    ],
    description: "Холодный суп на катыке",
  },
  {
    id: "dinner-4",
    title: "Кабоб",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400",
    calories: 350,
    time: 30,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["500г фарша", "2 луковицы", "Зира", "Кориандр", "Соль, перец"],
    instructions: [
      "Мелко нарежьте лук",
      "Смешайте фарш с луком",
      "Добавьте специи, соль, перец",
      "Хорошо вымесите фарш",
      "Сформируйте продолговатые котлеты",
      "Нанижите на шампуры",
      "Жарьте на углях 15-20 минут"
    ],
    description: "Котлеты на углях",
  },
  {
    id: "dinner-5",
    title: "Салат из редьки",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    calories: 100,
    time: 10,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["1 редька", "1 луковица", "Масло", "Соль", "Перец"],
    instructions: [
      "Натрите редьку на крупной терке",
      "Посолите, дайте постоять 10 минут",
      "Отожмите лишний сок",
      "Лук нарежьте тонкими полукольцами",
      "Смешайте редьку с луком",
      "Заправьте маслом",
      "Поперчите по вкусу"
    ],
    description: "Острый салат",
  },
  {
    id: "dinner-6",
    title: "Жаркое",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    calories: 380,
    time: 40,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["500г мяса", "6 картофелин", "2 луковицы", "3 помидора", "Специи"],
    instructions: [
      "Нарежьте мясо кусочками",
      "Обжарьте мясо до золотистой корочки",
      "Добавьте нарезанный лук",
      "Картофель нарежьте кубиками, добавьте к мясу",
      "Обжарьте 10 минут",
      "Добавьте нарезанные помидоры",
      "Тушите под крышкой 20 минут"
    ],
    description: "Жареное мясо с картофелем",
  },
  {
    id: "dinner-7",
    title: "Шавит",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    calories: 200,
    time: 20,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["Укроп", "Мята", "Базилик", "Кинза", "500мл катыка", "Соль"],
    instructions: [
      "Мелко нарубите всю зелень",
      "Залейте зелень кипятком на 5 минут",
      "Слейте воду, охладите",
      "Взбейте катык",
      "Добавьте зелень в катык",
      "Посолите по вкусу",
      "Подавайте холодным"
    ],
    description: "Травяной суп",
  },
  {
    id: "dinner-8",
    title: "Хоним",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
    calories: 320,
    time: 35,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["500г муки", "4 картофелины", "2 луковицы", "Масло для жарки", "Соль"],
    instructions: [
      "Замесите тесто из муки, воды и соли",
      "Отварите картофель, разомните в пюре",
      "Обжарьте лук, смешайте с пюре",
      "Раскатайте тесто, нарежьте кружками",
      "Выложите начинку, защипните края",
      "Обжарьте на масле до золотистого цвета",
      "Подавайте горячими"
    ],
    description: "Хрустящие чебуреки",
  },
  {
    id: "dinner-9",
    title: "Катык с зеленью",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    calories: 90,
    time: 5,
    difficulty: "Легко",
    category: "Ужин",
    ingredients: ["500мл катыка", "Укроп", "2 зубчика чеснока", "Соль"],
    instructions: [
      "Мелко нарубите укроп",
      "Раздавите чеснок",
      "Смешайте катык с зеленью и чесноком",
      "Посолите по вкусу",
      "Хорошо перемешайте",
      "Охладите 10 минут",
      "Подавайте как соус или самостоятельное блюдо"
    ],
    description: "Легкий йогурт",
  },
  {
    id: "dinner-10",
    title: "Кутабы",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    calories: 280,
    time: 30,
    difficulty: "Средне",
    category: "Ужин",
    ingredients: ["300г муки", "Зелень (шпинат, кинза)", "100г сыра", "Масло", "Соль"],
    instructions: [
      "Замесите мягкое тесто, оставьте на 20 минут",
      "Мелко нарубите зелень",
      "Натрите сыр на терке",
      "Смешайте зелень с сыром",
      "Раскатайте тесто тонко, вырежьте круги",
      "Выложите начинку на половину, накройте",
      "Обжарьте на сухой сковороде с обеих сторон",
      "Смажьте маслом после жарки"
    ],
    description: "Тонкие лепешки с начинкой",
  },
];

const CATEGORIES = ["Все", "Популярные", "Завтрак", "Обед", "Ужин"];

const mapMealType = (mealType?: string): string => {
  if (!mealType) return "Обед";
  const lower = mealType.toLowerCase();
  if (lower.includes("завтрак") || lower === "breakfast") return "Завтрак";
  if (lower.includes("обед") || lower === "lunch") return "Обед";
  if (lower.includes("ужин") || lower === "dinner") return "Ужин";
  return "Обед";
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Легко":
      return "#51CF66";
    case "Средне":
      return "#FFD43B";
    case "Сложно":
      return "#FF6B6B";
    default:
      return "#9A9A9E";
  }
};

const getPopularColor = () => "#FF6B9D";

const CategoryChip = memo(function CategoryChip({
  category,
  isActive,
  onPress,
  chipStyles,
  textStyles,
}: {
  category: string;
  isActive: boolean;
  onPress: () => void;
  chipStyles: any;
  textStyles: any;
}) {
  const iconColor = useMemo(
    () => (isActive ? "#FFFFF0" : getPopularColor()),
    [isActive]
  );

  const iconStyle = useMemo(() => ({ marginRight: 6 }), []);

  return (
    <TouchableOpacity
      style={chipStyles}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {category === "Популярные" && (
        <Ionicons
          name="flame"
          size={14}
          color={iconColor}
          style={iconStyle}
        />
      )}
      <Text style={textStyles}>{category}</Text>
    </TouchableOpacity>
  );
});

function RecipesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [serverRecipes, setServerRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const loadServerRecipes = useCallback(async () => {
    try {
      const recipes = await apiService.getPopularRecipes(50);
      if (recipes.length === 0) {
        setServerRecipes([]);
        return;
      }
      
      const usageCounts = recipes.map((r: any) => r.usage_count || 0).sort((a, b) => b - a);
      const maxUsageCount = usageCounts[0] || 0;
      
      let popularThreshold: number;
      if (maxUsageCount <= 3) {
        popularThreshold = 2;
      } else if (maxUsageCount <= 10) {
        popularThreshold = 3;
      } else {
        popularThreshold = Math.max(5, Math.floor(maxUsageCount * 0.3));
      }
      
      const mapped: Recipe[] = recipes.map((r: any) => ({
        id: `server-${r.id}`,
        title: r.name,
        image: r.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        calories: r.calories || 0,
        time: r.time || 30,
        difficulty: r.difficulty || "Средне",
        category: mapMealType(r.meal_type),
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        description: r.description || "",
        usageCount: r.usage_count || 0,
        isPopular: (r.usage_count || 0) >= popularThreshold,
      }));
      setServerRecipes(mapped);
    } catch {
      setServerRecipes([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        loadServerRecipes();
      });
    }, [loadServerRecipes])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServerRecipes();
    setRefreshing(false);
  }, [loadServerRecipes]);

  const allRecipes = useMemo(() => {
    const combined = [...serverRecipes, ...UZBEK_RECIPES];
    const seen = new Set<string>();
    return combined.filter(r => {
      if (seen.has(r.title.toLowerCase())) return false;
      seen.add(r.title.toLowerCase());
      return true;
    });
  }, [serverRecipes]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiService.searchRecipes(query.trim());
      if (results.length === 0) {
        setSearchResults([]);
        return;
      }
      
      const usageCounts = results.map((r: any) => r.usage_count || 0).sort((a, b) => b - a);
      const maxUsageCount = usageCounts[0] || 0;
      
      let popularThreshold: number;
      if (maxUsageCount <= 3) {
        popularThreshold = 2;
      } else if (maxUsageCount <= 10) {
        popularThreshold = 3;
      } else {
        popularThreshold = Math.max(5, Math.floor(maxUsageCount * 0.3));
      }
      
      const mapped: Recipe[] = results.map((r: any) => ({
        id: `server-${r.id}`,
        title: r.name,
        image: r.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        calories: r.calories || 0,
        time: r.time || 30,
        difficulty: r.difficulty || "Средне",
        category: mapMealType(r.meal_type),
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        description: r.description || "",
        usageCount: r.usage_count || 0,
        isPopular: (r.usage_count || 0) >= popularThreshold,
      }));
      setSearchResults(mapped);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const filteredRecipes = useMemo(() => {
    if (searchQuery.trim().length >= 2) {
      return searchResults;
    }
    if (selectedCategory === "Все") return allRecipes;
    if (selectedCategory === "Популярные") {
      return allRecipes.filter((recipe) => recipe.isPopular);
    }
    return allRecipes.filter((recipe) => recipe.category === selectedCategory);
  }, [selectedCategory, allRecipes, searchQuery, searchResults]);

  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      hapticMedium();
      router.push({
        pathname: "/recipe-detail",
        params: {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          calories: recipe.calories.toString(),
          time: recipe.time.toString(),
          difficulty: recipe.difficulty,
          category: recipe.category,
          description: recipe.description,
          ingredients: JSON.stringify(recipe.ingredients),
          instructions: JSON.stringify(recipe.instructions),
        },
      } as any);
    },
    [router]
  );

  const handleCategoryPress = useCallback((category: string) => {
    hapticLight();
    setSelectedCategory(category);
  }, []);

  const handleGenerateButtonPress = useCallback(() => {
    hapticMedium();
    setShowGenerateModal(true);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleGenerateRecipe = async () => {
    const sanitizedPrompt = sanitizeString(prompt.trim(), 500);
    if (!sanitizedPrompt) {
      Alert.alert("Ошибка", "Опишите желаемый рецепт");
      return;
    }

    setGenerating(true);
    try {
      const result = await apiService.generateRecipe(sanitizedPrompt);
      setShowGenerateModal(false);
      setPrompt("");

      await loadServerRecipes();

      const imageUrl = result.recipe.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";

      Alert.alert(
        "Рецепт создан!",
        `Рецепт "${result.recipe.name}" успешно добавлен в ваш рацион.`,
        [
          {
            text: "Посмотреть",
            onPress: () => {
              router.push({
                pathname: "/recipe-detail",
                params: {
                  id: result.recipe.id ? `server-${result.recipe.id}` : "ai",
                  title: result.recipe.name,
                  image: imageUrl,
                  calories: result.recipe.calories?.toString() || "0",
                  time: result.recipe.time?.toString() || "30",
                  difficulty: result.recipe.difficulty || "Средне",
                  category: mapMealType(result.recipe.meal_type),
                  description: result.recipe.description || "",
                  ingredients: JSON.stringify(result.recipe.ingredients || []),
                  instructions: JSON.stringify(result.recipe.instructions || []),
                },
              } as any);
            },
          },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      Alert.alert("Ошибка", error.message || "Не удалось создать рецепт");
    } finally {
      setGenerating(false);
    }
  };

  const AnimatedRecipeCard = memo(({ 
    item, 
    index, 
    width,
    onPress,
  }: { 
    item: Recipe; 
    index: number;
    width?: number;
    onPress: (recipe: Recipe) => void;
  }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const pressScale = useSharedValue(1);

    useEffect(() => {
      scale.value = withDelay(
        index * 50,
        withSpring(1, {
          damping: 15,
          stiffness: 100,
        })
      );
      opacity.value = withDelay(
        index * 50,
        withTiming(1, { duration: 300 })
      );
    }, [index]);

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value * pressScale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = useCallback(() => {
      "worklet";
      hapticLight();
      pressScale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 200,
      });
    }, []);

    const handlePressOut = useCallback(() => {
      "worklet";
      pressScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    }, []);

    const handlePress = useCallback(() => {
      hapticMedium();
      onPress(item);
    }, [item, onPress]);

    const cardWidth = width || ADAPTIVE_CARD_WIDTH;
    const difficultyColor = useMemo(
      () => (item.isPopular ? getPopularColor() : getDifficultyColor(item.difficulty)),
      [item.isPopular, item.difficulty]
    );
    const badgeIconStyle = useMemo(() => ({ marginRight: 4 }), []);

    return (
      <Animated.View style={[{ width: cardWidth }, animatedCardStyle]}>
        <TouchableOpacity
          style={styles.recipeCard}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.image,
              }}
              style={styles.recipeImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {item.isPopular ? (
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                <Ionicons name="flame" size={10} color="#FFFFF0" style={badgeIconStyle} />
                <Text style={styles.difficultyText}>Популярный</Text>
              </View>
            ) : (
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                <Text style={styles.difficultyText}>{item.difficulty}</Text>
              </View>
            )}
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={11} color="#FFFFF0" />
              <Text style={styles.timeBadgeText}>{item.time} мин</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.recipeInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="flame" size={12} color={colors.primary} />
                <Text style={styles.infoText}>{item.calories} ккал</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderRecipeCard = useCallback(
    ({ item, index }: { item: Recipe; index: number }) => (
      <AnimatedRecipeCard item={item} index={index} onPress={handleRecipePress} />
    ),
    [handleRecipePress]
  );

  const keyExtractor = useCallback((item: Recipe) => item.id, []);

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        {isSearching ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Поиск...</Text>
          </>
        ) : searchQuery.trim().length >= 2 ? (
          <>
            <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Ничего не найдено</Text>
            <Text style={styles.emptySubtext}>Попробуйте другой запрос</Text>
          </>
        ) : (
          <>
            <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Рецепты не найдены</Text>
            <Text style={styles.emptySubtext}>Создайте свой первый рецепт!</Text>
          </>
        )}
      </View>
    ),
    [isSearching, searchQuery, colors, styles]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
    ),
    [refreshing, onRefresh, colors.primary]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Рецепты</Text>
          <Text style={styles.headerSubtitle}>Найдите идеальное блюдо</Text>
        </View>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateButtonPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFF0" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск рецептов..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleSearchClear}
              style={styles.searchClear}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim().length < 2 && (
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <CategoryChip
                  key={category}
                  category={category}
                  isActive={isActive}
                  onPress={() => handleCategoryPress(category)}
                  chipStyles={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  textStyles={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlashList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={keyExtractor}
        numColumns={ADAPTIVE_COLUMNS}
        removeClippedSubviews={true}
        drawDistance={250}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={listEmptyComponent}
        extraData={selectedCategory}
      />

      <Modal
        visible={showGenerateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowGenerateModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Создать рецепт</Text>
              <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Опишите желаемый рецепт</Text>
                <Text style={styles.inputHint}>
                  Например: "Сделай мне завтрак на 300 калорий, у меня есть яйца, молоко и овсянка"
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Опишите тип приёма пищи, калорийность, доступные ингредиенты..."
                  placeholderTextColor={colors.textSecondary}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (generating || !prompt.trim()) && styles.submitButtonDisabled,
                ]}
                onPress={handleGenerateRecipe}
                disabled={generating || !prompt.trim()}
                activeOpacity={0.8}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFF0" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFF0" />
                    <Text style={styles.submitButtonText}>Создать рецепт</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default memo(RecipesScreen);

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: "Inter_800ExtraBold",
      color: colors.text,
      marginBottom: 2,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      opacity: 0.7,
    },
    generateButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "#2C2C2E" : colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...(Platform.OS === "android" ? { elevation: 4 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
          }
        : {}),
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    searchInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2C2C2E" : colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : colors.border,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    searchClear: {
      marginLeft: 8,
      padding: 4,
    },
    categoriesWrapper: {
      marginBottom: 16,
      backgroundColor: colors.background,
    },
    categoriesContent: {
      paddingHorizontal: 20,
      gap: 8,
      paddingVertical: 4,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: isDark ? "#2C2C2E" : "rgba(0, 0, 0, 0.06)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "transparent",
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: isDark ? "#3A3A3C" : colors.primary,
      borderColor: isDark ? colors.primary : colors.primary,
      ...(Platform.OS === "android" ? { elevation: 5 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
          }
        : {}),
      transform: [{ scale: 1.05 }],
    },
    categoryText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: isDark ? "#9A9A9E" : "rgba(0, 0, 0, 0.65)",
    },
    categoryTextActive: {
      fontFamily: "Inter_700Bold",
      color: "#FFFFF0",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    row: {
      justifyContent: "space-between",
      marginBottom: 16,
    },
    recipeCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      ...(Platform.OS === "android" ? { elevation: 4 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
          }
        : {}),
      marginBottom: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "transparent",
    },
    imageContainer: {
      width: "100%",
      height: 140,
      position: "relative",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F5F5F5",
      overflow: "hidden",
    },
    recipeImage: {
      width: "100%",
      height: "100%",
    },
    difficultyBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      ...(Platform.OS === "android" ? { elevation: 3 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }
        : {}),
    },
    difficultyText: {
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      color: "#FFFFF0",
      letterSpacing: 0.3,
    },
    timeBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      ...(Platform.OS === "android" ? { elevation: 2 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
          }
        : {}),
    },
    timeBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFF0",
    },
    cardContent: {
      padding: 12,
      // backgroundColor removed to prevent overdraw (parent already has it)
    },
    recipeTitle: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.text,
      marginBottom: 6,
      minHeight: 36,
      lineHeight: 20,
      letterSpacing: -0.2,
    },
    categoryTag: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    },
    categoryTagText: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    recipeInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      marginTop: 2,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    infoText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalOverlayTouchable: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingBottom: 32,
      paddingHorizontal: 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    modalBody: {
      maxHeight: 400,
    },
    inputGroup: {
      gap: 6,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    inputHint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      backgroundColor: colors.background,
      color: colors.text,
      height: 100,
      textAlignVertical: "top",
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: isDark ? "#2C2C2E" : colors.primary,
      ...(Platform.OS === "android" ? { elevation: 3 } : {}),
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
          }
        : {}),
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#FFFFF0",
    },
  });
